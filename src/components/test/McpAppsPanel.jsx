import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useTestStore } from '../../stores/testStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { sendChatMessage } from '../../utils/aiChatService';
import { classifyToolOutcome, getToolErrorMessage } from '../../utils/toolOutcome';
import { useBridgeMessages } from './mcp-apps/useBridgeMessages.js';
import { ChatWidget } from './mcp-apps/ChatWidget.jsx';
import { createRuntimeId, useWidgetSessions } from './mcp-apps/useWidgetSessions.js';

// ─── Icons ───────────────────────────────────────────────────────────────────

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
  </svg>
);

const SparklesIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1-1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    <path d="M5 3v4" /><path d="M19 17v4" /><path d="M3 5h4" /><path d="M17 19h4" />
  </svg>
);

const DesktopIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="14" x="2" y="3" rx="2" /><line x1="8" x2="16" y1="21" y2="21" /><line x1="12" x2="12" y1="17" y2="21" />
  </svg>
);

const MobileIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="14" height="20" x="5" y="2" rx="2" ry="2" /><path d="M12 18h.01" />
  </svg>
);

const TabletIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="16" height="20" x="4" y="2" rx="2" ry="2" /><line x1="12" x2="12.01" y1="18" y2="18" />
  </svg>
);

const SearchIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);

const KeyIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path>
  </svg>
);

// ─── Main Panel ───────────────────────────────────────────────────────────────

export function McpAppsPanel() {
  const { tools, serverInfo, client } = useTestStore();
  const { geminiApiKey } = useSettingsStore();

  const [chatInput, setChatInput] = useState('');
  const [isLogsCollapsed, setIsLogsCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedToolSidebar, setExpandedToolSidebar] = useState(null);
  const [viewport, setViewport] = useState('desktop');
  const [messages, setMessages] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [logs, setLogs] = useState([]);

  const scrollRef = useRef(null);
  const messagesRef = useRef([]);
  const widgetRegistry = useRef(new Map());
  const toolTraceRef = useRef(new Map());
  const resourceCacheRef = useRef(new Map());
  const resourcePromiseRef = useRef(new Map());

  const {
    sessionsById,
    getWidgetSession,
    createWidgetSession,
    updateWidgetSession,
    setWidgetStatus,
    setWidgetModelContext,
    addWidgetWarning,
    appendWidgetEvent,
    startProxyToolCall,
    finishProxyToolCall,
    resetWidgetSessions,
  } = useWidgetSessions();

  // Keep messagesRef in sync so stale closures can read latest messages
  useEffect(() => { messagesRef.current = messages; }, [messages]);

  const viewports = [
    { id: 'mobile', icon: <MobileIcon />, label: 'Mobile', width: '375px' },
    { id: 'tablet', icon: <TabletIcon />, label: 'Tablet', width: '768px' },
    { id: 'desktop', icon: <DesktopIcon />, label: 'Desktop', width: '1200px' },
  ];

  const addLog = ({ dir, type, source = 'mcp-server' }) => {
    setLogs((prev) => [
      ...prev,
      { id: createRuntimeId('log'), dir, type, source, time: new Date().toLocaleTimeString() },
    ]);
  };

  // Auto-scroll: to the start of the latest message when it has widgets,
  // otherwise to the bottom.
  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    if (!lastMsg) return;
    if (lastMsg.role === 'assistant' && lastMsg.widgets?.length > 0) {
      const el = scrollRef.current?.querySelector(`[data-msg-id="${lastMsg.id}"]`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Append a hidden system context message to the conversation
  const appendContextMessage = (modelContext, widgetId = null) => {
    const modelVisibleContext =
      modelContext?.structuredContent ??
      modelContext?.content ??
      modelContext;

    const contextMsg = {
      id: createRuntimeId('ctx'),
      role: 'user',
      isHidden: true,
      content: `[System Note: The MCP app updated its model context${widgetId ? ` (widget ${widgetId})` : ''}]\n${JSON.stringify(modelVisibleContext, null, 2)}`,
    };
    setMessages((prev) => [...prev, contextMsg]);
  };

  // Fetch the HTML resource for a widget from MCP
  const fetchWidgetResource = async (resourceUri, { preload = false } = {}) => {
    if (!client) return null;

    if (resourceCacheRef.current.has(resourceUri)) {
      return resourceCacheRef.current.get(resourceUri);
    }

    if (resourcePromiseRef.current.has(resourceUri)) {
      return resourcePromiseRef.current.get(resourceUri);
    }

    addLog({
      dir: '->',
      type: `${preload ? 'resources/preload' : 'resources/read'}: ${resourceUri}`,
      source: 'mcp-apps-host',
    });

    const promise = client.readResource(resourceUri)
      .then((result) => {
        const resource = result.contents?.[0] || null;
        if (resource) {
          resourceCacheRef.current.set(resourceUri, resource);
        }
        addLog({
          dir: '<-',
          type: `resources/result: ${resourceUri}`,
          source: 'mcp-apps-host',
        });
        return resource;
      })
      .finally(() => {
        resourcePromiseRef.current.delete(resourceUri);
      });

    resourcePromiseRef.current.set(resourceUri, promise);
    return promise;
  };

  useEffect(() => {
    if (!client || !(tools || []).length) return;

    const uris = Array.from(new Set(
      tools
        .map((tool) => tool?._meta?.ui?.resourceUri)
        .filter(Boolean)
    ));

    uris.forEach((resourceUri) => {
      fetchWidgetResource(resourceUri, { preload: true }).catch(() => {
        // Preload failures are surfaced later when the tool is actually invoked.
      });
    });
  }, [client, tools]); // eslint-disable-line react-hooks/exhaustive-deps

  // PostMessage bridge — handles all iframe↔host communication
  useBridgeMessages({
    client,
    serverInfo,
    widgetRegistry,
    addLog,
    getWidgetSession,
    setWidgetStatus,
    setWidgetModelContext,
    updateWidgetSession,
    appendWidgetEvent,
    startProxyToolCall,
    finishProxyToolCall,
    addWidgetWarning,
    onContextUpdate: appendContextMessage,
  });

  // Core AI streaming runner
  const runAI = async (messagesToSend) => {
    if (!client || !geminiApiKey) return;
    const assistantMsgId = createRuntimeId('assistant');
    setMessages((prev) => [
      ...prev,
      { id: assistantMsgId, role: 'assistant', content: '', toolCalls: [], widgets: [] },
    ]);
    setIsStreaming(true);
    try {
      await sendChatMessage({
        messages: messagesToSend,
        mcpTools: tools,
        mcpClient: client,
        apiKey: geminiApiKey,
        onTextDelta: (delta) => {
          if (delta) {
            setMessages((prev) =>
              prev.map((m) => m.id === assistantMsgId ? { ...m, content: m.content + delta } : m)
            );
          }
        },
        onToolCall: (name, args, callId) => {
          toolTraceRef.current.set(callId, {
            traceId: createRuntimeId('trace'),
            startedAt: new Date().toISOString(),
            source: 'model',
            toolName: name,
            args,
          });
          addLog({ dir: '->', type: `tools/call: ${name}` });
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId ? {
                ...m,
                toolCalls: m.toolCalls.some(tc => tc.callId === callId)
                  ? m.toolCalls
                  : [...m.toolCalls, { toolName: name, args, callId, status: 'running' }],
              } : m
            )
          );
        },
        onToolResult: async (name, args, toolResult, callId) => {
          const outcome = classifyToolOutcome(toolResult);
          const toolTrace = toolTraceRef.current.get(callId) || {
            traceId: createRuntimeId('trace'),
            startedAt: new Date().toISOString(),
            source: 'model',
            toolName: name,
            args,
          };
          const outcomeMessage = outcome.ok ? null : getToolErrorMessage(toolResult);
          addLog({
            dir: '<-',
            type: outcome.ok
              ? `tools/result: ${name}`
              : `tools/error: ${name}${outcomeMessage ? ` (${outcomeMessage})` : ''}`,
          });

          // Mark tool call completion status
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId ? {
                ...m,
                toolCalls: m.toolCalls.map(tc =>
                  tc.callId === callId
                    ? { ...tc, status: outcome.ok ? 'completed' : 'failed', result: toolResult }
                    : tc
                ),
              } : m
            )
          );

          if (!outcome.ok) {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsgId
                  ? {
                    ...m,
                    content: m.content
                      ? `${m.content}\n\nTool error (${name}): ${outcomeMessage}`
                      : `Tool error (${name}): ${outcomeMessage}`,
                  }
                  : m
              )
            );
            toolTraceRef.current.delete(callId);
            return;
          }

          // Check if this tool result includes a UI resource to render
          const toolDef = tools.find((t) => t.name === name);
          const meta = toolResult._meta || toolDef?._meta;
          if (meta?.ui?.resourceUri) {
            const widgetId = createWidgetSession({
              traceId: toolTrace.traceId,
              toolName: name,
              resourceUri: meta.ui.resourceUri,
              invocationArgs: args,
              toolResult,
              source: 'model',
              status: 'resource_loading',
            });

            appendWidgetEvent(widgetId, {
              kind: 'tool-origin',
              source: 'model',
              message: `Model completed ${name}`,
              data: {
                traceId: toolTrace.traceId,
                startedAt: toolTrace.startedAt,
                completedAt: new Date().toISOString(),
              },
            });

            console.log('[McpAppsPanel] Creating widget session from model tool result:', {
              widgetId,
              toolName: name,
              assistantMsgId,
              resourceUri: meta.ui.resourceUri,
            });

            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsgId
                  ? {
                    ...m,
                    widgets: [...m.widgets, widgetId],
                  }
                  : m
              )
            );

            try {
              const resource = await fetchWidgetResource(meta.ui.resourceUri);
              if (resource?.text) {
                updateWidgetSession(widgetId, {
                  html: resource.text,
                  resourceMeta: resource._meta || null,
                });
                setWidgetStatus(widgetId, 'iframe_initializing');
                appendWidgetEvent(widgetId, {
                  kind: 'resource-ready',
                  source: 'host',
                  message: 'UI resource loaded and ready for iframe initialization',
                  data: { resourceUri: meta.ui.resourceUri },
                });
              } else {
                setWidgetStatus(widgetId, 'error', {
                  lastError: 'UI resource was empty or unavailable',
                });
                appendWidgetEvent(widgetId, {
                  kind: 'resource-error',
                  source: 'host',
                  message: 'UI resource was empty or unavailable',
                  data: { resourceUri: meta.ui.resourceUri },
                });
              }
            } catch (error) {
              setWidgetStatus(widgetId, 'error', { lastError: error.message });
              appendWidgetEvent(widgetId, {
                kind: 'resource-error',
                source: 'host',
                message: error.message,
                data: { resourceUri: meta.ui.resourceUri },
              });
            }
          }

          toolTraceRef.current.delete(callId);
        },
      });
    } catch (err) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId ? { ...m, content: `Error: ${err.message}`, isError: true } : m
        )
      );
    } finally {
      setIsStreaming(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    if (!geminiApiKey) {
      alert('Please configure your Gemini API key in Settings → API Keys.');
      return;
    }
    if (!client) {
      alert('Please connect to an MCP server first.');
      return;
    }
    if (isStreaming) return;
    const userMsg = { id: Date.now(), role: 'user', content: chatInput };
    setMessages((prev) => [...prev, userMsg]);
    setChatInput('');
    runAI([...messagesRef.current, userMsg]);
  };

  const filteredTools = (tools || []).filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const apiKeyMissing = !geminiApiKey;

  return (
    <div className="flex-1 flex h-full overflow-hidden bg-white text-sm">
      {/* Left Sidebar */}
      <div className="w-[360px] flex flex-col border-r border-neutral-200 shrink-0 bg-[#FCFCFC] z-20 shadow-[1px_0_10px_rgba(0,0,0,0.01)] relative">

        {/* Server Header */}
        <div className="px-6 py-5 border-b border-neutral-200 flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${client ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-neutral-300'}`}></div>
            <span className="font-semibold text-[14px] tracking-tight text-neutral-900">
              {serverInfo?.name || 'Not connected'}
            </span>
            {serverInfo && (
              <span className="text-[10px] font-medium tracking-widest text-neutral-500 uppercase bg-neutral-100 px-1.5 py-0.5 rounded">
                MCP
              </span>
            )}
          </div>
        </div>

        {/* API Key Warning */}
        {apiKeyMissing && (
          <div className="mx-4 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
            <KeyIcon />
            <div className="text-[12px] text-amber-800">
              <span className="font-semibold">Gemini API key required.</span>{' '}
              Configure it in <span className="font-mono">Settings → API Keys</span>.
            </div>
          </div>
        )}

        {/* Tools Section */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="px-6 pt-5 pb-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 text-sm font-semibold tracking-tight text-neutral-900">
              Tools
              <span className="text-[11px] font-mono font-medium text-neutral-500 bg-neutral-200/60 px-1.5 py-0.5 rounded">
                {filteredTools.length}
              </span>
            </div>
          </div>

          <div className="px-6 pb-4 shrink-0">
            <div className="relative group">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 group-focus-within:text-neutral-900 transition-colors">
                <SearchIcon />
              </span>
              <input
                type="text"
                placeholder="Search tools..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-neutral-200 rounded-lg pl-9 pr-3 py-2 text-[13px] shadow-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/5 focus:border-neutral-400 transition-all placeholder:text-neutral-400"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-thin">
            {filteredTools.length === 0 && (
              <div className="px-6 py-8 text-center text-[12px] text-neutral-400 italic">
                {client ? 'No tools found.' : 'Connect to a server to see tools.'}
              </div>
            )}
            {filteredTools.map((tool) => {
              const isExpanded = expandedToolSidebar === tool.name;
              return (
                <div
                  key={tool.name}
                  className={`border-b border-neutral-100 transition-colors ${isExpanded ? 'bg-white shadow-[0_2px_10px_rgba(0,0,0,0.02)] relative z-10' : 'hover:bg-white'}`}
                >
                  <div
                    className="px-6 py-3 cursor-pointer group flex items-start gap-3"
                    onClick={() => setExpandedToolSidebar(isExpanded ? null : tool.name)}
                  >
                    <div className={`mt-0.5 text-neutral-400 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="9 18 15 12 9 6"></polyline>
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-[13px] text-neutral-900 font-medium tracking-tight truncate">
                          {tool.name}
                        </span>
                      </div>
                      {!isExpanded && (
                        <div className="text-[12px] text-neutral-500 line-clamp-1 leading-relaxed pr-4">
                          {tool.description}
                        </div>
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="pl-12 pr-6 pb-4 space-y-4 bg-white">
                      <div className="text-[12px] text-neutral-600 leading-relaxed">{tool.description}</div>
                      <div className="space-y-3">
                        <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Parameters</div>
                        {tool.inputSchema?.properties && Object.keys(tool.inputSchema.properties).length > 0 ? (
                          <div className="space-y-3">
                            {Object.entries(tool.inputSchema.properties).map(([propName, propDetails]) => (
                              <div key={propName} className="space-y-1.5">
                                <div className="flex items-center gap-2">
                                  <label className="font-mono text-[12px] text-neutral-800">{propName}</label>
                                  {tool.inputSchema?.required?.includes(propName) && (
                                    <span className="text-[9px] font-semibold text-orange-600 bg-orange-50 px-1 py-0.5 rounded-sm">REQ</span>
                                  )}
                                </div>
                                {propDetails.description && (
                                  <div className="text-[11px] text-neutral-500">{propDetails.description}</div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-[11px] text-neutral-400 italic">No parameters required.</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Activity Log */}
        <div
          onClick={() => setIsLogsCollapsed(!isLogsCollapsed)}
          className="px-6 py-3 border-t border-neutral-200 bg-white flex items-center justify-between shrink-0 cursor-pointer hover:bg-neutral-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <div className={`text-neutral-400 transition-transform duration-200 ${isLogsCollapsed ? '' : 'rotate-90'}`}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </div>
            <span className="text-[13px] font-semibold tracking-tight text-neutral-900">Activity Log</span>
          </div>
          <span className="text-[11px] text-neutral-400 font-mono">{logs.length}</span>
        </div>

        <div className={`flex flex-col transition-all duration-300 ease-in-out bg-white shrink-0 overflow-hidden ${isLogsCollapsed ? 'h-0' : 'h-48'}`}>
          <div className="flex-1 overflow-y-auto py-1 scrollbar-thin">
            {logs.length === 0 && (
              <div className="px-6 py-4 text-[11px] text-neutral-400 italic">No activity yet.</div>
            )}
            {logs.map((log) => (
              <div key={log.id} className="flex items-start gap-3 px-6 py-1 hover:bg-neutral-50 font-mono text-[11px] group">
                <span className="text-neutral-400 shrink-0 w-16">{log.time.split(' ')[0]}</span>
                <span className={`shrink-0 font-bold w-3 text-center ${log.dir === '<-' ? 'text-blue-500' : 'text-green-500'}`}>
                  {log.dir === '<-' ? '↓' : '↑'}
                </span>
                <span className={`text-neutral-700 truncate flex-1 ${log.source === 'mcp-apps-bridge' ? 'text-purple-700' : ''}`}>
                  {log.type}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Main Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#FAFAFA] relative h-full">

        {/* Header */}
        <div className="h-14 bg-white border-b border-border/60 flex items-center px-6 justify-between shrink-0 z-10 relative">
          <div className="flex items-center gap-1 bg-neutral-100/80 p-1 rounded-lg border border-neutral-200/60">
            {viewports.map((vp) => (
              <button
                key={vp.id}
                onClick={() => setViewport(vp.id)}
                className={`p-1.5 rounded flex items-center justify-center transition-all ${viewport === vp.id
                  ? 'bg-white shadow-[0_1px_3px_rgba(0,0,0,0.1)] text-neutral-900'
                  : 'text-neutral-500 hover:text-neutral-700 hover:bg-neutral-200/50'
                  }`}
                title={vp.label}
              >
                {vp.icon}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 text-neutral-400">
            {isStreaming && (
              <div className="flex items-center gap-1.5 text-[12px] text-neutral-500">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                Thinking…
              </div>
            )}
            <button
              className="hover:text-red-500 transition-colors"
              onClick={() => {
                setMessages([]);
                setChatInput('');
                setLogs([]);
                widgetRegistry.current.clear();
                resourceCacheRef.current.clear();
                resourcePromiseRef.current.clear();
                toolTraceRef.current.clear();
                resetWidgetSessions();
              }}
              title="Clear Chat"
            >
              <TrashIcon />
            </button>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 flex justify-center overflow-hidden w-full bg-[#E5E5E5]/40 relative">
          <div
            className="h-full flex flex-col relative bg-[#FAFAFA] transition-all duration-500 ease-in-out shadow-lg shadow-neutral-900/5"
            style={{
              width: viewport === 'desktop' ? '100%' : viewport === 'tablet' ? '768px' : '375px',
              borderLeft: viewport !== 'desktop' ? '1px solid rgba(0,0,0,0.05)' : 'none',
              borderRight: viewport !== 'desktop' ? '1px solid rgba(0,0,0,0.05)' : 'none',
            }}
          >
            {/* Chat area */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 md:p-8">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center max-w-md mx-auto text-center opacity-80">
                  <div className="w-16 h-16 bg-white border border-neutral-200 shadow-sm text-neutral-300 rounded-2xl flex items-center justify-center mb-6">
                    <SparklesIcon />
                  </div>
                  <h3 className="text-lg font-semibold tracking-tight text-neutral-900 mb-2">Render UI with MCP</h3>
                  <p className="text-[14px] text-neutral-500 leading-relaxed">
                    Type a prompt to let the AI invoke tools. When a tool returns a UI resource, it will be rendered here.
                  </p>
                </div>
              ) : (
                <div className="max-w-4xl mx-auto space-y-8">
                  {messages.filter(m => !m.isHidden).map((msg) => (
                    <div key={msg.id} data-msg-id={msg.id} className={`flex w-full flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                      <div className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.role === 'assistant' && (
                          <div className="w-8 h-8 rounded-full bg-green-50 border border-green-100 flex items-center justify-center text-green-600 shrink-0 mr-4 shadow-sm mt-1">
                            <SparklesIcon />
                          </div>
                        )}
                        <div className={`max-w-[85%] ${msg.role === 'user' ? '' : 'w-full'}`}>
                          {msg.role === 'user' && (
                            <div className="bg-white border border-neutral-200 shadow-sm text-neutral-900 px-5 py-3 rounded-2xl rounded-tr-sm text-[14px] font-medium inline-block whitespace-pre-wrap">
                              {msg.content}
                            </div>
                          )}
                          {msg.role === 'assistant' && msg.toolCalls?.length > 0 && (
                            <div className="mb-3 space-y-1.5">
                              {msg.toolCalls.map((tc, i) => (
                                <div key={tc.callId || i} className="flex items-center gap-2.5 text-[12px] text-neutral-500 bg-white border border-neutral-200 shadow-sm rounded-md px-3 py-1.5 w-fit">
                                  {tc.status === 'running' ? (
                                    <div className="w-3 h-3 border-2 border-neutral-300 border-t-neutral-600 rounded-full animate-spin shrink-0"></div>
                                  ) : tc.status === 'failed' ? (
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-red-500 shrink-0">
                                      <line x1="18" y1="6" x2="6" y2="18"></line>
                                      <line x1="6" y1="6" x2="18" y2="18"></line>
                                    </svg>
                                  ) : (
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-green-500 shrink-0">
                                      <polyline points="20 6 9 17 4 12"></polyline>
                                    </svg>
                                  )}
                                  <code className="font-mono text-[11px] font-medium text-neutral-700">{tc.toolName}</code>
                                </div>
                              ))}
                            </div>
                          )}
                          {msg.role === 'assistant' && msg.content && (
                            <div className={`text-[14px] leading-relaxed prose prose-sm max-w-none ${msg.isError ? 'text-red-600' : 'text-neutral-700'}`}>
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {msg.content}
                              </ReactMarkdown>
                              {isStreaming && messages[messages.length - 1]?.id === msg.id && (
                                <span className="inline-block w-1.5 h-3.5 bg-green-500 animate-[pulse_1s_infinite] ml-0.5" />
                              )}
                            </div>
                          )}
                          {msg.role === 'assistant' && !msg.content && msg.toolCalls?.length === 0 && isStreaming && messages[messages.length - 1]?.id === msg.id && (
                            <div className="flex items-center gap-1 h-[22px] mt-1">
                              {[0, 1, 2].map((i) => (
                                <div
                                  key={i}
                                  className="w-1.5 h-1.5 rounded-full bg-neutral-300 animate-bounce"
                                  style={{ animationDelay: `${i * 0.15}s` }}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Widget rendering per message */}
                      {msg.widgets?.length > 0 && (
                        <div className="flex w-full justify-start mt-2">
                          <div className="w-8 h-8 rounded-full bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shrink-0 mr-4 shadow-sm mt-3 opacity-0">
                            {/* Hidden spacer */}
                          </div>
                          <div className="flex-1 min-w-0 space-y-4">
                            {msg.widgets.map((widgetId) => {
                              const session = sessionsById[widgetId];
                              if (!session) return null;
                              return (
                                <ChatWidget
                                  key={widgetId}
                                  session={session}
                                  registerWidget={(id, fns) => widgetRegistry.current.set(id, fns)}
                                  unregisterWidget={(id) => widgetRegistry.current.delete(id)}
                                />
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Streaming indicator */}
                  {isStreaming && messages[messages.length - 1]?.role !== 'assistant' && (
                    <div className="flex w-full justify-start">
                      <div className="w-8 h-8 rounded-full bg-green-50 border border-green-100 flex items-center justify-center text-green-600 shrink-0 mr-4 shadow-sm">
                        <SparklesIcon />
                      </div>
                      <div className="flex items-center gap-1 pt-3">
                        {[0, 1, 2].map((i) => (
                          <div
                            key={i}
                            className="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-bounce"
                            style={{ animationDelay: `${i * 0.15}s` }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Chat Input */}
            <div className="w-full px-4 md:px-6 z-20 pb-6 shrink-0">
              <div className="max-w-4xl mx-auto bg-[#F8F6F1] border border-[#EBE8E0] rounded-2xl p-2 shadow-[0_8px_30px_rgba(0,0,0,0.06)] flex flex-col transition-all">
                <form onSubmit={handleSendMessage} className="flex items-center relative h-12">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    disabled={isStreaming}
                    placeholder={
                      !client
                        ? 'Connect to an MCP server first…'
                        : apiKeyMissing
                          ? 'Configure Gemini API key in Settings…'
                          : 'Ask something to render UI…'
                    }
                    className={`w-full bg-transparent pl-4 py-3 text-[14px] focus:outline-none text-neutral-900 placeholder:text-neutral-400 placeholder:font-normal font-mono pr-12 ${isStreaming ? 'opacity-50' : ''}`}
                  />
                  <div className="absolute right-2 flex items-center gap-2">
                    <div className="flex items-center gap-1.5 text-[12px] text-neutral-400 font-medium">
                      <SparklesIcon />
                      <span className="hidden sm:inline">Gemini 2.5</span>
                    </div>
                    <button
                      type="submit"
                      disabled={!chatInput.trim() || isStreaming}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all shrink-0 ${chatInput.trim() && !isStreaming
                        ? 'bg-neutral-900 text-white shadow-sm hover:bg-neutral-800'
                        : 'bg-[#EFECE5] text-[#D0CCC2]'
                        }`}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
