import { useTestStore } from '../../stores/testStore';
import { ResponseViewer } from './ResponseViewer';
import { Button } from '../ui/Button';

export function OutputPanel() {
  const { lastResponse, isExecuting } = useTestStore();

  const handleCopyResponse = () => {
    if (!lastResponse) return;
    const data = lastResponse.success ? lastResponse.data : lastResponse.error;
    const text = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    navigator.clipboard.writeText(text);
  };

  // Empty state
  if (!lastResponse && !isExecuting) {
    return (
      <div className="flex-1 flex items-center justify-center min-w-0">
        <div className="text-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mx-auto mb-3 text-neutral-300"
          >
            <polyline points="16 18 22 12 16 6" />
            <polyline points="8 6 2 12 8 18" />
          </svg>
          <p className="text-sm text-muted-foreground">Run the tool to see output here</p>
        </div>
      </div>
    );
  }

  // Loading state
  if (isExecuting) {
    return (
      <div className="flex-1 p-4 min-w-0 space-y-3">
        <div className="h-4 w-24 bg-neutral-200 rounded animate-pulse" />
        <div className="space-y-2">
          <div className="h-3 bg-neutral-100 rounded animate-pulse" />
          <div className="h-3 bg-neutral-100 rounded animate-pulse w-3/4" />
          <div className="h-3 bg-neutral-100 rounded animate-pulse w-1/2" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-w-0 p-4 overflow-hidden">
      {/* Status bar */}
      <div className="flex items-center justify-between mb-3 shrink-0">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex h-2 w-2 rounded-full ${lastResponse.success ? 'bg-green-500' : 'bg-red-500'}`}
          />
          <span className={`text-sm font-medium ${lastResponse.success ? 'text-green-700' : 'text-red-700'}`}>
            {lastResponse.success ? 'Success' : 'Error'}
          </span>
          <span className="bg-muted text-xs px-2 py-0.5 rounded text-muted-foreground">
            {lastResponse.responseTime}ms
          </span>
        </div>
        <Button variant="ghost" size="icon" onClick={handleCopyResponse}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
            <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
          </svg>
        </Button>
      </div>

      {/* Response body */}
      <div className="flex-1 overflow-auto scrollbar-thin">
        <ResponseViewer
          data={lastResponse.success ? lastResponse.data : lastResponse.error}
          isError={!lastResponse.success}
        />
      </div>
    </div>
  );
}
