import { useMcpStore } from '../../stores/mcpStore';
import { useTestStore } from '../../stores/testStore';

export function Header() {
  const { getSelectedServer, getSelectedTool, activeTab } = useMcpStore();
  const { connectionStatus, serverInfo, getSelectedTool: getTestTool } = useTestStore();
  const server = getSelectedServer();
  const tool = getSelectedTool();
  const isTestMode = activeTab === 'test';
  const testTool = getTestTool();

  return (
    <header className="h-14 flex items-center justify-between px-4 border-b border-border bg-white">
      <div className="flex items-center gap-2 text-sm">
        <span className="font-semibold text-neutral-900">Forge</span>

        {isTestMode ? (
          <>
            <span className="text-neutral-300">/</span>
            <span className="text-muted-foreground">Test Mode</span>
            {connectionStatus === 'connected' && serverInfo && (
              <>
                <span className="text-neutral-300">/</span>
                <div className="flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="connection-pulse absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                  </span>
                  <span className="text-muted-foreground">{serverInfo.name}</span>
                </div>
              </>
            )}
            {testTool && (
              <>
                <span className="text-neutral-300">/</span>
                <span className="text-muted-foreground">{testTool.name}</span>
              </>
            )}
          </>
        ) : (
          <>
            {server && (
              <>
                <span className="text-neutral-300">/</span>
                <span className="text-muted-foreground">{server.name}</span>
              </>
            )}

            {tool && (
              <>
                <span className="text-neutral-300">/</span>
                <span className="text-muted-foreground">{tool.name}</span>
              </>
            )}
          </>
        )}
      </div>
    </header>
  );
}
