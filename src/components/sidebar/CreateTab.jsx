import { useState } from 'react';
import { useMcpStore } from '../../stores/mcpStore';

export function CreateTab() {
  const {
    servers,
    selectedServerId,
    selectedToolId,
    openCreateServerModal,
    openCreateToolModal,
    selectTool,
    deleteServer,
    deleteTool,
  } = useMcpStore();

  const [expandedServers, setExpandedServers] = useState(new Set());

  const toggleServer = (serverId) => {
    setExpandedServers((prev) => {
      const next = new Set(prev);
      if (next.has(serverId)) {
        next.delete(serverId);
      } else {
        next.add(serverId);
      }
      return next;
    });
  };

  return (
    <div className="p-3">
      {/* Servers section */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Servers
          </span>
          <button
            onClick={openCreateServerModal}
            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-neutral-900 transition-colors"
            title="Create server"
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
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        </div>

        {servers.length === 0 ? (
          <div className="text-sm text-muted-foreground py-4 text-center border border-dashed border-border rounded-md">
            No servers yet
          </div>
        ) : (
          <div className="space-y-1">
            {servers.map((server) => (
              <ServerItem
                key={server.id}
                server={server}
                isExpanded={expandedServers.has(server.id)}
                onToggle={() => toggleServer(server.id)}
                selectedToolId={selectedToolId}
                onSelectTool={selectTool}
                onAddTool={() => openCreateToolModal(server.id)}
                onDeleteServer={() => deleteServer(server.id)}
                onDeleteTool={(toolId) => deleteTool(server.id, toolId)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ServerItem({
  server,
  isExpanded,
  onToggle,
  selectedToolId,
  onSelectTool,
  onAddTool,
  onDeleteServer,
  onDeleteTool,
}) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div>
      {/* Server header */}
      <div
        className="group flex items-center gap-1 px-2 py-1.5 rounded-md hover:bg-muted cursor-pointer"
        onClick={onToggle}
      >
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
          className={`text-muted-foreground transition-transform ${isExpanded ? 'rotate-90' : ''}`}
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>

        <span className="flex-1 text-sm font-medium text-neutral-900 truncate">
          {server.name}
        </span>

        <span className="text-xs text-muted-foreground uppercase">
          {server.transport}
        </span>

        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-neutral-200 text-muted-foreground transition-all"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="1" />
              <circle cx="12" cy="5" r="1" />
              <circle cx="12" cy="19" r="1" />
            </svg>
          </button>

          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 top-full mt-1 z-20 bg-white border border-border rounded-md shadow-lg py-1 min-w-[120px]">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteServer();
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-1.5 text-left text-sm text-red-600 hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Tools list */}
      {isExpanded && (
        <div className="ml-3 pl-3 border-l border-border">
          {server.tools.map((tool) => (
            <ToolItem
              key={tool.id}
              tool={tool}
              isSelected={selectedToolId === tool.id}
              onSelect={() => onSelectTool(server.id, tool.id)}
              onDelete={() => onDeleteTool(tool.id)}
            />
          ))}

          {/* Add tool button */}
          <button
            onClick={onAddTool}
            className="flex items-center gap-2 w-full px-2 py-1.5 text-sm text-muted-foreground hover:text-neutral-900 hover:bg-muted rounded-md transition-colors"
          >
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
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add tool
          </button>
        </div>
      )}
    </div>
  );
}

function ToolItem({ tool, isSelected, onSelect, onDelete }) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div
      className={`
        group flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors
        ${isSelected ? 'bg-neutral-100' : 'hover:bg-muted'}
      `}
      onClick={onSelect}
    >
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
        className="text-muted-foreground"
      >
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
      </svg>

      <span className="flex-1 text-sm text-neutral-700 truncate">{tool.name}</span>

      <div className="relative">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
          className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-neutral-200 text-muted-foreground transition-all"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="1" />
            <circle cx="12" cy="5" r="1" />
            <circle cx="12" cy="19" r="1" />
          </svg>
        </button>

        {showMenu && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowMenu(false)}
            />
            <div className="absolute right-0 top-full mt-1 z-20 bg-white border border-border rounded-md shadow-lg py-1 min-w-[120px]">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                  setShowMenu(false);
                }}
                className="w-full px-3 py-1.5 text-left text-sm text-red-600 hover:bg-red-50"
              >
                Delete
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
