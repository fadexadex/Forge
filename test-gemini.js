import { readFileSync, existsSync } from 'fs';
import { sendChatMessage } from './src/utils/aiChatService.js';

// Load .env manually if it exists and process.env is missing the key
if (existsSync('.env')) {
  const envText = readFileSync('.env', 'utf8');
  const match = envText.match(/^GEMINI_API_KEY=(.*)$/m);
  if (match && !process.env.GEMINI_API_KEY) {
    process.env.GEMINI_API_KEY = match[1].trim();
  }
}

const apiKey = process.env.GEMINI_API_KEY;

const mockTools = [
  {
    name: 'get_weather',
    description: 'Get the current weather for a location',
    inputSchema: {
      type: 'object',
      properties: {
        location: { type: 'string', description: 'City name' }
      },
      required: ['location'],
    },
  },
];

const mockClient = {
  callTool: async (name, args) => {
    return { _meta: {}, text: `The weather in ${args.location} is sunny and 72F.` };
  },
};

async function runTest() {
  if (!apiKey) {
    console.log('\n⚠️ No GEMINI_API_KEY environment variable found.');
    console.log('To hit the real Gemini model, run:');
    console.log('GEMINI_API_KEY="AIzaSy..." node test-gemini.js\n');
    return;
  }

  console.log('🤖 Sending message to Gemini...');
  console.log('User: "What is the weather in San Francisco?"\n');
  console.log('--- STREAM START ---\n');

  const result = await sendChatMessage({
    messages: [{ role: 'user', content: 'What is the weather in San Francisco?' }],
    mcpTools: mockTools,
    mcpClient: mockClient,
    apiKey: apiKey,
    onToolCall: (name, args) => {
      console.log(`\n\n[⚙️ TOOL CALL STARTED]: ${name}`);
      console.log(`[⚙️ TOOL ARGS]: ${JSON.stringify(args)}`);
    },
    onToolResult: (name, args, res) => {
      console.log(`[✅ TOOL RESULT]: ${JSON.stringify(res)}\n`);
    },
    onTextDelta: (delta) => {
      process.stdout.write(delta);
    },
  });

  console.log('\n\n--- STREAM END ---\n');
  
  console.log('🧠 === STEPS (Thoughts & Tool Calls) ===');
  console.log(JSON.stringify(result.steps, null, 2));
}

runTest().catch(console.error);

