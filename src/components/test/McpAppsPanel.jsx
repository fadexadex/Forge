import { useState, useRef, useEffect } from 'react';
import { useTestStore } from '../../stores/testStore';

// Icons
const RefreshIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path>
  </svg>
);

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
  </svg>
);

const SparklesIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1-1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    <path d="M5 3v4" />
    <path d="M19 17v4" />
    <path d="M3 5h4" />
    <path d="M17 19h4" />
  </svg>
);

const PlayIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="5 3 19 12 5 21 5 3"></polygon>
  </svg>
);

const DesktopIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="14" x="2" y="3" rx="2" />
    <line x1="8" x2="16" y1="21" y2="21" />
    <line x1="12" x2="12" y1="17" y2="21" />
  </svg>
);

const MobileIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="14" height="20" x="5" y="2" rx="2" ry="2"/>
    <path d="M12 18h.01"/>
  </svg>
);

const TabletIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="16" height="20" x="4" y="2" rx="2" ry="2"/>
    <line x1="12" x2="12.01" y1="18" y2="18"/>
  </svg>
);

const ExpandIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 3 21 3 21 9" />
    <polyline points="9 21 3 21 3 15" />
    <line x1="21" y1="3" x2="14" y2="10" />
    <line x1="3" y1="21" x2="10" y2="14" />
  </svg>
);

const CopyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
  </svg>
);

const ShieldIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
  </svg>
);

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
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
  const [chatInput, setChatInput] = useState('');
  const [isLogsCollapsed, setIsLogsCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedToolSidebar, setExpandedToolSidebar] = useState(null);
  const [collapsedUIMsgs, setCollapsedUIMsgs] = useState({});
  const [viewport, setViewport] = useState('desktop');
  const scrollRef = useRef(null);
  
  const viewports = [
    { id: 'mobile', icon: <MobileIcon />, label: 'Mobile', width: '375px' },
    { id: 'tablet', icon: <TabletIcon />, label: 'Tablet', width: '768px' },
    { id: 'desktop', icon: <DesktopIcon />, label: 'Desktop', width: '1200px' }
  ];
  
  // Chat stream state
  const [messages, setMessages] = useState([]);
  
  // Logs state
  const [logs, setLogs] = useState([
    { id: 1, dir: '<-', type: 'resize', time: '1:56:32 PM' },
    { id: 2, dir: '->', type: 'set_globals', time: '1:56:32 PM' },
  ]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = { id: Date.now(), role: 'user', content: chatInput };
    setMessages(prev => [...prev, userMsg]);
    setChatInput('');

    // Simulate agent returning a tool UI that includes the invoke context
    setTimeout(() => {
      const msgId = Date.now() + 2;
      const uiMsg = {
        id: msgId,
        role: 'assistant',
        type: 'tool_ui',
        toolName: 'get_weather_forecast',
        invokeText: 'Invoked `get_weather_forecast`'
      };
      setMessages(prev => [...prev, uiMsg]);
      // Initialize as not collapsed
      setCollapsedUIMsgs(prev => ({...prev, [msgId]: false}));
      setLogs(prev => [...prev, 
        { id: Date.now(), dir: '->', type: 'tools/call', time: new Date().toLocaleTimeString() },
        { id: Date.now() + 1, dir: '<-', type: 'tools/call_result', time: new Date().toLocaleTimeString() }
      ]);
    }, 1000);
  };

  const toggleUICollapse = (msgId) => {
    setCollapsedUIMsgs(prev => ({
      ...prev,
      [msgId]: !prev[msgId]
    }));
  };

  const mockTools = tools && tools.length > 0 ? tools : [
    {
      name: 'get_weather_forecast',
      description: 'Get the current weather and 3-day forecast for a given location.',
      inputSchema: {
        properties: {
          location: {
            type: 'string',
            description: 'City and state/country, e.g. "San Francisco, CA"'
          },
          units: {
            type: 'string',
            description: '"celsius" or "fahrenheit"'
          }
        },
        required: ['location']
      }
    }
  ];

  const filteredTools = mockTools.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const renderUIComponent = (msg) => {
    const isCollapsed = collapsedUIMsgs[msg.id];
    
    return (
      <div className="w-full mt-2 flex flex-col">
        {/* Tool Invoke Header */}
        <div className="flex items-center gap-2 mb-2 ml-2">
          <span className="text-[13px] text-neutral-600">{msg.invokeText.split('`')[0]}</span>
          <code className="px-1.5 py-0.5 bg-neutral-200/50 text-neutral-800 text-[12px] rounded font-mono">{msg.invokeText.split('`')[1]}</code>
        </div>
        
        {/* Rendered Tool UI Wrapper */}
        <div 
          className="bg-white rounded-xl border border-neutral-200/80 shadow-[0_2px_10px_rgba(0,0,0,0.02)] overflow-hidden transition-all duration-300 self-start w-full"
        >
          
          {/* Tool UI Toolbar */}
          <div 
            className="h-10 px-4 bg-neutral-50/80 border-b border-neutral-200/80 flex items-center justify-between cursor-pointer hover:bg-neutral-100 transition-colors"
            onClick={() => toggleUICollapse(msg.id)}
          >
            <div className="flex items-center gap-2">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-neutral-400">
                <polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 17 22 22 17"/>
              </svg>
              <span className="text-[12px] font-mono text-neutral-500">{msg.toolName}</span>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-neutral-400 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                <button className="hover:text-neutral-900 transition-colors" title="Copy Data"><CopyIcon /></button>
                <button className="hover:text-neutral-900 transition-colors" title="Expand"><ExpandIcon /></button>
                <div className="w-px h-3 bg-neutral-300"></div>
                <button className="text-green-500 hover:text-green-600 transition-colors flex items-center gap-1.5"><CheckIcon /></button>
              </div>
              
              <div className={`text-neutral-400 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </div>
            </div>
          </div>

          {/* Collapsible Content - Modern Weather Widget */}
          <div className={`transition-all duration-300 ease-in-out origin-top ${isCollapsed ? 'h-0 opacity-0 scale-y-0' : 'opacity-100 scale-y-100'}`}>
            <div className="w-full bg-gradient-to-br from-[#111827] to-[#1E293B] text-white p-6 md:p-8 overflow-x-hidden">
              <div className="flex flex-col h-full min-h-[300px] justify-between">
                
                {/* Header: Location & Current Date */}
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-semibold tracking-tight">San Francisco</h2>
                    <p className="text-slate-400 text-[13px] font-medium mt-1">Thursday, Oct 24</p>
                  </div>
                  <div className="text-right">
                    <div className="text-4xl font-bold tracking-tighter">68°</div>
                    <p className="text-slate-400 text-[13px] font-medium mt-1">Fair</p>
                  </div>
                </div>

                {/* Center Visualization (Minimal Sun/Cloud) */}
                <div className="flex justify-center items-center py-10">
                  <div className="relative w-32 h-32">
                    {/* Glowing Sun Background */}
                    <div className="absolute inset-0 bg-yellow-400/20 rounded-full blur-2xl"></div>
                    {/* Sun */}
                    <div className="absolute top-2 right-2 w-16 h-16 bg-gradient-to-tr from-yellow-300 to-yellow-500 rounded-full shadow-[0_0_20px_rgba(253,224,71,0.4)]"></div>
                    {/* Cloud */}
                    <div className="absolute bottom-2 left-0 w-24 h-12 bg-white rounded-full shadow-lg before:content-[''] before:absolute before:-top-6 before:left-4 before:w-12 before:h-12 before:bg-white before:rounded-full after:content-[''] after:absolute after:-top-4 after:right-3 after:w-8 after:h-8 after:bg-white after:rounded-full opacity-95"></div>
                  </div>
                </div>

                {/* Forecast Cards */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { day: 'Fri', high: 72, low: 58, icon: 'sun' },
                    { day: 'Sat', high: 65, low: 55, icon: 'cloud' },
                    { day: 'Sun', high: 64, low: 54, icon: 'rain' }
                  ].map((forecast) => (
                    <div key={forecast.day} className="bg-white/10 backdrop-blur-md border border-white/10 rounded-xl p-3 flex flex-col items-center gap-2">
                      <span className="text-slate-300 text-[12px] font-medium">{forecast.day}</span>
                      {forecast.icon === 'sun' && (
                        <div className="w-6 h-6 bg-yellow-400 rounded-full"></div>
                      )}
                      {forecast.icon === 'cloud' && (
                        <div className="w-6 h-4 bg-slate-300 rounded-full relative before:absolute before:-top-2 before:left-1 before:w-4 before:h-4 before:bg-slate-300 before:rounded-full"></div>
                      )}
                      {forecast.icon === 'rain' && (
                        <div className="w-6 h-4 bg-slate-400 rounded-full relative before:absolute before:-top-2 before:left-1 before:w-4 before:h-4 before:bg-slate-400 before:rounded-full after:content-['|'] after:absolute after:-bottom-3 after:left-1.5 after:text-blue-300 after:text-[10px] after:font-black"></div>
                      )}
                      <div className="flex items-center gap-1.5 text-[13px] mt-1">
                        <span className="text-white font-medium">{forecast.high}°</span>
                        <span className="text-slate-400">{forecast.low}°</span>
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex h-full overflow-hidden bg-white text-sm">
      {/* Left Sidebar (Tools & Logs) */}
      <div className="w-[360px] flex flex-col border-r border-neutral-200 shrink-0 bg-[#FCFCFC] z-20 shadow-[1px_0_10px_rgba(0,0,0,0.01)] relative">
        
        {/* Server Header */}
        <div className="px-6 py-5 border-b border-neutral-200 flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]"></div>
            <span className="font-semibold text-[14px] tracking-tight text-neutral-900">{serverInfo?.name || 'sip-cocktails'}</span>
            <span className="text-[10px] font-medium tracking-widest text-neutral-500 uppercase bg-neutral-100 px-1.5 py-0.5 rounded">HTTP</span>
          </div>
        </div>

        {/* Tools Section */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="px-6 pt-5 pb-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 text-sm font-semibold tracking-tight text-neutral-900">
              Tools
              <span className="text-[11px] font-mono font-medium text-neutral-500 bg-neutral-200/60 px-1.5 py-0.5 rounded">{mockTools.length}</span>
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
            {filteredTools.map(tool => {
              const isExpanded = expandedToolSidebar === tool.name;
              return (
                <div key={tool.name} className={`border-b border-neutral-100 transition-colors ${isExpanded ? 'bg-white shadow-[0_2px_10px_rgba(0,0,0,0.02)] relative z-10' : 'hover:bg-white'}`}>
                  <div 
                    className="px-6 py-3 cursor-pointer group flex items-start gap-3"
                    onClick={() => setExpandedToolSidebar(isExpanded ? null : tool.name)}
                  >
                    <div className={`mt-0.5 text-neutral-400 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-[13px] text-neutral-900 font-medium tracking-tight truncate">{tool.name}</span>
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
                      <div className="text-[12px] text-neutral-600 leading-relaxed">
                        {tool.description}
                      </div>

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
                                <input 
                                  type="text" 
                                  placeholder="Value..." 
                                  className="w-full bg-neutral-50 border border-neutral-200 rounded-md px-3 py-1.5 text-[12px] focus:outline-none focus:ring-1 focus:ring-neutral-400 focus:bg-white transition-all mt-1" 
                                />
                              </div>
                            ))}
                            <div className="pt-2">
                              <button className="w-full bg-neutral-900 text-white rounded-md py-1.5 text-[12px] font-medium hover:bg-neutral-800 transition-colors shadow-sm flex items-center justify-center gap-1.5">
                                <PlayIcon /> Execute {tool.name}
                              </button>
                            </div>
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

        {/* Logs Section */}
        <div 
          onClick={() => setIsLogsCollapsed(!isLogsCollapsed)}
          className="px-6 py-3 border-t border-neutral-200 bg-white flex items-center justify-between shrink-0 cursor-pointer hover:bg-neutral-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <div className={`text-neutral-400 transition-transform duration-200 ${isLogsCollapsed ? '' : 'rotate-90'}`}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </div>
            <span className="text-[13px] font-semibold tracking-tight text-neutral-900">Activity Log</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-neutral-400 font-mono">{logs.length}</span>
          </div>
        </div>
        
        <div className={`flex flex-col transition-all duration-300 ease-in-out bg-white shrink-0 overflow-hidden ${isLogsCollapsed ? 'h-0' : 'h-48'}`}>
          <div className="flex-1 overflow-y-auto py-1 scrollbar-thin">
            {logs.map(log => (
              <div key={log.id} className="flex items-start gap-3 px-6 py-1 hover:bg-neutral-50 font-mono text-[11px] group">
                <span className="text-neutral-400 shrink-0 w-16">{log.time.split(' ')[0]}</span>
                <span className={`shrink-0 font-bold w-3 text-center ${log.dir === '<-' ? 'text-blue-500' : 'text-green-500'}`}>
                  {log.dir === '<-' ? '↓' : '↑'}
                </span>
                <span className="text-neutral-700 truncate flex-1">{log.type}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Main Area (Embedded Chat UI) */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#FAFAFA] relative h-full">
        
        {/* Top Header / Viewport controls */}
        <div className="h-14 bg-white border-b border-border/60 flex items-center px-6 justify-between shrink-0 z-10 relative">
          <div className="flex items-center gap-1 bg-neutral-100/80 p-1 rounded-lg border border-neutral-200/60">
            {viewports.map(vp => (
              <button
                key={vp.id}
                onClick={() => setViewport(vp.id)}
                className={`p-1.5 rounded flex items-center justify-center transition-all ${
                  viewport === vp.id ? 'bg-white shadow-[0_1px_3px_rgba(0,0,0,0.1)] text-neutral-900' : 'text-neutral-500 hover:text-neutral-700 hover:bg-neutral-200/50'
                }`}
                title={vp.label}
              >
                {vp.icon}
              </button>
            ))}
          </div>
          
          <div className="flex items-center gap-4 text-[12px] font-medium text-neutral-500">
            <button className="flex items-center gap-1.5 hover:text-neutral-900 transition-colors">
               en-US <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
          </div>

          <div className="flex items-center gap-4 text-neutral-400">
            <button className="hover:text-red-500 transition-colors" onClick={() => { setMessages([]); setChatInput(''); }} title="Clear Chat"><TrashIcon /></button>
          </div>
        </div>

        {/* Viewport Canvas Wrapper */}
        <div className="flex-1 flex justify-center overflow-hidden w-full bg-[#E5E5E5]/40 relative">
          <div 
            className="h-full flex flex-col relative bg-[#FAFAFA] transition-all duration-500 ease-in-out shadow-lg shadow-neutral-900/5"
            style={{ 
              width: viewport === 'desktop' ? '100%' : (viewport === 'tablet' ? '768px' : '375px'),
              borderLeft: viewport !== 'desktop' ? '1px solid rgba(0,0,0,0.05)' : 'none',
              borderRight: viewport !== 'desktop' ? '1px solid rgba(0,0,0,0.05)' : 'none'
            }}
          >
            {/* Chat Stream Area */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 md:p-8 pb-32">
              
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center max-w-md mx-auto text-center opacity-80">
                  <div className="w-16 h-16 bg-white border border-neutral-200 shadow-sm text-neutral-300 rounded-2xl flex items-center justify-center mb-6">
                    <SparklesIcon />
                  </div>
                  <h3 className="text-lg font-semibold tracking-tight text-neutral-900 mb-2">Render UI with MCP</h3>
                  <p className="text-[14px] text-neutral-500 leading-relaxed">
                    Type a prompt below to execute a tool. The assistant will invoke the tool and render its interface directly in the chat.
                  </p>
                </div>
              ) : (
                <div className="max-w-4xl mx-auto space-y-8">
                  {messages.map((msg) => (
                    <div key={msg.id} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      
                      {/* Assistant Avatar */}
                      {msg.role === 'assistant' && (
                        <div className="w-8 h-8 rounded-full bg-green-50 border border-green-100 flex items-center justify-center text-green-600 shrink-0 mr-4 shadow-sm mt-1">
                          <SparklesIcon />
                        </div>
                      )}

                      <div className={`max-w-[85%] ${msg.role === 'user' ? '' : 'w-full'}`}>
                        {/* User Bubble */}
                        {msg.role === 'user' && (
                          <div className="bg-white border border-neutral-200 shadow-sm text-neutral-900 px-5 py-3 rounded-2xl rounded-tr-sm text-[14px] font-medium inline-block">
                            {msg.content}
                          </div>
                        )}

                        {/* Assistant UI Bubble */}
                        {msg.role === 'assistant' && msg.type === 'tool_ui' && renderUIComponent(msg)}
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Floating Chat Input Overlay */}
            <div className="absolute bottom-6 left-0 w-full px-4 md:px-6 z-20">
              <div className="max-w-4xl mx-auto bg-[#F8F6F1] border border-[#EBE8E0] rounded-2xl p-2 shadow-[0_8px_30px_rgba(0,0,0,0.06)] flex flex-col transition-all">
                <form onSubmit={handleSendMessage} className="flex items-center relative h-12">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask something to render UI..."
                    className={`w-full bg-transparent pl-4 py-3 text-[14px] focus:outline-none text-neutral-900 placeholder:text-neutral-400 placeholder:font-normal font-mono ${
                      viewport === 'mobile' ? 'pr-12' : viewport === 'tablet' ? 'pr-[120px]' : 'pr-[260px]'
                    }`}
                  />
                  
                  <div className="absolute right-2 flex items-center gap-3">
                    {viewport !== 'mobile' && (
                      <div className="flex items-center gap-3 text-neutral-400 border-r border-neutral-300 pr-3">
                        <div className="flex items-center gap-1.5 cursor-pointer hover:text-neutral-700 transition-colors">
                          <SparklesIcon /> <span className="text-[12px] font-medium whitespace-nowrap">GPT-4.1</span>
                        </div>
                        {viewport === 'desktop' && (
                          <div className="flex items-center gap-1.5 cursor-pointer hover:text-neutral-700 transition-colors">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
                            <span className="text-[12px] font-medium truncate max-w-[120px]">System Prompt...</span>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <button 
                      type="submit"
                      disabled={!chatInput.trim()}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all shrink-0 ${chatInput.trim() ? 'bg-neutral-900 text-white shadow-sm hover:bg-neutral-800' : 'bg-[#EFECE5] text-[#D0CCC2]'}`}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
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
