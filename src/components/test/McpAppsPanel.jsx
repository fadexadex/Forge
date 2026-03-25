import { useState } from 'react';
import { useTestStore } from '../../stores/testStore';

// Icons
const DesktopIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="14" x="2" y="3" rx="2" />
    <line x1="8" x2="16" y1="21" y2="21" />
    <line x1="12" x2="12" y1="17" y2="21" />
  </svg>
);

const MobileIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="14" height="20" x="5" y="2" rx="2" ry="2" />
    <path d="M12 18h.01" />
  </svg>
);

const TabletIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="24" x="3" y="0" rx="2" ry="2" transform="rotate(90 12 12)" />
    <path d="M16 12h.01" />
  </svg>
);

const SendIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
  </svg>
);

const RefreshIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path>
  </svg>
);

const GlobeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
  </svg>
);

const ShieldIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
  </svg>
);

const PlayIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="5 3 19 12 5 21 5 3"></polygon>
  </svg>
);

const SparklesIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-500">
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    <path d="M5 3v4" />
    <path d="M19 17v4" />
    <path d="M3 5h4" />
    <path d="M17 19h4" />
  </svg>
);

const ChevronDownIcon = ({ className }) => (
  <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"></polyline>
  </svg>
);

const ChevronUpIcon = ({ className }) => (
  <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="18 15 12 9 6 15"></polyline>
  </svg>
);

const SearchIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);

export function McpAppsPanel() {
  const { tools, serverInfo } = useTestStore();
  const [viewport, setViewport] = useState('tablet'); // 'mobile' | 'tablet' | 'desktop'
  const [chatInput, setChatInput] = useState('');
  const [hasSentMessage, setHasSentMessage] = useState(false);
  const [isLogsCollapsed, setIsLogsCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedTool, setExpandedTool] = useState(null);
  const [logs, setLogs] = useState([
    { id: 1, dir: '<-', type: 'resize', time: '1:56:32 PM' },
    { id: 2, dir: '->', type: 'set_globals', time: '1:56:32 PM' },
    { id: 3, dir: '->', type: 'set_globals', time: '1:56:32 PM' },
    { id: 4, dir: '->', type: 'set_globals', time: '1:56:29 PM' },
  ]);
  
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    setChatInput('');
    setHasSentMessage(true);

    // Simulate logs being added dynamically
    setTimeout(() => {
      setLogs(prev => [...prev, { id: Date.now(), dir: '->', type: 'tools/call', time: new Date().toLocaleTimeString() }]);
    }, 500);
    setTimeout(() => {
      setLogs(prev => [...prev, { id: Date.now() + 1, dir: '<-', type: 'tools/call_result', time: new Date().toLocaleTimeString() }]);
    }, 1500);
  };

  const getViewportClasses = () => {
    switch(viewport) {
      case 'mobile': return 'w-[375px] h-[812px] rounded-3xl shadow-xl border-[8px] border-neutral-800';
      case 'tablet': return 'w-[820px] h-[1180px] rounded-xl shadow-lg border border-border';
      case 'desktop': default: return 'w-full h-full border border-border rounded-xl shadow-sm';
    }
  };

  const mockTools = tools && tools.length > 0 ? tools : [
    {
      name: 'get_paystack_operation',
      description: 'Get Paystack API operation details by operation ID. Available operations are: transaction_initialize...',
      inputSchema: {
        properties: {
          operation_id: {
            type: 'string',
            description: 'The operation ID of the Paystack API endpoint'
          }
        },
        required: ['operation_id']
      }
    },
    {
      name: 'make_paystack_request',
      description: 'Make a Paystack API request using the details of the operation. Be sure to get all operation details including method, path...',
      inputSchema: { properties: {} }
    },
    {
      name: 'get_paystack_operation_guided',
      description: 'Get Paystack API operation details from user input',
      inputSchema: { properties: {} }
    }
  ];

  const filteredTools = mockTools.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="flex-1 flex h-full overflow-hidden bg-white text-sm">
      {/* Left Sidebar (Tools & Logs) */}
      <div className="w-[320px] flex flex-col border-r border-border shrink-0 bg-white">
        
        {/* Server / App Header */}
        <div className="h-12 px-4 border-b border-border flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="font-semibold text-neutral-900">{serverInfo?.name || 'mcp-server'}</span>
            <span className="text-xs text-neutral-500 font-mono bg-neutral-100 px-1.5 py-0.5 rounded">HTTP</span>
          </div>
        </div>

        {/* Tools Section (Flex-1 so it takes available space above logs) */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between shrink-0">
            <div className="flex gap-4 text-xs font-medium">
              <span className="text-neutral-900 bg-neutral-100 px-2 py-1 rounded-md">Tools {mockTools.length}</span>
            </div>
            <div className="flex items-center gap-2 text-neutral-500">
              <button className="hover:text-neutral-900" title="Clear"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg></button>
              <button className="hover:text-neutral-900" title="Refresh"><RefreshIcon /></button>
              <button className="hover:text-neutral-900" title="Settings"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="3" x2="9" y2="21"/></svg></button>
              <button className="bg-neutral-200 text-neutral-800 px-2.5 py-1 rounded text-xs font-medium hover:bg-neutral-300 transition-colors flex items-center gap-1">
                <PlayIcon /> Run
              </button>
            </div>
          </div>
          
          <div className="p-3 border-b border-border shrink-0">
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400">
                <SearchIcon />
              </span>
              <input 
                type="text" 
                placeholder="Search tools..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-neutral-200 rounded-md pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-neutral-300 focus:border-neutral-300"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto bg-[#FAFAFA]">
            {filteredTools.map(tool => {
              const isExpanded = expandedTool === tool.name;
              return (
                <div key={tool.name} className="border-b border-border bg-white last:border-0">
                  <div 
                    className="p-3 cursor-pointer hover:bg-neutral-50"
                    onClick={() => setExpandedTool(isExpanded ? null : tool.name)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-xs text-neutral-800 font-medium">{tool.name}</span>
                      {isExpanded && (
                        <button 
                          className="text-neutral-400 hover:text-neutral-800"
                          onClick={(e) => { e.stopPropagation(); setExpandedTool(null); }}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                      )}
                    </div>
                    {!isExpanded && (
                      <div className="text-[11px] text-neutral-500 line-clamp-2 leading-relaxed">
                        {tool.description}
                      </div>
                    )}
                  </div>

                  {isExpanded && (
                    <div className="px-3 pb-3 pt-1 space-y-3 bg-white">
                      <div className="border-t border-border pt-3">
                        <div className="flex items-center justify-between text-xs font-medium text-neutral-700 mb-1 cursor-pointer">
                          <span>Description</span>
                          <ChevronDownIcon className="text-neutral-400" />
                        </div>
                      </div>

                      <div className="border-t border-border pt-3">
                        <div className="flex items-center justify-between text-xs font-medium text-neutral-700 mb-1 cursor-pointer">
                          <span>Input Schema</span>
                          <ChevronDownIcon className="text-neutral-400" />
                        </div>
                      </div>

                      <div className="border-t border-border pt-3">
                        <div className="flex items-center justify-between text-xs font-medium text-neutral-700 mb-2 cursor-pointer">
                          <span>Parameters</span>
                          <ChevronUpIcon className="text-neutral-400" />
                        </div>
                        {tool.inputSchema?.properties && Object.keys(tool.inputSchema.properties).length > 0 ? (
                          <div className="space-y-3">
                            {Object.entries(tool.inputSchema.properties).map(([propName, propDetails]) => (
                              <div key={propName} className="space-y-1.5">
                                <div className="flex items-center gap-2">
                                  <label className="font-mono text-xs text-neutral-800">{propName}</label>
                                  {tool.inputSchema?.required?.includes(propName) && (
                                    <span className="text-[9px] font-medium text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-200">required</span>
                                  )}
                                </div>
                                {propDetails.description && (
                                  <div className="text-[11px] text-neutral-500">{propDetails.description}</div>
                                )}
                                <input 
                                  type="text" 
                                  placeholder={`Enter ${propName}`} 
                                  className="w-full bg-white border border-neutral-200 rounded-md px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-neutral-300 focus:border-neutral-300" 
                                />
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

        {/* Logs Resizable Splitter (Mock) */}
        <div className="h-1 bg-neutral-100 border-y border-border cursor-ns-resize flex items-center justify-center shrink-0">
          <div className="w-4 h-0.5 bg-neutral-300 rounded-full"></div>
        </div>

        {/* Logs Section */}
        <div className={`flex flex-col transition-all duration-300 ${isLogsCollapsed ? 'h-10' : 'h-64'} shrink-0 bg-white`}>
          <div className="px-4 py-2 border-b border-border flex items-center justify-between shrink-0 bg-neutral-50/50">
            <button 
              onClick={() => setIsLogsCollapsed(!isLogsCollapsed)}
              className="text-xs font-medium text-neutral-700 flex items-center gap-2 hover:text-neutral-900"
            >
              <svg 
                className={`transition-transform duration-200 ${isLogsCollapsed ? '-rotate-90' : ''}`} 
                width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
              Logs
            </button>
            <div className="flex items-center gap-2 text-neutral-400">
              <button className="hover:text-neutral-900"><TrashIcon /></button>
            </div>
          </div>
          
          {!isLogsCollapsed && (
            <div className="flex-1 overflow-y-auto p-2 space-y-1.5 bg-[#FAFAFA]">
              {logs.map(log => (
                <div key={log.id} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-border rounded shadow-sm text-xs font-mono group hover:border-neutral-300 transition-colors cursor-pointer">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-neutral-400 opacity-0 group-hover:opacity-100"><polyline points="9 18 15 12 9 6"></polyline></svg>
                  <span className="text-neutral-400 w-16 shrink-0">{log.time}</span>
                  <span className="text-neutral-600 truncate">{serverInfo?.name || 'mcp-server'}</span>
                  <span className={`w-4 text-center shrink-0 ${log.dir === '<-' ? 'text-blue-500' : 'text-green-500'}`}>
                    {log.dir === '<-' ? '↓' : '↑'}
                  </span>
                  <span className="text-neutral-800 truncate flex-1">{log.type}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Main Area (Preview & Chat) */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#F5F5F5] relative">
        {/* Top Toolbar */}
        <div className="h-14 bg-white border-b border-border flex items-center px-4 justify-between shrink-0 z-10 relative">
          {/* Left Actions */}
          <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-lg border border-border">
            <button 
              onClick={() => setViewport('mobile')}
              className={`p-1.5 rounded-md transition-colors flex items-center justify-center ${viewport === 'mobile' ? 'bg-white shadow-sm text-neutral-900' : 'text-neutral-500 hover:text-neutral-900'}`}
              title="Mobile"
            >
              <MobileIcon />
            </button>
            <button 
              onClick={() => setViewport('tablet')}
              className={`p-1.5 rounded-md transition-colors flex items-center gap-2 px-3 ${viewport === 'tablet' ? 'bg-white shadow-sm text-neutral-900' : 'text-neutral-500 hover:text-neutral-900'}`}
              title="Tablet"
            >
              <TabletIcon />
              <span className="text-[11px] font-medium hidden lg:inline-block">Tablet (820x1180)</span>
            </button>
            <button 
              onClick={() => setViewport('desktop')}
              className={`p-1.5 rounded-md transition-colors flex items-center justify-center ${viewport === 'desktop' ? 'bg-white shadow-sm text-neutral-900' : 'text-neutral-500 hover:text-neutral-900'}`}
              title="Desktop"
            >
              <DesktopIcon />
            </button>
          </div>

          {/* Center Actions */}
          <div className="flex items-center gap-4 text-xs font-medium text-neutral-600">
            <button className="flex items-center gap-1.5 hover:text-neutral-900 transition-colors">
              <GlobeIcon /> en-US <ChevronDownIcon className="text-neutral-400" />
            </button>
            <div className="w-px h-4 bg-border"></div>
            <button className="flex items-center gap-1.5 hover:text-neutral-900 transition-colors">
              <ShieldIcon /> Permissive <ChevronDownIcon className="text-neutral-400" />
            </button>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3 text-neutral-500">
            <button className="hover:text-neutral-900 transition-colors" title="Reload"><RefreshIcon /></button>
            <div className="w-px h-4 bg-border mx-1"></div>
            <button className="hover:text-red-500 transition-colors" onClick={() => { setHasSentMessage(false); setChatInput(''); }} title="Clear Canvas"><TrashIcon /></button>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 overflow-auto flex items-center justify-center p-8 relative">
          {hasSentMessage ? (
            <div className={`bg-white transition-all duration-300 ease-in-out flex flex-col relative ${getViewportClasses()}`}>
              <div className="w-full h-full flex flex-col p-6 overflow-y-auto">
                {/* Mock Contextual UI Render based on actual server (Paystack) */}
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 bg-[#0BA4DB]/10 rounded-xl flex items-center justify-center text-[#0BA4DB]">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
                  </div>
                  <div>
                    <h1 className="text-xl font-semibold text-neutral-900">Paystack Dashboard</h1>
                    <p className="text-sm text-neutral-500">Connected to mock environment</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-sm">
                    <div className="text-xs text-neutral-500 font-medium mb-1">Available Balance</div>
                    <div className="text-2xl font-semibold text-neutral-900">₦45,603,685.00</div>
                    <div className="text-xs text-green-600 font-medium mt-2 flex items-center gap-1">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
                      +14.5% this month
                    </div>
                  </div>
                  
                  <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-sm">
                    <div className="text-xs text-neutral-500 font-medium mb-1">Recent Operations</div>
                    <div className="text-2xl font-semibold text-neutral-900">1,248</div>
                    <div className="text-xs text-neutral-500 mt-2">Active endpoints initialized</div>
                  </div>
                </div>

                <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-neutral-200 bg-neutral-50 font-medium text-sm text-neutral-800">
                    Recent Transactions
                  </div>
                  <div className="divide-y divide-neutral-100">
                    {[1,2,3].map(i => (
                      <div key={i} className="px-4 py-3 flex items-center justify-between hover:bg-neutral-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-neutral-900">transaction_initialize</div>
                            <div className="text-xs text-neutral-500 font-mono">op_{Math.random().toString(36).substr(2, 6)}</div>
                          </div>
                        </div>
                        <div className="text-sm font-medium text-neutral-900">₦{Math.floor(Math.random() * 50000)}.00</div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          ) : null}

          {/* Floating Chat Input Overlay */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4">
            <div className="bg-[#FAF9F6] border border-border rounded-2xl p-2 shadow-2xl flex flex-col gap-2 transition-all hover:shadow-neutral-200/50">
              <form onSubmit={handleSendMessage} className="flex items-center gap-2 relative h-12">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask something to render UI..."
                  className="w-full bg-transparent pl-4 pr-12 py-3 text-sm focus:outline-none text-neutral-800 placeholder:text-neutral-400"
                />
                
                <div className="absolute right-2 flex items-center gap-2">
                  <span className="text-[10px] text-neutral-400 font-medium">0.2s</span>
                  <div className="w-4 h-4 rounded-full border border-neutral-300"></div>
                  <button 
                    type="submit"
                    disabled={!chatInput.trim()}
                    className={`p-1.5 rounded-lg transition-colors flex items-center justify-center ${chatInput.trim() ? 'bg-neutral-900 text-white hover:bg-neutral-800' : 'bg-neutral-100 text-neutral-400'}`}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                  </button>
                </div>
              </form>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
