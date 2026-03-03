import { useTestStore } from '../../stores/testStore';
import { TestEmptyState } from './TestEmptyState';
import { ToolHeader } from './ToolHeader';
import { InputPanel } from './InputPanel';
import { OutputPanel } from './OutputPanel';
import { HistoryPanel } from './HistoryPanel';

// Icons
const ServerIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
    <rect width="20" height="8" x="2" y="2" rx="2" ry="2" />
    <rect width="20" height="8" x="2" y="14" rx="2" ry="2" />
    <line x1="6" x2="6.01" y1="6" y2="6" />
    <line x1="6" x2="6.01" y1="18" y2="18" />
  </svg>
);

const WrenchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
  </svg>
);

const WarningIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
    <path d="M12 9v4" />
    <path d="M12 17h.01" />
  </svg>
);

export function TestWorkbench() {
  const { connectionStatus, selectedToolName, getSelectedTool } = useTestStore();
  const selectedTool = getSelectedTool();

  // State 1: Disconnected
  if (connectionStatus === 'disconnected') {
    return (
      <div className="flex-1 bg-muted/30">
        <TestEmptyState
          icon={<ServerIcon />}
          heading="Connect to an MCP Server"
          subtitle="Enter a server URL in the sidebar to discover and test available tools."
        />
      </div>
    );
  }

  // State 2: Connecting
  if (connectionStatus === 'connecting') {
    return (
      <div className="flex-1 flex items-center justify-center bg-muted/30">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <span className="relative flex h-4 w-4">
              <span className="connection-pulse absolute inline-flex h-full w-full rounded-full bg-neutral-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-4 w-4 bg-neutral-500" />
            </span>
          </div>
          <p className="text-sm text-muted-foreground">Establishing connection...</p>
        </div>
      </div>
    );
  }

  // State 3: Connection Error
  if (connectionStatus === 'error') {
    return (
      <div className="flex-1 bg-muted/30">
        <TestEmptyState
          icon={<WarningIcon />}
          heading="Connection failed"
          subtitle="Check the URL and try again."
        />
      </div>
    );
  }

  // State 4: Connected, no tool selected
  if (!selectedToolName || !selectedTool) {
    return (
      <div className="flex-1 bg-muted/30">
        <TestEmptyState
          icon={<WrenchIcon />}
          heading="Select a tool"
          subtitle="Choose a tool from the sidebar to inspect and test it."
        />
      </div>
    );
  }

  // State 5: Tool selected — The Workbench
  return (
    <div className="flex-1 flex flex-col bg-white overflow-hidden">
      <ToolHeader tool={selectedTool} />

      <div className="flex-1 flex min-h-0">
        <InputPanel tool={selectedTool} />
        <OutputPanel />
      </div>

      <HistoryPanel />
    </div>
  );
}
