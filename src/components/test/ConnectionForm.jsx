import { useTestStore } from '../../stores/testStore';
import { useMcpStore } from '../../stores/mcpStore';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';

const transportOptions = [
  { value: 'sse', label: 'SSE' },
  { value: 'streamable-http', label: 'Streamable HTTP' },
];

export function ConnectionForm() {
  const { serverUrl, transportType, connectionStatus, connectionError, setServerUrl, setTransportType, connect, testMode, setTestMode, selectedBuilderServerId, setSelectedBuilderServerId } =
    useTestStore();
  
  const servers = useMcpStore((state) => state.servers);

  const isConnecting = connectionStatus === 'connecting';

  // Build server options for the builder mode dropdown
  const serverOptions = servers.map((server) => ({
    value: server.id,
    label: server.name,
  }));

  const handleSubmit = (e) => {
    e.preventDefault();
    connect();
  };

  // Check if we can connect in builder mode (need at least one server with tools)
  const canConnectBuilder = servers.length > 0 && selectedBuilderServerId;

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-3">
      <div className="flex gap-2 mb-4 p-1 bg-muted rounded-md text-xs font-medium">
        <button
          type="button"
          onClick={() => setTestMode('builder')}
          className={`flex-1 py-1.5 px-2 rounded-sm transition-colors ${testMode === 'builder' ? 'bg-white shadow-sm text-neutral-900' : 'text-neutral-500 hover:text-neutral-700'}`}
        >
          Builder Preview
        </button>
        <button
          type="button"
          onClick={() => setTestMode('external')}
          className={`flex-1 py-1.5 px-2 rounded-sm transition-colors ${testMode === 'external' ? 'bg-white shadow-sm text-neutral-900' : 'text-neutral-500 hover:text-neutral-700'}`}
        >
          External Server
        </button>
      </div>

      {testMode === 'builder' && (
        <>
          {servers.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-2">
              No servers available. Create a server first.
            </p>
          ) : (
            <Select
              label="Select Server"
              options={serverOptions}
              value={selectedBuilderServerId || ''}
              onChange={(e) => setSelectedBuilderServerId(e.target.value)}
              disabled={isConnecting}
              placeholder="Choose a server to test..."
            />
          )}
        </>
      )}

      {testMode === 'external' && (
        <>
          <Input
            label="Server URL"
            placeholder="http://localhost:3000/mcp"
            value={serverUrl}
            onChange={(e) => setServerUrl(e.target.value)}
            disabled={isConnecting}
          />

          <Select
            label="Transport Type"
            options={transportOptions}
            value={transportType}
            onChange={(e) => setTransportType(e.target.value)}
            disabled={isConnecting}
          />
        </>
      )}

      <Button type="submit" className="w-full" disabled={isConnecting || (testMode === 'external' && !serverUrl.trim()) || (testMode === 'builder' && !canConnectBuilder)}>
        {isConnecting ? (
          <>
            <svg
              className="animate-spin -ml-1 mr-2 h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Connecting...
          </>
        ) : (
          'Connect'
        )}
      </Button>

      {connectionStatus === 'error' && connectionError && (
        <p className="text-xs text-red-500">Failed to connect: {connectionError}</p>
      )}
    </form>
  );
}
