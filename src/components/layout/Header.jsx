import { useMcpStore } from '../../stores/mcpStore';
import { Button } from '../ui/Button';

export function Header() {
  const { getSelectedServer, getSelectedTool } = useMcpStore();
  const server = getSelectedServer();
  const tool = getSelectedTool();

  return (
    <header className="h-14 flex items-center justify-between px-4 border-b border-border bg-white">
      <div className="flex items-center gap-2 text-sm">
        <span className="font-semibold text-neutral-900">Forge</span>

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
      </div>

      <div className="flex items-center gap-2">
        {tool && (
          <Button size="sm">
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
              className="mr-1.5"
            >
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            Run
          </Button>
        )}
      </div>
    </header>
  );
}
