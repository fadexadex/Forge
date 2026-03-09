import { useTestStore } from '../../stores/testStore';
import { TestEmptyState } from './TestEmptyState';
import { ToolHeader } from './ToolHeader';
import { InputPanel } from './InputPanel';
import { OutputPanel } from './OutputPanel';
import { HistoryPanel } from './HistoryPanel';
import { ResourcesTestPanel } from './ResourcesTestPanel';
import { PromptsTestPanel } from './PromptsTestPanel';

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

const BookIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
  </svg>
);

const MessageIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

// Tab Button Component
function TabButton({ active, onClick, children, count }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
        active
          ? 'text-neutral-900 border-neutral-900'
          : 'text-muted-foreground border-transparent hover:text-neutral-700 hover:border-neutral-300'
      }`}
    >
      {children}
      {typeof count === 'number' && (
        <span className={`ml-1.5 px-1.5 py-0.5 text-xs rounded-full ${
          active ? 'bg-neutral-900 text-white' : 'bg-muted text-muted-foreground'
        }`}>
          {count}
        </span>
      )}
    </button>
  );
}

export function TestWorkbench() {
  const {
    connectionStatus,
    selectedToolName,
    selectedResourceUri,
    selectedPromptName,
    selectedPrimitiveType,
    setSelectedPrimitiveType,
    getSelectedTool,
    tools,
    resources,
    prompts,
  } = useTestStore();
  
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

  // State 4: Connected - Show Primitive Type Tabs
  return (
    <div className="flex-1 flex flex-col bg-white overflow-hidden">
      {/* Primitive Type Tabs */}
      <div className="border-b border-border bg-white shrink-0">
        <div className="flex">
          <TabButton
            active={selectedPrimitiveType === 'tools'}
            onClick={() => setSelectedPrimitiveType('tools')}
            count={tools.length}
          >
            Tools
          </TabButton>
          <TabButton
            active={selectedPrimitiveType === 'resources'}
            onClick={() => setSelectedPrimitiveType('resources')}
            count={resources.length}
          >
            Resources
          </TabButton>
          <TabButton
            active={selectedPrimitiveType === 'prompts'}
            onClick={() => setSelectedPrimitiveType('prompts')}
            count={prompts.length}
          >
            Prompts
          </TabButton>
        </div>
      </div>

      {/* Tools View */}
      {selectedPrimitiveType === 'tools' && (
        <>
          {!selectedToolName || !selectedTool ? (
            <div className="flex-1 bg-muted/30">
              <TestEmptyState
                icon={<WrenchIcon />}
                heading="Select a tool"
                subtitle="Choose a tool from the sidebar to inspect and test it."
              />
            </div>
          ) : (
            <div className="flex-1 flex flex-col overflow-hidden">
              <ToolHeader tool={selectedTool} />
              <div className="flex-1 flex min-h-0">
                <InputPanel tool={selectedTool} />
                <OutputPanel />
              </div>
              <HistoryPanel />
            </div>
          )}
        </>
      )}

      {/* Resources View */}
      {selectedPrimitiveType === 'resources' && (
        <>
          {resources.length === 0 ? (
            <div className="flex-1 bg-muted/30">
              <TestEmptyState
                icon={<BookIcon />}
                heading="No resources available"
                subtitle="This server has no resources defined. Create resources in the Builder to test them here."
              />
            </div>
          ) : !selectedResourceUri ? (
            <div className="flex-1 bg-muted/30">
              <TestEmptyState
                icon={<BookIcon />}
                heading="Select a resource"
                subtitle="Choose a resource from the sidebar to test it."
              />
            </div>
          ) : (
            <ResourcesTestPanel />
          )}
        </>
      )}

      {/* Prompts View */}
      {selectedPrimitiveType === 'prompts' && (
        <>
          {prompts.length === 0 ? (
            <div className="flex-1 bg-muted/30">
              <TestEmptyState
                icon={<MessageIcon />}
                heading="No prompts available"
                subtitle="This server has no prompts defined. Create prompts in the Builder to test them here."
              />
            </div>
          ) : !selectedPromptName ? (
            <div className="flex-1 bg-muted/30">
              <TestEmptyState
                icon={<MessageIcon />}
                heading="Select a prompt"
                subtitle="Choose a prompt from the sidebar to test it."
              />
            </div>
          ) : (
            <PromptsTestPanel />
          )}
        </>
      )}
    </div>
  );
}
