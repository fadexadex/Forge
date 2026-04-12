import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';
import {
  clamp,
  getToolWidgetResourceUri,
  titleFromToolName,
} from './helpers.js';

const expectedToolCallSchema = z.object({
  toolName: z.string(),
  expectedArgs: z.record(z.unknown()).default({}),
  argMatchMode: z.enum(['exact', 'subset', 'keys-only']).default('subset'),
});

const generatedScenarioSchema = z.object({
  title: z.string().min(3),
  description: z.string().default(''),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  mode: z.enum(['positive', 'negative']),
  tags: z.array(z.string()).default([]),
  scenarioText: z.string().min(8),
  userPrompt: z.string().min(8),
  expectedToolCalls: z.array(expectedToolCallSchema).default([]),
  expectedOutput: z.string().min(8),
});

const responseSchema = z.object({
  scenarios: z.array(generatedScenarioSchema),
});

function createToolReference(tools = []) {
  return tools.map((tool) => ({
    name: tool.name,
    description: tool.description || '',
    inputSchema: tool.inputSchema || { type: 'object', properties: {} },
    widgetResourceUri: getToolWidgetResourceUri(tool),
  }));
}

function buildSystemPrompt({ count, distribution }) {
  return `You are generating MCP evaluation scenarios for a developer tool called Forge.

Return ${count} evaluation scenarios as JSON.

Rules:
- Keep scenarios concise, realistic, and grounded in the provided tool descriptions.
- Include this distribution exactly when possible: easy=${distribution.easy}, medium=${distribution.medium}, hard=${distribution.hard}, negative=${distribution.negative}.
- Negative scenarios should describe cases where the agent should avoid calling tools.
- Positive scenarios can include multi-step tool chains.
- When a tool has a widget or app UI, include at least one widget-oriented scenario.
- expectedToolCalls must only reference tool names from the provided list.
- expectedArgs should contain realistic, typed arguments when the schema makes them obvious.
- expectedOutput should describe the user-visible result or app experience.
- tags should be short labels like AI, NEG, multi-step, widget, retrieval, analysis.
- Do not invent tools.`;
}

function buildUserPrompt({ serverInfo, tools, resources, prompts, count, distribution }) {
  return `Server: ${serverInfo?.name || 'Unknown MCP server'}
Version: ${serverInfo?.version || 'unknown'}

Available tools:
${JSON.stringify(createToolReference(tools), null, 2)}

Available resources:
${JSON.stringify((resources || []).map((resource) => ({
    name: resource.name,
    description: resource.description,
    uri: resource.uri,
    mimeType: resource.mimeType,
  })), null, 2)}

Available prompts:
${JSON.stringify((prompts || []).map((prompt) => ({
    name: prompt.name,
    description: prompt.description,
    arguments: prompt.arguments || [],
  })), null, 2)}

Generate ${count} scenarios with distribution:
${JSON.stringify(distribution, null, 2)}`;
}

function coerceExpectedToolCalls(toolNames, expectedToolCalls = [], fallbackToolName = null, mode = 'positive') {
  const validCalls = (expectedToolCalls || [])
    .filter((call) => toolNames.has(call.toolName))
    .map((call) => ({
      toolName: call.toolName,
      expectedArgs: call.expectedArgs || {},
      argMatchMode: call.argMatchMode || 'subset',
    }));

  if (mode === 'negative') {
    return [];
  }

  if (validCalls.length > 0) {
    return validCalls;
  }

  if (!fallbackToolName) {
    return [];
  }

  return [{
    toolName: fallbackToolName,
    expectedArgs: {},
    argMatchMode: 'keys-only',
  }];
}

function createGenericPositiveScenario(tool, difficulty = 'easy', title = null) {
  const widgetResourceUri = getToolWidgetResourceUri(tool);

  return {
    title: title || titleFromToolName(tool.name),
    description: tool.description || '',
    difficulty,
    mode: 'positive',
    tags: widgetResourceUri ? ['AI', 'widget'] : ['AI'],
    scenarioText: `User wants help related to ${titleFromToolName(tool.name).toLowerCase()}.`,
    userPrompt: `Use ${tool.name} to help me with this request.`,
    expectedToolCalls: [{
      toolName: tool.name,
      expectedArgs: {},
      argMatchMode: 'keys-only',
    }],
    expectedOutput: widgetResourceUri
      ? `A successful response that opens or references the ${titleFromToolName(tool.name)} app experience.`
      : `A successful response that clearly uses ${tool.name} and summarizes the result for the user.`,
  };
}

function buildFallbackScenarios({ tools = [], count = 6 }) {
  const widgetTools = tools.filter((tool) => getToolWidgetResourceUri(tool));
  const toolByName = new Map(tools.map((tool) => [tool.name, tool]));

  const scenarios = [];

  if (toolByName.has('get-sales-data')) {
    scenarios.push({
      title: 'Fetch revenue data for specific states',
      description: 'Retrieve state-level revenue metrics for a specific year and period.',
      difficulty: 'easy',
      mode: 'positive',
      tags: ['AI', 'retrieval'],
      scenarioText: 'User needs to retrieve sales revenue metrics for specific Indian states with monthly granularity.',
      userPrompt: 'Get me the revenue data for Maharashtra, Tamil Nadu, and Karnataka for 2024 on a monthly basis.',
      expectedToolCalls: [{
        toolName: 'get-sales-data',
        expectedArgs: {
          metric: 'revenue',
          period: 'monthly',
          states: ['MH', 'TN', 'KA'],
          year: '2024',
        },
        argMatchMode: 'subset',
      }],
      expectedOutput: 'Structured sales report containing revenue breakdown by month and state for the requested period.',
    });
  }

  if (toolByName.has('get-sales-data') && toolByName.has('visualize-sales-data')) {
    scenarios.push({
      title: 'Generate interactive sales visualization',
      description: 'Fetch data then visualize it as an app-backed chart experience.',
      difficulty: 'medium',
      mode: 'positive',
      tags: ['AI', 'multi-step', 'widget'],
      scenarioText: 'User wants a chart-based view of monthly revenue for multiple states.',
      userPrompt: 'Show me a visual dashboard of monthly revenue for Maharashtra, Tamil Nadu, and Karnataka in 2024.',
      expectedToolCalls: [
        {
          toolName: 'get-sales-data',
          expectedArgs: {
            metric: 'revenue',
            period: 'monthly',
            states: ['MH', 'TN', 'KA'],
            year: '2024',
          },
          argMatchMode: 'subset',
        },
        {
          toolName: 'visualize-sales-data',
          expectedArgs: {
            selections: {},
            report: {},
          },
          argMatchMode: 'keys-only',
        },
      ],
      expectedOutput: 'An interactive chart or widget showing the requested revenue breakdown.',
    });
  }

  if (toolByName.has('get-sales-data') && toolByName.has('show-sales-pdf-report')) {
    scenarios.push({
      title: 'Build and export a comprehensive report',
      description: 'Retrieve sales data and generate a downloadable PDF report.',
      difficulty: 'hard',
      mode: 'positive',
      tags: ['AI', 'multi-step', 'export'],
      scenarioText: 'User wants a report they can save or share after reviewing sales metrics.',
      userPrompt: 'Create a report with monthly revenue for Maharashtra, Tamil Nadu, and Karnataka in 2024 and prepare it as a PDF.',
      expectedToolCalls: [
        {
          toolName: 'get-sales-data',
          expectedArgs: {
            metric: 'revenue',
            period: 'monthly',
            states: ['MH', 'TN', 'KA'],
            year: '2024',
          },
          argMatchMode: 'subset',
        },
        {
          toolName: 'show-sales-pdf-report',
          expectedArgs: {
            selections: {},
            report: {},
          },
          argMatchMode: 'keys-only',
        },
      ],
      expectedOutput: 'A PDF-oriented report experience with the requested sales data summarized and ready to download.',
    });
  }

  if (toolByName.has('get-sales-data')) {
    scenarios.push({
      title: 'Get quarterly orders data',
      description: 'Request a different metric and period using the same reporting tool.',
      difficulty: 'medium',
      mode: 'positive',
      tags: ['AI', 'retrieval'],
      scenarioText: 'User wants quarterly order volume for a subset of states.',
      userPrompt: 'Get quarterly orders data for Maharashtra and Karnataka in 2024.',
      expectedToolCalls: [{
        toolName: 'get-sales-data',
        expectedArgs: {
          metric: 'orders',
          period: 'quarterly',
          states: ['MH', 'KA'],
          year: '2024',
        },
        argMatchMode: 'subset',
      }],
      expectedOutput: 'Structured orders data grouped by quarter for the requested states and year.',
    });
  }

  scenarios.push({
    title: 'Casual conversation about states and periods',
    description: 'The user is talking casually and no MCP tool should be required.',
    difficulty: 'easy',
    mode: 'negative',
    tags: ['AI', 'NEG'],
    scenarioText: 'User is having a casual conversation about sales terminology and not asking for a report.',
    userPrompt: 'What is the difference between monthly and quarterly reporting for state sales data?',
    expectedToolCalls: [],
    expectedOutput: 'A plain-language explanation without triggering MCP tools.',
  });

  scenarios.push({
    title: 'Vague request without enough parameters',
    description: 'The request is too underspecified to confidently invoke tools.',
    difficulty: 'medium',
    mode: 'negative',
    tags: ['AI', 'NEG', 'ambiguity'],
    scenarioText: 'User asks vaguely for sales help without specifying states, metric, or timeframe.',
    userPrompt: 'Can you help me with a sales report?',
    expectedToolCalls: [],
    expectedOutput: 'A clarifying response that asks for the missing details instead of calling tools immediately.',
  });

  for (const tool of widgetTools) {
    if (scenarios.length >= count) break;
    scenarios.push(createGenericPositiveScenario(tool, 'easy'));
  }

  for (const tool of tools) {
    if (scenarios.length >= count) break;
    if (scenarios.some((scenario) => scenario.expectedToolCalls.some((call) => call.toolName === tool.name))) {
      continue;
    }
    scenarios.push(createGenericPositiveScenario(tool, 'easy'));
  }

  while (scenarios.length < count && tools.length > 0) {
    const tool = tools[scenarios.length % tools.length];
    scenarios.push(createGenericPositiveScenario(tool, 'easy', `${titleFromToolName(tool.name)} Check`));
  }

  return scenarios.slice(0, count);
}

function normalizeGeneratedScenarios({ scenarios = [], tools = [], count = 6 }) {
  const toolNames = new Set((tools || []).map((tool) => tool.name));
  const fallbackToolName = tools[0]?.name || null;

  const normalized = scenarios.map((scenario) => {
    const widgetTag = (scenario.expectedToolCalls || []).some((call) => {
      const tool = tools.find((candidate) => candidate.name === call.toolName);
      return !!getToolWidgetResourceUri(tool);
    });

    const tags = Array.from(new Set([
      ...(scenario.tags || []),
      'AI',
      scenario.mode === 'negative' ? 'NEG' : null,
      widgetTag ? 'widget' : null,
      (scenario.expectedToolCalls || []).length > 1 ? 'multi-step' : null,
    ].filter(Boolean)));

    return {
      title: scenario.title,
      description: scenario.description || '',
      difficulty: scenario.difficulty,
      mode: scenario.mode,
      tags,
      scenarioText: scenario.scenarioText,
      userPrompt: scenario.userPrompt,
      expectedToolCalls: coerceExpectedToolCalls(
        toolNames,
        scenario.expectedToolCalls,
        fallbackToolName,
        scenario.mode
      ),
      expectedOutput: scenario.expectedOutput,
    };
  });

  return normalized.slice(0, count);
}

export async function generateEvalScenarios({
  serverInfo,
  tools = [],
  resources = [],
  prompts = [],
  apiKey,
  count = 6,
  distribution = {
    easy: 2,
    medium: 2,
    hard: 1,
    negative: 1,
  },
}) {
  if (!apiKey) {
    throw new Error('A Gemini API key is required to auto-generate evaluation scenarios.');
  }

  const google = createGoogleGenerativeAI({ apiKey });
  const fallbackScenarios = buildFallbackScenarios({ tools, count });

  try {
    const result = await generateObject({
      model: google('gemini-2.5-flash'),
      schema: responseSchema,
      temperature: 0.4,
      system: buildSystemPrompt({ count, distribution }),
      prompt: buildUserPrompt({ serverInfo, tools, resources, prompts, count, distribution }),
    });

    const generated = normalizeGeneratedScenarios({
      scenarios: result.object?.scenarios || [],
      tools,
      count,
    });

    if (generated.length === 0) {
      return fallbackScenarios;
    }

    if (generated.length < count) {
      const combined = [...generated, ...fallbackScenarios].slice(0, count);
      return combined;
    }

    return generated;
  } catch (error) {
    console.warn('Falling back to heuristic evaluation scenarios:', error);
    return fallbackScenarios.map((scenario) => ({
      ...scenario,
      passCriteria: {
        minTrajectoryScore: clamp(0.75),
        minOutputScore: clamp(0.7),
        failOnUnexpectedTools: true,
      },
    }));
  }
}
