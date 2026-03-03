import { create } from 'zustand';

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
  {
    name: 'list_transactions',
    description: 'List recent transactions with optional date range and status filters. Results are paginated.',
    inputSchema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          description: 'Filter by transaction status',
          enum: ['pending', 'completed', 'failed', 'refunded'],
        },
        start_date: { type: 'string', description: 'Start date (ISO 8601 format, e.g. "2026-01-01")' },
        end_date: { type: 'string', description: 'End date (ISO 8601 format)' },
        page: { type: 'integer', description: 'Page number (default 1)' },
        per_page: { type: 'integer', description: 'Results per page (default 25, max 100)' },
      },
    },
    annotations: { readOnlyHint: true, idempotentHint: true },
  },
  {
    name: 'send_notification',
    description: 'Send a push notification or email to one or more users. Supports template variables.',
    inputSchema: {
      type: 'object',
      properties: {
        recipients: { type: 'array', description: 'Array of user IDs to notify: ["usr_1", "usr_2"]' },
        channel: {
          type: 'string',
          description: 'Notification channel',
          enum: ['push', 'email', 'sms', 'in_app'],
        },
        title: { type: 'string', description: 'Notification title/subject line' },
        body: { type: 'string', description: 'Notification body content. Supports {{variables}}.' },
        priority: {
          type: 'string',
          description: 'Delivery priority',
          enum: ['low', 'normal', 'high', 'urgent'],
        },
      },
      required: ['recipients', 'channel', 'title', 'body'],
    },
    annotations: { destructiveHint: true, openWorldHint: true },
  },
  {
    name: 'get_server_status',
    description: 'Returns the current health and status of all backend services. No input required.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
    annotations: { readOnlyHint: true, idempotentHint: true },
  },
  {
    name: 'transform_data',
    description: 'Apply a JSONPath expression or JMESPath query to transform an input data structure.',
    inputSchema: {
      type: 'object',
      properties: {
        input_data: { type: 'object', description: 'The source data object to transform' },
        expression: { type: 'string', description: 'JMESPath expression to apply (e.g. "users[?age > `30`].name")' },
        output_format: {
          type: 'string',
          description: 'Output format',
          enum: ['json', 'csv', 'yaml'],
        },
      },
      required: ['input_data', 'expression'],
    },
    annotations: { idempotentHint: true },
  },
  {
    name: 'delete_records',
    description: 'Permanently delete one or more records by ID. This action cannot be undone.',
    inputSchema: {
      type: 'object',
      properties: {
        collection: {
          type: 'string',
          description: 'The collection to delete from',
          enum: ['users', 'orders', 'products', 'sessions'],
        },
        record_ids: { type: 'array', description: 'Array of record IDs to delete: ["id_1", "id_2"]' },
        confirm: { type: 'boolean', description: 'Must be true to confirm deletion' },
      },
      required: ['collection', 'record_ids', 'confirm'],
    },
    annotations: { destructiveHint: true },
  },
  {
    name: 'run_analytics_query',
    description: 'Execute a read-only analytics query against the data warehouse. Supports SQL-like syntax.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'The analytics query to execute' },
        dataset: {
          type: 'string',
          description: 'Target dataset',
          enum: ['events', 'users', 'revenue', 'engagement'],
        },
        time_range: {
          type: 'string',
          description: 'Time range preset',
          enum: ['1h', '24h', '7d', '30d', '90d'],
        },
        group_by: { type: 'string', description: 'Column to group results by' },
      },
      required: ['query', 'dataset'],
    },
    annotations: { readOnlyHint: true },
  },
  {
    name: 'generate_report',
    description: 'Generate a formatted PDF or CSV report from a predefined template with custom parameters.',
    inputSchema: {
      type: 'object',
      properties: {
        template: {
          type: 'string',
          description: 'Report template to use',
          enum: ['monthly_summary', 'user_activity', 'revenue_breakdown', 'inventory_audit'],
        },
        date_range: { type: 'object', description: 'Date range: { "from": "2026-01-01", "to": "2026-01-31" }' },
        format: {
          type: 'string',
          description: 'Output format',
          enum: ['pdf', 'csv', 'xlsx'],
        },
        include_charts: { type: 'boolean', description: 'Include visual charts in the report (PDF only)' },
      },
      required: ['template', 'format'],
    },
    annotations: { readOnlyHint: true, idempotentHint: true },
  },
];

// Mock responses keyed by tool name
const MOCK_RESPONSES = {
  get_user: (args) => ({
    user: {
      id: args.user_id || 'usr_a1b2c3',
      name: 'Sarah Chen',
      email: 'sarah.chen@example.com',
      role: 'admin',
      avatar_url: 'https://i.pravatar.cc/150?u=sarah',
      created_at: '2025-03-15T09:22:00Z',
      last_login: '2026-03-03T08:14:32Z',
      preferences: { theme: 'dark', language: 'en', timezone: 'America/New_York' },
      ...(args.include_metadata ? {
        metadata: {
          login_count: 342,
          last_ip: '192.168.1.42',
          devices: ['MacBook Pro', 'iPhone 15'],
          mfa_enabled: true,
        },
      } : {}),
    },
  }),

  search_products: (args) => ({
    results: [
      { id: 'prod_001', name: 'Wireless Noise-Canceling Headphones', price: 249.99, category: args.category || 'electronics', in_stock: true, rating: 4.7 },
      { id: 'prod_002', name: 'Ergonomic Mechanical Keyboard', price: 179.00, category: args.category || 'electronics', in_stock: true, rating: 4.5 },
      { id: 'prod_003', name: 'Ultra-Wide 34" Monitor', price: 599.99, category: args.category || 'electronics', in_stock: false, rating: 4.8 },
    ],
    total: 47,
    page: 1,
    per_page: args.limit || 20,
    query: args.query,
  }),

  create_order: (args) => ({
    order: {
      id: 'ord_' + generateId(),
      status: 'confirmed',
      customer_id: args.customer_id || 'cust_demo',
      items_count: Array.isArray(args.items) ? args.items.length : 2,
      subtotal: 429.99,
      tax: 38.70,
      shipping: args.express_shipping ? 14.99 : 0,
      total: args.express_shipping ? 483.68 : 468.69,
      estimated_delivery: args.express_shipping ? '2026-03-05' : '2026-03-10',
      created_at: new Date().toISOString(),
    },
  }),

  list_transactions: (args) => ({
    transactions: [
      { id: 'txn_9f8e7d', amount: 149.99, currency: 'USD', status: args.status || 'completed', customer: 'Sarah Chen', created_at: '2026-03-03T10:15:00Z' },
      { id: 'txn_6c5b4a', amount: 89.50, currency: 'USD', status: args.status || 'completed', customer: 'James Wilson', created_at: '2026-03-03T09:42:00Z' },
      { id: 'txn_3a2b1c', amount: 324.00, currency: 'USD', status: 'pending', customer: 'Maria Garcia', created_at: '2026-03-02T22:08:00Z' },
      { id: 'txn_0z9y8x', amount: 59.99, currency: 'USD', status: 'refunded', customer: 'Alex Kim', created_at: '2026-03-02T18:30:00Z' },
    ],
    pagination: { page: args.page || 1, per_page: args.per_page || 25, total: 1284, total_pages: 52 },
  }),

  send_notification: (args) => ({
    notification: {
      id: 'notif_' + generateId(),
      status: 'queued',
      channel: args.channel || 'push',
      recipients_count: Array.isArray(args.recipients) ? args.recipients.length : 1,
      title: args.title || 'Notification',
      scheduled_at: new Date().toISOString(),
      estimated_delivery: '< 30 seconds',
    },
  }),

  get_server_status: () => ({
    status: 'healthy',
    uptime: '45d 12h 33m',
    version: '3.8.2',
    services: {
      api: { status: 'up', latency_ms: 12, requests_per_min: 2340 },
      database: { status: 'up', latency_ms: 3, connections: 42, pool_size: 100 },
      cache: { status: 'up', hit_rate: '94.2%', memory_usage: '1.2 GB / 4 GB' },
      queue: { status: 'up', pending_jobs: 18, workers: 8 },
      storage: { status: 'up', used: '234 GB', available: '766 GB' },
    },
    last_incident: '2026-02-18T03:22:00Z',
    next_maintenance: '2026-03-15T02:00:00Z',
  }),

  transform_data: (args) => ({
    result: {
      expression: args.expression || 'users[*].name',
      output_format: args.output_format || 'json',
      records_processed: 156,
      output: ['Alice Johnson', 'Bob Smith', 'Carol Williams', 'David Brown'],
    },
  }),

  delete_records: (args) => {
    if (!args.confirm) {
      return { __error: true, message: 'Deletion not confirmed. Set confirm to true to proceed.' };
    }
    return {
      deleted: {
        collection: args.collection || 'users',
        count: Array.isArray(args.record_ids) ? args.record_ids.length : 0,
        record_ids: args.record_ids || [],
        deleted_at: new Date().toISOString(),
      },
    };
  },

  run_analytics_query: (args) => ({
    query: args.query,
    dataset: args.dataset || 'events',
    time_range: args.time_range || '7d',
    execution_time_ms: 142,
    rows_scanned: 1_284_500,
    results: [
      { date: '2026-03-03', count: 12450, unique_users: 3420 },
      { date: '2026-03-02', count: 11890, unique_users: 3280 },
      { date: '2026-03-01', count: 13200, unique_users: 3610 },
      { date: '2026-02-28', count: 10950, unique_users: 3100 },
    ],
    ...(args.group_by ? { grouped_by: args.group_by } : {}),
  }),

  generate_report: (args) => ({
    report: {
      id: 'rpt_' + generateId(),
      template: args.template || 'monthly_summary',
      format: args.format || 'pdf',
      status: 'generated',
      pages: 12,
      file_size: '2.4 MB',
      download_url: `https://reports.example.com/rpt_${generateId()}.${args.format || 'pdf'}`,
      generated_at: new Date().toISOString(),
      includes_charts: args.include_charts || false,
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
  // Connection
  serverUrl: '',
  transportType: 'sse',
  connectionStatus: 'disconnected',
  connectionError: null,
  serverInfo: null,

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
  setServerUrl: (url) => set({ serverUrl: url }),
  setTransportType: (type) => set({ transportType: type }),

  connect: async () => {
    const { serverUrl } = get();
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
      inputValues: {},
      inputMode: 'form',
      rawJsonInput: JSON.stringify(skeleton, null, 2),
      lastResponse: null,
      history: [],
    });
  },

  setInputValue: (field, value) =>
    set((state) => ({
      inputValues: { ...state.inputValues, [field]: value },
    })),

  setInputMode: (mode) => set({ inputMode: mode }),
  setRawJsonInput: (json) => set({ rawJsonInput: json }),

  executeTool: async () => {
    const { selectedToolName, inputValues, inputMode, rawJsonInput } = get();
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

    // Simulate network delay (200-600ms)
    const delay = 200 + Math.random() * 400;
    await new Promise((r) => setTimeout(r, delay));
    const responseTime = Math.round(delay);

    // Get mock response
    const mockFn = MOCK_RESPONSES[selectedToolName];
    const mockData = mockFn ? mockFn(args) : { message: 'Tool executed successfully', input: args };

    // Check if mock signals an error
    const isError = mockData?.__error === true;

    const response = {
      success: !isError,
      data: isError ? null : mockData,
      error: isError ? mockData.message : null,
      responseTime,
    };

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
