import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText, tool, jsonSchema } from 'ai';

export async function sendChatMessage({
  messages,
  mcpTools,
  mcpClient,
  apiKey,
  onToolCall,
  onToolResult,
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
        onToolCall?.(mcpTool.name, args);
        const result = await mcpClient.callTool(mcpTool.name, args);
        onToolResult?.(mcpTool.name, args, result);
        return result;
      },
    });
  }

  const result = await generateText({
    model: google('gemini-2.5-flash'),
    tools,
    messages: messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
    maxSteps: 5,
  });

  return {
    text: result.text,
    toolCalls: result.steps.flatMap((s) => s.toolCalls || []),
    toolResults: result.steps.flatMap((s) => s.toolResults || []),
  };
}

// Gemini requires functionDeclaration.parameters to be type:"object".
// Some MCP servers omit the schema or use non-object types — normalise here.
function normalizeSchema(schema) {
  if (!schema || typeof schema !== 'object') {
    return { type: 'object', properties: {} };
  }
  if (schema.type !== 'object') {
    return { type: 'object', properties: {}, ...schema };
  }
  if (!schema.properties) {
    return { ...schema, properties: {} };
  }
  return schema;
}
