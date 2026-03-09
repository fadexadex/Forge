import { create } from 'zustand';
import { useMcpStore } from './mcpStore';
import { executeWorkflow } from '../utils/workflowExecutor';
import { WORKFLOW_NODE_TYPES } from '../utils/constants';

const generateId = () => Math.random().toString(36).substring(2, 15);

// --- Mock data ---
const MOCK_TOOLS = [
  {
    name: 'get_user',
    description: 'Retrieve a user profile by their unique ID. Returns full profile data including contact info and preferences.',
    inputSchema: {
      type: 'object',
      properties: {
        user_id: { type: 'string', description: 'The unique identifier of the user (e.g. "usr_a1b2c3")' },
        include_metadata: { type: 'boolean', description: 'Include extended metadata like login history and device info' },
      },
      required: ['user_id'],
    },
    annotations: { readOnlyHint: true, idempotentHint: true },
  },
  {
    name: 'search_products',
    description: 'Search the product catalog with filters. Supports full-text search, category filtering, and pagination.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query string' },
        category: {
          type: 'string',
          description: 'Product category to filter by',
          enum: ['electronics', 'clothing', 'books', 'home', 'sports', 'toys'],
        },
        min_price: { type: 'number', description: 'Minimum price in USD' },
        max_price: { type: 'number', description: 'Maximum price in USD' },
        in_stock: { type: 'boolean', description: 'Only show items currently in stock' },
        limit: { type: 'integer', description: 'Max number of results (1-100, default 20)' },
      },
      required: ['query'],
    },
    annotations: { readOnlyHint: true },
  },
  {
    name: 'create_order',
    description: 'Create a new order for a customer. Validates inventory, calculates totals, and reserves stock.',
    inputSchema: {
      type: 'object',
      properties: {
        customer_id: { type: 'string', description: 'Customer ID to place the order for' },
        items: { type: 'array', description: 'Array of order items: [{ "product_id": "...", "quantity": 1 }]' },
        shipping_address: { type: 'object', description: 'Shipping address object: { "street": "...", "city": "...", "state": "...", "zip": "..." }' },
        coupon_code: { type: 'string', description: 'Optional discount coupon code' },
        express_shipping: { type: 'boolean', description: 'Use express 2-day shipping' },
      },
      required: ['customer_id', 'items', 'shipping_address'],
    },
    annotations: { destructiveHint: true },
  },
];

// Mock responses keyed by tool name
const MOCK_RESPONSES = {
  get_user: (args) => ({
    user: {
      id: args.user_id || 'usr_a1b2c3',
      name: 'Sarah Chen',
      email: 'sarah.chen@example.com',
    },
  }),
  search_products: (args) => ({
    results: [],
    query: args.query,
  }),
  create_order: (args) => ({
    order: {
      id: 'ord_' + generateId(),
      status: 'confirmed',
    },
  }),
};

// Derive server name from URL
function serverNameFromUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.hostname === 'localhost'
      ? `Local Dev Server (${parsed.port || 80})`
      : parsed.hostname;
  } catch {
    return 'MCP Server';
  }
}

// --- Store ---

export const useTestStore = create((set, get) => ({
  // Test mode
  testMode: 'external', // 'external' | 'builder'

  // Connection
  serverUrl: '',
  transportType: 'sse',
  connectionStatus: 'disconnected',
  connectionError: null,
  serverInfo: null,
  selectedBuilderServerId: null, // Server ID selected for builder preview

  // Tools
  tools: [],
  selectedToolName: null,
  searchQuery: '',

  // Execution
  inputValues: {},
  inputMode: 'form',
  rawJsonInput: '',
  isExecuting: false,
  lastResponse: null,

  // History
  history: [],
  isHistoryOpen: true,

  // Getters
  getSelectedTool: () => {
    const { tools, selectedToolName } = get();
    return tools.find((t) => t.name === selectedToolName) || null;
  },

  getFilteredTools: () => {
    const { tools, searchQuery } = get();
    if (!searchQuery.trim()) return tools;
    const q = searchQuery.toLowerCase();
    return tools.filter(
      (t) => t.name.toLowerCase().includes(q) || (t.description || '').toLowerCase().includes(q)
    );
  },

  // Actions
  setTestMode: (mode) => set({ testMode: mode }),

  setServerUrl: (url) => set({ serverUrl: url }),
  setTransportType: (type) => set({ transportType: type }),
  setSelectedBuilderServerId: (id) => set({ selectedBuilderServerId: id }),

  connectBuilder: () => {
    const { selectedBuilderServerId } = get();
    const mcpState = useMcpStore.getState();
    
    // Use the explicitly selected server for builder preview
    const builderServer = selectedBuilderServerId 
      ? mcpState.servers.find(s => s.id === selectedBuilderServerId)
      : mcpState.getSelectedServer();

    if (!builderServer) {
      set({ connectionStatus: 'disconnected', connectionError: 'No builder server found. Select a server first.', testMode: 'builder', serverInfo: null, tools: [] });
      return;
    }

    // Map builder tools into mock tools with inputSchema
    const builderTools = builderServer.tools.map(t => {
      const inputNode = t.nodes?.find(n => n.type === WORKFLOW_NODE_TYPES.INPUT);
      const parameters = inputNode?.data?.parameters || [];
      const properties = {};
      const required = [];

      parameters.forEach(p => {
        properties[p.name] = { type: p.type || 'string', description: p.description || '' };
        if (p.required) required.push(p.name);
      });

      return {
        name: t.name || 'Unnamed tool',
        description: t.description || '',
        inputSchema: {
          type: 'object',
          properties,
          required,
        },
        originalTool: t,
      };
    });

    set({
      testMode: 'builder',
      connectionStatus: 'connected',
      serverInfo: {
        name: builderServer.name + ' (Builder)',
        version: 'dev',
        protocolVersion: '2024-11-05',
      },
      tools: builderTools,
      connectionError: null,
      selectedToolName: null,
      searchQuery: '',
    });
  },

  connect: async () => {
    const { serverUrl, testMode } = get();

    if (testMode === 'builder') {
      get().connectBuilder();
      return;
    }

    if (!serverUrl.trim()) return;

    set({ connectionStatus: 'connecting', connectionError: null });

    // Simulate network delay (800-1500ms)
    await new Promise((r) => setTimeout(r, 800 + Math.random() * 700));

    set({
      connectionStatus: 'connected',
      serverInfo: {
        name: serverNameFromUrl(serverUrl),
        version: '1.4.0',
        protocolVersion: '2024-11-05',
      },
      tools: MOCK_TOOLS,
      connectionError: null,
    });
  },

  disconnect: () => {
    set({
      connectionStatus: 'disconnected',
      connectionError: null,
      serverInfo: null,
      tools: [],
      selectedToolName: null,
      searchQuery: '',
      inputValues: {},
      inputMode: 'form',
      rawJsonInput: '',
      isExecuting: false,
      lastResponse: null,
      history: [],
    });
  },

  selectTool: (name) => {
    const tool = get().tools.find((t) => t.name === name);
    const skeleton = {};
    if (tool?.inputSchema?.properties) {
      Object.keys(tool.inputSchema.properties).forEach((key) => {
        skeleton[key] = '';
      });
    }
    set({
      selectedToolName: name,
      inputValues: skeleton,
      inputMode: 'form',
      rawJsonInput: JSON.stringify(skeleton, null, 2),
      lastResponse: null,
      history: [],
    });
  },

  setInputValue: (field, value) =>
    set((state) => {
      const newInputValues = { ...state.inputValues, [field]: value };
      return {
        inputValues: newInputValues,
        rawJsonInput: JSON.stringify(newInputValues, null, 2),
      };
    }),

  setInputMode: (mode) => set({ inputMode: mode }),
  setRawJsonInput: (json) => {
    // Try to parse and sync to inputValues for bidirectional sync
    try {
      const parsed = JSON.parse(json);
      if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
        set({ rawJsonInput: json, inputValues: parsed });
      } else {
        // Not a valid object, just update the raw json
        set({ rawJsonInput: json });
      }
    } catch {
      // Invalid JSON, just update the raw string (user might be mid-edit)
      set({ rawJsonInput: json });
    }
  },

  executeTool: async () => {
    const { selectedToolName, inputValues, inputMode, rawJsonInput, testMode } = get();
    if (!selectedToolName) return;

    set({ isExecuting: true });

    let args;
    if (inputMode === 'json') {
      try {
        args = JSON.parse(rawJsonInput);
      } catch {
        set({
          isExecuting: false,
          lastResponse: {
            success: false,
            data: null,
            error: 'Invalid JSON input — check your syntax and try again.',
            responseTime: 0,
          },
        });
        return;
      }
    } else {
      args = { ...inputValues };
      // Parse array/object strings
      const tool = get().getSelectedTool();
      if (tool?.inputSchema?.properties) {
        Object.entries(tool.inputSchema.properties).forEach(([key, schema]) => {
          const val = args[key];
          if ((schema.type === 'array' || schema.type === 'object') && typeof val === 'string' && val.trim()) {
            try { args[key] = JSON.parse(val); } catch { /* leave as string */ }
          }
        });
      }
      // Clean empty values
      Object.keys(args).forEach((key) => {
        if (args[key] === '' || args[key] == null) delete args[key];
      });
    }

    const startTime = performance.now();
    let response;

    // BUILDER MODE 
    if (testMode === 'builder') {
      const tool = get().getSelectedTool();
      if (tool && tool.originalTool) {
        try {
          const result = await executeWorkflow(tool.originalTool.nodes, tool.originalTool.edges, args);
          const responseTime = Math.round(performance.now() - startTime);

          response = {
            success: result.success,
            data: result.success ? result.data : null,
            error: result.success ? null : result.error,
            responseTime,
            steps: result.steps
          };
        } catch (err) {
          response = {
            success: false,
            data: null,
            error: err.message || 'Execution failed',
            responseTime: Math.round(performance.now() - startTime),
          };
        }
      } else {
        response = {
          success: false,
          error: 'Original builder tool not found',
          responseTime: 0
        };
      }
    } else {
      // EXTERNAL MODE
      const delay = 200 + Math.random() * 400;
      await new Promise((r) => setTimeout(r, delay));
      const responseTime = Math.round(performance.now() - startTime);

      // Get mock response
      const mockFn = MOCK_RESPONSES[selectedToolName];
      const mockData = mockFn ? mockFn(args) : { message: 'Tool executed successfully', input: args };

      // Check if mock signals an error
      const isError = mockData?.__error === true;

      response = {
        success: !isError,
        data: isError ? null : mockData,
        error: isError ? mockData.message : null,
        responseTime,
      };
    }

    const historyEntry = {
      id: generateId(),
      toolName: selectedToolName,
      input: args,
      response,
      timestamp: new Date(),
    };

    set((state) => ({
      isExecuting: false,
      lastResponse: response,
      history: [historyEntry, ...state.history],
    }));
  },

  setSearchQuery: (query) => set({ searchQuery: query }),

  loadHistoryEntry: (id) => {
    const { history } = get();
    const entry = history.find((h) => h.id === id);
    if (!entry) return;

    set({
      inputValues: entry.input,
      rawJsonInput: JSON.stringify(entry.input, null, 2),
      lastResponse: entry.response,
    });
  },

  clearHistory: () => set({ history: [] }),
  toggleHistory: () => set((state) => ({ isHistoryOpen: !state.isHistoryOpen })),
}));
