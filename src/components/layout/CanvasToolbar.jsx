import { useMcpStore } from '../../stores/mcpStore';
import { Button } from '../ui/Button';

export function CanvasToolbar() {
  const { getSelectedTool, openAddNodePicker } = useMcpStore();
  const tool = getSelectedTool();

  if (!tool) return null;

  return (
    <div className="absolute top-4 left-4 right-4 z-10 flex items-start justify-between pointer-events-none">
      {/* Tool info */}
      <div className="bg-white border border-border rounded-lg px-4 py-3 shadow-sm pointer-events-auto">
        <h3 className="font-medium text-neutral-900">{tool.name}</h3>
        {tool.description && (
          <p className="text-sm text-muted-foreground mt-0.5 max-w-md">
            {tool.description}
          </p>
        )}
      </div>

      {/* Add node button */}
      <Button
        variant="outline"
        size="sm"
        onClick={openAddNodePicker}
        className="pointer-events-auto bg-white"
      >
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
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Add Node
      </Button>
    </div>
  );
}
