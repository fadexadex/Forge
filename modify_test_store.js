const fs = require('fs');

const path = '/Users/fadex/Downloads/coding-apps/forge/src/stores/testStore.js';
let content = fs.readFileSync(path, 'utf8');

// Import useMcpStore and executeWorkflow
if (!content.includes('import { useMcpStore }')) {
  content = content.replace("import { create } from 'zustand';", "import { create } from 'zustand';\nimport { useMcpStore } from './mcpStore';\nimport { executeWorkflow } from '../utils/workflowExecutor';\nimport { WORKFLOW_NODE_TYPES } from '../utils/constants';");
}


// Replace the end part of the store definition
const newStoreContent = `  // Test mode
  testMode: 'external', // 'external' | 'builder'
  
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

  connectBuilder: () => {
    const mcpState = useMcpStore.getState();
    const builderServer = mcpState.getSelectedServer();
    
    if (!builderServer) {
        set({ connectionStatus: 'disconnected', connectionError: 'No builder server found. Create one first.', testMode: 'builder' });
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
           name: t.name,
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
      selectedItemType: 'tool', // In the future, prompts and resources
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
      const tool = get().getSelectedTool();
      if (tool?.inputSchema?.properties) {
        Object.entries(tool.inputSchema.properties).forEach(([key, schema]) => {
          const val = args[key];
          if ((schema.type === 'array' || schema.type === 'object') && typeof val === 'string' && val.trim()) {
            try { args[key] = JSON.parse(val); } catch { /* leave as string */ }
          }
        });
      }
      Object.keys(args).forEach((key) => {
        if (args[key] === '' || args[key] == null) delete args[key];
      });
    }

    const startTime = performance.now();
    let response;
    
    if (testMode === 'builder') {
        const tool = get().getSelectedTool();
        if (tool?.originalTool) {
            const result = await executeWorkflow(tool.originalTool.nodes, tool.originalTool.edges, args);
            const responseTime = Math.round(performance.now() - startTime);
            response = {
                success: result.success,
                data: result.success ? result.data : null,
                error: result.success ? null : result.error,
                responseTime,
            };
        } else {
            response = { success: false, error: 'Original builder tool not found', responseTime: 0 };
        }
    } else {
        const delay = 200 + Math.random() * 400;
        await new Promise((r) => setTimeout(r, delay));
        const responseTime = Math.round(performance.now() - startTime);

        const mockFn = MOCK_RESPONSES[selectedToolName];
        const mockData = mockFn ? mockFn(args) : { message: 'Tool executed successfully', input: args };
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
`;

const startIndex = content.indexOf('  // Getters');
const endIndex = content.lastIndexOf('}));');
if (startIndex !== -1 && endIndex !== -1) {
   content = content.substring(0, startIndex) + newStoreContent;
   fs.writeFileSync(path, content);
   console.log('Modified successfully.');
} else {
   console.log('Failed to target replace string');
}

