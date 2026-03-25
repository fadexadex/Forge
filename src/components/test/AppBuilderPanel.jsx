export function AppBuilderPanel() {
  return (
    <div className="flex-1 flex flex-col bg-[#FAFAFA] h-full overflow-hidden p-8 items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col">
        <div className="px-4 py-3 border-b border-border bg-neutral-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="text-orange-500" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="18" x="3" y="3" rx="2" />
              <path d="M3 9h18" />
              <path d="M9 21V9" />
            </svg>
            <span className="text-sm font-semibold text-neutral-900">Paystack Widget (MCP Apps)</span>
          </div>
          <div className="flex gap-1">
            <div className="w-2.5 h-2.5 rounded-full bg-neutral-300"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-neutral-300"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-neutral-300"></div>
          </div>
        </div>
        
        <div className="p-6 flex flex-col items-center justify-center min-h-[300px] bg-white">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
          </div>
          <h3 className="text-lg font-bold text-neutral-900 mb-1">Account Balance</h3>
          <p className="text-sm text-muted-foreground mb-6">Interactive widget powered by MCP Apps</p>
          
          <div className="w-full bg-neutral-50 rounded-xl p-4 border border-border flex items-center justify-between">
            <span className="text-sm font-medium text-neutral-600">NGN Balance</span>
            <span className="text-xl font-bold text-neutral-900">₦45,603,685.00</span>
          </div>
          
          <button className="mt-6 w-full py-2.5 bg-neutral-900 text-white rounded-xl text-sm font-medium hover:bg-neutral-800 transition-colors shadow-sm">
            Refresh Balance
          </button>
        </div>
      </div>
      <p className="mt-6 text-sm text-muted-foreground max-w-md text-center">
        This is a mock interactive widget demonstrating SEP-1865 (MCP Apps). In a real environment, this is rendered via a sandboxed iframe with a JSON-RPC bridge.
      </p>
    </div>
  );
}
