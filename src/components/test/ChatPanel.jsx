import { useState } from 'react';

export function ChatPanel() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'user',
      content: 'use the paystack tool get my account balance',
    },
    {
      id: 2,
      role: 'assistant',
      content: "I'll get your account balance using the Paystack API.",
      toolCalls: [
        {
          id: 'tc_1',
          name: 'get_paystack_operation',
          state: 'completed',
          input: {
            request: {
              method: 'get',
              path: '/balance'
            }
          },
          result: {
            content: [
              { type: 'text', text: 'Operation ready' }
            ],
            _meta: { _serverId: 'paystack' }
          }
        }
      ]
    },
    {
      id: 3,
      role: 'assistant',
      content: "Now I'll make the request to fetch your account balance:",
      toolCalls: [
        {
          id: 'tc_2',
          name: 'make_paystack_request',
          state: 'completed',
          input: {
            request: {
              method: 'get',
              path: '/balance'
            }
          },
          result: {
            content: [
              { 
                data: {
                  currency: 'NGN',
                  balance: 4560368500
                }
              }
            ],
            _meta: { _serverId: 'paystack' }
          }
        }
      ]
    },
    {
      id: 4,
      role: 'assistant',
      content: `Great! Here's your account balance:

**Currency:** NGN (Nigerian Naira)
**Balance:** ₦45,603,685.00

Your Paystack account currently has approximately 45.6 million Nigerian Naira available.`,
    }
  ]);
  
  const [input, setInput] = useState('');
  const [expandedCalls, setExpandedCalls] = useState({'tc_2': true});

  const toggleCall = (id) => {
    setExpandedCalls(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="flex-1 flex flex-col bg-[#FAFAFA] h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto px-8 py-8 space-y-8 scrollbar-thin">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'user' ? (
              <div className="bg-white border border-border text-neutral-900 px-5 py-3 rounded-2xl max-w-2xl text-sm shadow-sm">
                {msg.content}
              </div>
            ) : (
              <div className="max-w-3xl flex gap-4 w-full">
                <div className="w-8 h-8 rounded-full bg-white border border-border flex items-center justify-center shrink-0 mt-1 shadow-sm">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-500">
                    <path d="M12 2v20M17 5l-10 14M22 12H2M19 19 5 5"></path>
                  </svg>
                </div>
                <div className="flex-1 space-y-4 pt-1">
                  {msg.content && (
                    <div className="text-neutral-900 text-[15px] leading-relaxed whitespace-pre-wrap">
                      {msg.content}
                    </div>
                  )}
                  
                  {msg.toolCalls?.map(call => (
                    <div key={call.id} className="border border-border rounded-xl bg-[#FCFCFC] overflow-hidden shadow-sm mt-3">
                      <div 
                        className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-neutral-50 transition-colors"
                        onClick={() => toggleCall(call.id)}
                      >
                        <div className="flex items-center gap-2">
                          <svg className="text-neutral-500" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 16 4-4-4-4"/><path d="m6 8-4 4 4 4"/><path d="m14.5 4-5 16"/></svg>
                          <span className="font-mono text-xs text-neutral-600 font-medium">{call.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <svg className="text-green-500" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
                          <svg 
                            className={`text-neutral-400 transition-transform ${expandedCalls[call.id] ? 'rotate-180' : ''}`} 
                            width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                          >
                            <path d="m6 9 6 6 6-6"/>
                          </svg>
                        </div>
                      </div>
                      
                      {expandedCalls[call.id] && (
                        <div className="px-4 py-3 border-t border-border bg-[#F9F9F9] space-y-4">
                          <div>
                            <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2">Input</div>
                            <pre className="text-xs font-mono text-neutral-700 bg-white border border-neutral-200 rounded-lg p-3 overflow-x-auto shadow-sm">
                              {JSON.stringify(call.input, null, 2)}
                            </pre>
                          </div>
                          <div>
                            <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2">Result</div>
                            <pre className="text-xs font-mono text-neutral-700 bg-white border border-neutral-200 rounded-lg p-3 overflow-x-auto shadow-sm">
                              {JSON.stringify(call.result, null, 2)}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="p-4 bg-[#FAFAFA] border-t-0 shrink-0">
        <div className="max-w-4xl mx-auto relative group">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask something... Use Slash '/' commands for Skills & MCP prompts"
            className="w-full bg-[#F5F5F5] border border-neutral-200 rounded-xl px-4 py-4 pr-12 text-[15px] focus:outline-none focus:ring-2 focus:ring-neutral-200 focus:bg-white transition-all resize-none shadow-sm"
            rows="1"
          />
          <button className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-neutral-400 hover:text-neutral-900 rounded-md hover:bg-neutral-100 transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
}
