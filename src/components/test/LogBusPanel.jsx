import { useTestStore } from '../../stores/testStore';
import { useState } from 'react';

export function LogBusPanel() {
  // Using mock logs for now
  const [logs] = useState([
    { id: 1, dir: '<- res', type: 'result', source: 'paystack', time: '12:44:23 PM', status: 'success' },
    { id: 2, dir: 'req ->', type: 'tools/list', source: 'paystack', time: '12:44:23 PM', status: 'info' },
    { id: 3, dir: '<- res', type: 'result', source: 'paystack', time: '12:44:20 PM', status: 'success' },
    { id: 4, dir: 'req ->', type: 'tools/list', source: 'paystack', time: '12:44:20 PM', status: 'info' },
    { id: 5, dir: '!', type: 'error', source: 'paystack', time: '12:44:20 PM', status: 'error' },
    { id: 6, dir: 'req ->', type: 'logging/setLevel', source: 'paystack', time: '12:44:20 PM', status: 'info' },
    { id: 7, dir: 'req ->', type: 'notifications/initialized', source: 'paystack', time: '12:44:20 PM', status: 'info' },
    { id: 8, dir: '<- res', type: 'result', source: 'paystack', time: '12:44:20 PM', status: 'success' },
    { id: 9, dir: 'req ->', type: 'initialize', source: 'paystack', time: '12:44:20 PM', status: 'info' },
  ]);

  return (
    <div className="w-80 border-l border-border bg-white flex flex-col h-full shrink-0">
      <div className="h-12 border-b border-border flex items-center px-3 gap-2 shrink-0">
        <div className="relative flex-1">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            placeholder="Search logs"
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-neutral-100 border border-transparent rounded-md focus:bg-white focus:border-border focus:outline-none transition-colors"
          />
        </div>
        <div className="text-xs text-muted-foreground whitespace-nowrap">
          {logs.length} / {logs.length}
        </div>
        <button className="p-1.5 text-muted-foreground hover:bg-neutral-100 rounded">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
        </button>
        <button className="p-1.5 text-muted-foreground hover:bg-neutral-100 rounded">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
        </button>
        <button className="p-1.5 text-muted-foreground hover:bg-neutral-100 rounded">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto font-mono text-[11px]">
        {logs.map(log => (
          <div key={log.id} className="flex items-center gap-2 px-3 py-2 border-b border-neutral-100 hover:bg-neutral-50 cursor-pointer group">
            <div className={`shrink-0 w-12 ${log.status === 'error' ? 'text-red-500' : 'text-green-600'}`}>
              {log.dir}
            </div>
            <div className={`flex-1 truncate ${log.status === 'error' ? 'text-red-500' : 'text-neutral-700'}`}>
              {log.type}
            </div>
            <div className="shrink-0 text-muted-foreground text-[10px]">
              {log.source} {log.time}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
