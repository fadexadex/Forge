import { useTestStore } from '../../stores/testStore';
import { Button } from '../ui/Button';

export function HistoryPanel() {
  const { history, isHistoryOpen, toggleHistory, loadHistoryEntry, clearHistory } = useTestStore();

  if (history.length === 0) return null;

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="border-t border-border shrink-0">
      {/* Toggle header */}
      <button
        onClick={toggleHistory}
        className="w-full flex items-center justify-between px-6 py-2.5 hover:bg-neutral-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`text-muted-foreground transition-transform ${isHistoryOpen ? 'rotate-0' : '-rotate-90'}`}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
          <span className="text-xs font-medium text-neutral-700">
            History ({history.length} {history.length === 1 ? 'run' : 'runs'})
          </span>
        </div>
        {isHistoryOpen && (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              clearHistory();
            }}
            className="text-xs text-muted-foreground"
          >
            Clear
          </Button>
        )}
      </button>

      {/* History cards */}
      {isHistoryOpen && (
        <div className="px-6 pb-3 flex gap-2 overflow-x-auto scrollbar-thin">
          {history.map((entry) => (
            <button
              key={entry.id}
              onClick={() => loadHistoryEntry(entry.id)}
              className="shrink-0 px-3 py-2 rounded-md border border-border hover:bg-neutral-50 transition-colors text-left min-w-[100px]"
            >
              <div className="flex items-center gap-1.5 mb-1">
                <span
                  className={`inline-flex h-1.5 w-1.5 rounded-full ${
                    entry.response.success ? 'bg-green-500' : 'bg-red-500'
                  }`}
                />
                <span className="text-xs font-medium text-neutral-700">
                  {entry.response.success ? `${entry.response.responseTime}ms` : 'Error'}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">{formatTime(entry.timestamp)}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
