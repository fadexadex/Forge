import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText, tool, jsonSchema } from 'ai';
import { classifyToolOutcome, getToolErrorMessage } from './toolOutcome.js';

export async function sendChatMessage({
  messages,
  mcpTools,
  mcpClient,
  apiKey,
  onToolCall,
  onToolResult,
  onTextDelta,
  system = `You are an AI assistant equipped with dynamic tools provided by connected MCP (Model Context Protocol) servers. Your goal is to proactively and autonomously use these tools to fulfill the user's requests.

CRITICAL INSTRUCTIONS:
1. Always prefer using the available tools over asking the user for clarification.
2. If a tool requires parameters you do not have, but is designed to gather them interactively or can be initiated with defaults, invoke it immediately rather than asking the user.
3. Adapt seamlessly to whatever tools are currently provided in your context. You may be connected to different servers at different times, so rely strictly on the provided tool descriptions to determine their capabilities.
4. Before calling ANY tool, you MUST first output a short conversational message explaining what you are about to do and why.
5. NEVER call the exact same tool with the exact same arguments repeatedly in a loop. Read the conversation history to see if you have already called a tool.
6. TOOL CHAINING — when calling a tool that requires data from a previous tool result, carefully read the target tool's inputSchema and map EACH required field explicitly from previous results and conversation context.
7. SCHEMA STRICTNESS — Never nest a previous result under a single key like "data" unless the target tool's schema explicitly requires a "data" property. If the schema asks for "selections" and "report", you MUST provide both at the top level of the tool arguments.
8. DATA PERSISTENCE — When chaining, if the target tool asks for a "selections" object (containing things like states, metric, period, year), you must reconstruct this object from the original user request or context, NOT from the previous tool's output if that output only contained the generated report.`,
}) {
  const google = createGoogleGenerativeAI({ apiKey });

  const tools = {};
  for (const mcpTool of mcpTools) {
    tools[mcpTool.name] = tool({
      description: mcpTool.description || '',
      // Use jsonSchema() to pass the MCP inputSchema directly — avoids
      // Zod conversion issues and guarantees Gemini always sees type:object.
      parameters: jsonSchema(normalizeSchema(mcpTool.inputSchema)),
      execute: async (args) => {
        const callId = Math.random().toString(36).substring(7);
        onToolCall?.(mcpTool.name, args, callId);
        const result = await mcpClient.callTool(mcpTool.name, args);
        await onToolResult?.(mcpTool.name, args, result, callId);

        const outcome = classifyToolOutcome(result);
        if (!outcome.ok) {
          throw new Error(getToolErrorMessage(result));
        }

          // Return clean data to the AI SDK so Gemini sees the actual
          // tool output shape (e.g. { selections, report }) rather than
        // the MCP transport wrapper ({ content, structuredContent, _meta, ... }).
        // This is critical for tool chaining — the next tool's inputSchema
        // expects fields from structuredContent, not the wrapper.
        return extractToolData(result);
      },
    });
  }

  const result = streamText({
    model: google('gemini-2.5-flash'),
    system,
    tools,
    messages: messages.filter((m) => {
      // Drop empty assistant messages (e.g. failed/empty prior turns) — they confuse the model
      if (m.role === 'assistant' && !m.content && !m.toolCalls?.length) return false;
      return true;
    }).flatMap((m) => {
      // Reconstruct proper AI SDK multi-part messages for assistant turns that
      // called tools. This is the key piece that lets Gemini see what data was
      // returned in previous turns so it can pass it to subsequent tools.
      if (m.role === 'assistant' && m.toolCalls?.length > 0) {
        const assistantContent = [];
        if (m.content) assistantContent.push({ type: 'text', text: m.content });
        for (const tc of m.toolCalls) {
          assistantContent.push({
            type: 'tool-call',
            toolCallId: tc.callId,
            toolName: tc.toolName,
            args: tc.args || {},
          });
        }

        const toolContent = m.toolCalls.map((tc) => ({
          type: 'tool-result',
          toolCallId: tc.callId,
          toolName: tc.toolName,
          // AI SDK v6: field is `output: { type, value }` — not `result`
          // Use extractToolData here too so history reconstruction shows clean data
          output: { type: 'json', value: extractToolData(tc.result ?? {}) },
        }));

        return [
          { role: 'assistant', content: assistantContent },
          { role: 'tool', content: toolContent },
        ];
      }

      return [{ role: m.role, content: m.content || '' }];
    }),
    maxSteps: 5,
  });

  // textStream yields only the final visible response text — it skips reasoning/thinking
  // tokens automatically, regardless of how the underlying model structures its output.
  // This is more robust than parsing fullStream event types, which vary across models.
  for await (const chunk of result.textStream) {
    if (chunk) onTextDelta?.(chunk);
  }

  const steps = await result.steps;

  return {
    text: await result.text,
    steps: (steps || []).map((s) => ({
      text: s.text || '',
      reasoning: s.reasoning || '',
      toolCalls: (s.toolCalls || []).map((tc) => ({ toolName: tc.toolName, args: tc.args })),
    })),
    toolCalls: (steps || []).flatMap((s) => s.toolCalls || []),
  };
}

// Gemini requires functionDeclaration.parameters to be type:"object".
// Some MCP servers omit the schema or use non-object types — normalise here.
function normalizeSchema(schema) {
  if (!schema || typeof schema !== 'object') {
    return { type: 'object', properties: {} };
  }
  if (schema.type !== 'object') {
    return { ...schema, type: 'object', properties: {} };
  }
  if (!schema.properties) {
    return { ...schema, properties: {} };
  }
  return schema;
}

/**
 * Extract the meaningful data from an MCP callTool result so the AI SDK
 * (and therefore Gemini) sees clean tool output rather than the transport
 * wrapper produced by McpClient.
 *
 * Priority:
 *  1. structuredContent — the rich typed object the server intended to return
 *  2. Parsed JSON from content[0].text — common pattern for text-only results
 *  3. The full result as-is — safe fallback
 */
function extractToolData(result) {
  if (!result || result.isError) return result;

  // 1. Prefer structuredContent (the canonical MCP rich-data field)
  if (result.structuredContent != null) {
    return result.structuredContent;
  }

  // 2. Try to parse JSON from the first text content block
  if (Array.isArray(result.content)) {
    const textBlock = result.content.find((c) => c.type === 'text');
    if (textBlock?.text) {
      try {
        return JSON.parse(textBlock.text);
      } catch {
        // Not JSON — return the text directly
        return { text: textBlock.text };
      }
    }
  }

  // 3. Fallback — return as-is
  return result;
}

export const __test = {
  extractToolData,
  normalizeSchema,
};
