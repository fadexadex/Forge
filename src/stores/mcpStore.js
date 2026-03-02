import { create } from 'zustand';
import { WORKFLOW_NODE_TYPES, TRANSPORT_TYPES } from '../utils/constants';

// Generate unique IDs
const generateId = () => Math.random().toString(36).substring(2, 15);

// Create initial Input and Output nodes for a new tool
const createInitialNodes = () => {
  const inputId = generateId();
  const outputId = generateId();

  return {
    nodes: [
      {
        id: inputId,
        type: WORKFLOW_NODE_TYPES.INPUT,
        position: { x: 100, y: 100 },
        data: {
          parameters: [],
        },
      },
      {
        id: outputId,
        type: WORKFLOW_NODE_TYPES.OUTPUT,
        position: { x: 100, y: 400 },
        data: {
          returnPath: '',
        },
      },
    ],
    edges: [],
  };
};

export const useMcpStore = create((set, get) => ({
  // State
  servers: [],
  selectedServerId: null,
  selectedToolId: null,

  // Modal states
  isCreateServerModalOpen: false,
  isCreateToolModalOpen: false,
  isAddNodePickerOpen: false,
  createToolForServerId: null,

  // Node picker context for edge/handle insertion
  nodePickerContext: null, // { type: 'edge' | 'handle', sourceId?, targetId?, nodeId?, handleId?, position? }

  // Node Detail View (NDV) state
  selectedNodeId: null,
  isNDVOpen: false,
  nodeExecutionData: {}, // { [nodeId]: { input, output } }
  nodeMockData: {}, // { [nodeId]: { input, output } }

  // UI state
  activeTab: 'create', // 'create' or 'test'

  // Getters
  getSelectedServer: () => {
    const { servers, selectedServerId } = get();
    return servers.find(s => s.id === selectedServerId) || null;
  },

  getSelectedTool: () => {
    const { servers, selectedServerId, selectedToolId } = get();
    const server = servers.find(s => s.id === selectedServerId);
    if (!server) return null;
    return server.tools.find(t => t.id === selectedToolId) || null;
  },

  // Tab actions
  setActiveTab: (tab) => set({ activeTab: tab }),

  // Modal actions
  openCreateServerModal: () => set({ isCreateServerModalOpen: true }),
  closeCreateServerModal: () => set({ isCreateServerModalOpen: false }),

  openCreateToolModal: (serverId) => set({
    isCreateToolModalOpen: true,
    createToolForServerId: serverId
  }),
  closeCreateToolModal: () => set({
    isCreateToolModalOpen: false,
    createToolForServerId: null
  }),

  openAddNodePicker: (context = null) => set({ isAddNodePickerOpen: true, nodePickerContext: context }),
  closeAddNodePicker: () => set({ isAddNodePickerOpen: false, nodePickerContext: null }),

  // NDV actions
  openNDV: (nodeId) => set({ selectedNodeId: nodeId, isNDVOpen: true }),
  closeNDV: () => set({ isNDVOpen: false }),
  setNodeMockData: (nodeId, type, data) => set((state) => ({
    nodeMockData: {
      ...state.nodeMockData,
      [nodeId]: {
        ...state.nodeMockData[nodeId],
        [type]: data,
      },
    },
  })),

  // Server actions
  addServer: (name, transport = TRANSPORT_TYPES.STDIO) => {
    const newServer = {
      id: generateId(),
      name,
      transport,
      tools: [],
    };

    set((state) => ({
      servers: [...state.servers, newServer],
      isCreateServerModalOpen: false,
    }));

    return newServer;
  },

  deleteServer: (serverId) => {
    set((state) => ({
      servers: state.servers.filter(s => s.id !== serverId),
      selectedServerId: state.selectedServerId === serverId ? null : state.selectedServerId,
      selectedToolId: state.selectedServerId === serverId ? null : state.selectedToolId,
    }));
  },

  selectServer: (serverId) => {
    set({ selectedServerId: serverId, selectedToolId: null });
  },

  // Tool actions
  addTool: (serverId, name, description = '') => {
    const { nodes, edges } = createInitialNodes();

    const newTool = {
      id: generateId(),
      name,
      description,
      nodes,
      edges,
    };

    set((state) => ({
      servers: state.servers.map(server =>
        server.id === serverId
          ? { ...server, tools: [...server.tools, newTool] }
          : server
      ),
      selectedServerId: serverId,
      selectedToolId: newTool.id,
      isCreateToolModalOpen: false,
      createToolForServerId: null,
    }));

    return newTool;
  },

  deleteTool: (serverId, toolId) => {
    set((state) => ({
      servers: state.servers.map(server =>
        server.id === serverId
          ? { ...server, tools: server.tools.filter(t => t.id !== toolId) }
          : server
      ),
      selectedToolId: state.selectedToolId === toolId ? null : state.selectedToolId,
    }));
  },

  selectTool: (serverId, toolId) => {
    set({ selectedServerId: serverId, selectedToolId: toolId });
  },

  // Node actions
  addNode: (nodeType, position = { x: 250, y: 250 }) => {
    const { selectedServerId, selectedToolId, servers, nodePickerContext } = get();
    if (!selectedServerId || !selectedToolId) return null;

    const server = servers.find(s => s.id === selectedServerId);
    const tool = server?.tools.find(t => t.id === selectedToolId);
    if (!tool) return null;

    // Calculate position based on context
    let nodePosition = position;
    if (nodePickerContext?.position) {
      nodePosition = nodePickerContext.position;
    } else if (nodePickerContext?.type === 'edge' && nodePickerContext.sourceId && nodePickerContext.targetId) {
      // Position between source and target
      const sourceNode = tool.nodes.find(n => n.id === nodePickerContext.sourceId);
      const targetNode = tool.nodes.find(n => n.id === nodePickerContext.targetId);
      if (sourceNode && targetNode) {
        nodePosition = {
          x: (sourceNode.position.x + targetNode.position.x) / 2,
          y: (sourceNode.position.y + targetNode.position.y) / 2,
        };
      }
    }

    const newNode = {
      id: generateId(),
      type: nodeType,
      position: nodePosition,
      data: getDefaultNodeData(nodeType),
    };

    let newEdges = [...tool.edges];

    // Handle edge insertion: remove old edge, add two new edges
    if (nodePickerContext?.type === 'edge' && nodePickerContext.sourceId && nodePickerContext.targetId) {
      const edgeId = `${nodePickerContext.sourceId}-${nodePickerContext.targetId}`;
      newEdges = newEdges.filter(e => e.id !== edgeId);

      // Add edge from source to new node
      newEdges.push({
        id: `${nodePickerContext.sourceId}-${newNode.id}`,
        source: nodePickerContext.sourceId,
        target: newNode.id,
        sourceHandle: nodePickerContext.sourceHandle || null,
      });

      // Add edge from new node to target
      newEdges.push({
        id: `${newNode.id}-${nodePickerContext.targetId}`,
        source: newNode.id,
        target: nodePickerContext.targetId,
        targetHandle: nodePickerContext.targetHandle || null,
      });
    }

    set({
      servers: servers.map(s =>
        s.id === selectedServerId
          ? {
              ...s,
              tools: s.tools.map(t =>
                t.id === selectedToolId
                  ? {
                      ...t,
                      nodes: [...t.nodes, newNode],
                      edges: newEdges,
                    }
                  : t
              ),
            }
          : s
      ),
      isAddNodePickerOpen: false,
      nodePickerContext: null,
    });

    return newNode;
  },

  updateNode: (nodeId, updates) => {
    const { selectedServerId, selectedToolId, servers } = get();
    if (!selectedServerId || !selectedToolId) return;

    set({
      servers: servers.map(server =>
        server.id === selectedServerId
          ? {
              ...server,
              tools: server.tools.map(tool =>
                tool.id === selectedToolId
                  ? {
                      ...tool,
                      nodes: tool.nodes.map(node =>
                        node.id === nodeId
                          ? { ...node, ...updates }
                          : node
                      ),
                    }
                  : tool
              ),
            }
          : server
      ),
    });
  },

  updateNodeData: (nodeId, dataUpdates) => {
    const { selectedServerId, selectedToolId, servers } = get();
    if (!selectedServerId || !selectedToolId) return;

    set({
      servers: servers.map(server =>
        server.id === selectedServerId
          ? {
              ...server,
              tools: server.tools.map(tool =>
                tool.id === selectedToolId
                  ? {
                      ...tool,
                      nodes: tool.nodes.map(node =>
                        node.id === nodeId
                          ? { ...node, data: { ...node.data, ...dataUpdates } }
                          : node
                      ),
                    }
                  : tool
              ),
            }
          : server
      ),
    });
  },

  deleteNode: (nodeId) => {
    const { selectedServerId, selectedToolId, servers } = get();
    if (!selectedServerId || !selectedToolId) return;

    set({
      servers: servers.map(server =>
        server.id === selectedServerId
          ? {
              ...server,
              tools: server.tools.map(tool =>
                tool.id === selectedToolId
                  ? {
                      ...tool,
                      nodes: tool.nodes.filter(n => n.id !== nodeId),
                      edges: tool.edges.filter(e => e.source !== nodeId && e.target !== nodeId),
                    }
                  : tool
              ),
            }
          : server
      ),
    });
  },

  // Update node positions (for React Flow drag)
  updateNodePosition: (nodeId, position) => {
    const { selectedServerId, selectedToolId, servers } = get();
    if (!selectedServerId || !selectedToolId) return;

    set({
      servers: servers.map(server =>
        server.id === selectedServerId
          ? {
              ...server,
              tools: server.tools.map(tool =>
                tool.id === selectedToolId
                  ? {
                      ...tool,
                      nodes: tool.nodes.map(node =>
                        node.id === nodeId
                          ? { ...node, position }
                          : node
                      ),
                    }
                  : tool
              ),
            }
          : server
      ),
    });
  },

  // Edge actions
  addEdge: (edge) => {
    const { selectedServerId, selectedToolId, servers } = get();
    if (!selectedServerId || !selectedToolId) return;

    const newEdge = {
      id: `${edge.source}-${edge.target}`,
      ...edge,
    };

    set({
      servers: servers.map(server =>
        server.id === selectedServerId
          ? {
              ...server,
              tools: server.tools.map(tool =>
                tool.id === selectedToolId
                  ? { ...tool, edges: [...tool.edges, newEdge] }
                  : tool
              ),
            }
          : server
      ),
    });
  },

  deleteEdge: (edgeId) => {
    const { selectedServerId, selectedToolId, servers } = get();
    if (!selectedServerId || !selectedToolId) return;

    set({
      servers: servers.map(server =>
        server.id === selectedServerId
          ? {
              ...server,
              tools: server.tools.map(tool =>
                tool.id === selectedToolId
                  ? { ...tool, edges: tool.edges.filter(e => e.id !== edgeId) }
                  : tool
              ),
            }
          : server
      ),
    });
  },

  // Update edges (for React Flow)
  setEdges: (edges) => {
    const { selectedServerId, selectedToolId, servers } = get();
    if (!selectedServerId || !selectedToolId) return;

    set({
      servers: servers.map(server =>
        server.id === selectedServerId
          ? {
              ...server,
              tools: server.tools.map(tool =>
                tool.id === selectedToolId
                  ? { ...tool, edges }
                  : tool
              ),
            }
          : server
      ),
    });
  },
}));

// Helper: Get default data for a node type
function getDefaultNodeData(nodeType) {
  switch (nodeType) {
    case WORKFLOW_NODE_TYPES.INPUT:
      return { parameters: [] };
    case WORKFLOW_NODE_TYPES.API_CALL:
      return {
        method: 'GET',
        url: '',
        authentication: {
          type: 'none',
          apiKey: { key: '', value: '', addTo: 'header' },
          bearerToken: { token: '' },
          basicAuth: { username: '', password: '' },
          oauth2: { accessToken: '' },
        },
        headers: { enabled: false, items: [] },
        queryParams: { enabled: false, items: [] },
        body: { enabled: false, contentType: 'application/json', content: '' },
        options: { enabled: false, timeout: 30000, followRedirects: true, validateSSL: true },
      };
    case WORKFLOW_NODE_TYPES.TRANSFORM:
      return { expression: '' };
    case WORKFLOW_NODE_TYPES.CONDITION:
      return { expression: '' };
    case WORKFLOW_NODE_TYPES.OUTPUT:
      return { returnPath: '' };
    case WORKFLOW_NODE_TYPES.CODE:
      return { code: '// Write your JavaScript code here\nreturn data;', language: 'javascript' };
    case WORKFLOW_NODE_TYPES.LOOP:
      return { arrayPath: 'data.items', itemVariable: 'item', indexVariable: 'index' };
    case WORKFLOW_NODE_TYPES.MERGE:
      return { mode: 'append', inputCount: 2 }; // append, combine, waitAll
    case WORKFLOW_NODE_TYPES.ERROR_HANDLER:
      return { continueOnError: false };
    default:
      return {};
  }
}
