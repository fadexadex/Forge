import { create } from 'zustand';
import { WORKFLOW_NODE_TYPES, TRANSPORT_TYPES } from '../utils/constants';

// Generate unique IDs
const generateId = () => Math.random().toString(36).substring(2, 15);

// Get all downstream node IDs from a starting node
function getDownstreamNodeIds(startId, edges) {
  const visited = new Set();
  const queue = [startId];
  while (queue.length > 0) {
    const id = queue.shift();
    if (visited.has(id)) continue;
    visited.add(id);
    edges.filter(e => e.source === id).forEach(e => queue.push(e.target));
  }
  return visited;
}

// Create initial Input and Output nodes for a new tool
const createInitialNodes = () => {
  const inputId = generateId();
  const outputId = generateId();

  return {
    nodes: [
      {
        id: inputId,
        type: WORKFLOW_NODE_TYPES.INPUT,
        position: { x: 100, y: 200 },
        data: {
          parameters: [],
        },
      },
      {
        id: outputId,
        type: WORKFLOW_NODE_TYPES.OUTPUT,
        position: { x: 500, y: 200 },
        data: {
          returnPath: '',
        },
      },
    ],
    edges: [
      { id: `${inputId}-${outputId}`, source: inputId, target: outputId },
    ],
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

  updateTool: (updates) => {
    const { selectedServerId, selectedToolId, servers } = get();
    if (!selectedServerId || !selectedToolId) return;
    set({
      servers: servers.map(server =>
        server.id === selectedServerId
          ? {
              ...server,
              tools: server.tools.map(tool =>
                tool.id === selectedToolId
                  ? { ...tool, ...updates }
                  : tool
              ),
            }
          : server
      ),
    });
  },

  // Node actions
  addNode: (nodeType, position = { x: 250, y: 250 }) => {
    const { selectedServerId, selectedToolId, servers, nodePickerContext } = get();
    if (!selectedServerId || !selectedToolId) return null;

    const server = servers.find(s => s.id === selectedServerId);
    const tool = server?.tools.find(t => t.id === selectedToolId);
    if (!tool) return null;

    const newNode = {
      id: generateId(),
      type: nodeType,
      position: { ...position },
      data: getDefaultNodeData(nodeType),
    };

    let newEdges = [...tool.edges];
    let updatedNodes = [...tool.nodes];

    if (nodePickerContext?.type === 'edge' && nodePickerContext.sourceId && nodePickerContext.targetId) {
      // Inserting on an edge — split the edge
      const sourceNode = tool.nodes.find(n => n.id === nodePickerContext.sourceId);
      const targetNode = tool.nodes.find(n => n.id === nodePickerContext.targetId);

      if (sourceNode && targetNode) {
        newNode.position = {
          x: sourceNode.position.x + 300,
          y: sourceNode.position.y,
        };

        // Shift the target and all its downstream nodes right by 300
        const downstreamIds = getDownstreamNodeIds(nodePickerContext.targetId, tool.edges);
        updatedNodes = updatedNodes.map(n => {
          if (downstreamIds.has(n.id)) {
            return { ...n, position: { ...n.position, x: n.position.x + 300 } };
          }
          return n;
        });
      }

      // Remove old edge
      const edgeId = `${nodePickerContext.sourceId}-${nodePickerContext.targetId}`;
      newEdges = newEdges.filter(e => e.id !== edgeId);

      // Add source → new node
      newEdges.push({
        id: `${nodePickerContext.sourceId}-${newNode.id}`,
        source: nodePickerContext.sourceId,
        target: newNode.id,
        sourceHandle: nodePickerContext.sourceHandle || null,
      });

      // Add new node → target
      newEdges.push({
        id: `${newNode.id}-${nodePickerContext.targetId}`,
        source: newNode.id,
        target: nodePickerContext.targetId,
        targetHandle: nodePickerContext.targetHandle || null,
      });

    } else if (nodePickerContext?.type === 'handle' && nodePickerContext.nodeId) {
      // Inserting after a specific node via + button
      const sourceId = nodePickerContext.nodeId;
      const sourceNode = tool.nodes.find(n => n.id === sourceId);

      if (sourceNode) {
        // Find outgoing edges from this node
        const outgoingEdges = newEdges.filter(e => e.source === sourceId);

        if (outgoingEdges.length > 0) {
          // There's an existing connection — insert between
          const targetEdge = outgoingEdges[0];
          const targetId = targetEdge.target;

          newNode.position = {
            x: sourceNode.position.x + 300,
            y: sourceNode.position.y,
          };

          // Shift target and downstream nodes right by 300
          const downstreamIds = getDownstreamNodeIds(targetId, tool.edges);
          updatedNodes = updatedNodes.map(n => {
            if (downstreamIds.has(n.id)) {
              return { ...n, position: { ...n.position, x: n.position.x + 300 } };
            }
            return n;
          });

          // Remove old edge
          newEdges = newEdges.filter(e => e.id !== targetEdge.id);

          // Add source → new node
          newEdges.push({
            id: `${sourceId}-${newNode.id}`,
            source: sourceId,
            target: newNode.id,
            sourceHandle: targetEdge.sourceHandle || null,
          });

          // Add new node → old target
          newEdges.push({
            id: `${newNode.id}-${targetId}`,
            source: newNode.id,
            target: targetId,
            targetHandle: targetEdge.targetHandle || null,
          });
        } else {
          // No outgoing edge — just append after
          newNode.position = {
            x: sourceNode.position.x + 300,
            y: sourceNode.position.y,
          };

          // Add edge from source to new node
          newEdges.push({
            id: `${sourceId}-${newNode.id}`,
            source: sourceId,
            target: newNode.id,
          });
        }
      }
    } else {
      // No context — find last node in chain before Output and insert before Output
      const outputNode = tool.nodes.find(n => n.type === WORKFLOW_NODE_TYPES.OUTPUT);
      if (outputNode) {
        // Find the node that connects to Output
        const edgeToOutput = newEdges.find(e => e.target === outputNode.id);
        if (edgeToOutput) {
          const sourceNode = tool.nodes.find(n => n.id === edgeToOutput.source);
          if (sourceNode) {
            newNode.position = {
              x: sourceNode.position.x + 300,
              y: sourceNode.position.y,
            };

            // Shift Output right
            updatedNodes = updatedNodes.map(n => {
              if (n.id === outputNode.id) {
                return { ...n, position: { ...n.position, x: n.position.x + 300 } };
              }
              return n;
            });

            // Remove edge to Output
            newEdges = newEdges.filter(e => e.id !== edgeToOutput.id);

            // Add source → new node
            newEdges.push({
              id: `${edgeToOutput.source}-${newNode.id}`,
              source: edgeToOutput.source,
              target: newNode.id,
              sourceHandle: edgeToOutput.sourceHandle || null,
            });

            // Add new node → Output
            newEdges.push({
              id: `${newNode.id}-${outputNode.id}`,
              source: newNode.id,
              target: outputNode.id,
            });
          } else {
            newNode.position = position;
          }
        } else {
          newNode.position = position;
        }
      }
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
                      nodes: [...updatedNodes, newNode],
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

    const server = servers.find(s => s.id === selectedServerId);
    const tool = server?.tools.find(t => t.id === selectedToolId);
    if (!tool) return;

    const newEdgeId = `${edge.source}-${edge.target}`;
    // Skip if this edge already exists
    if (tool.edges.some(e => e.id === newEdgeId)) return;

    const newEdge = {
      id: newEdgeId,
      ...edge,
    };

    set({
      servers: servers.map(s =>
        s.id === selectedServerId
          ? {
              ...s,
              tools: s.tools.map(t =>
                t.id === selectedToolId
                  ? { ...t, edges: [...t.edges, newEdge] }
                  : t
              ),
            }
          : s
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
