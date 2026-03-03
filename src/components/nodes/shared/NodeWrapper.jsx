import { useState, useCallback } from 'react';
import { useMcpStore } from '../../../stores/mcpStore';
import { NODE_TYPE_META } from '../../../utils/constants';

export function NodeWrapper({ nodeId, nodeType, selected, children }) {
  const [isHovered, setIsHovered] = useState(false);
  const { deleteNode, openNDV } = useMcpStore();

  const meta = NODE_TYPE_META[nodeType];
  const isDeletable = meta?.deletable !== false;

  const handleDelete = useCallback((e) => {
    e.stopPropagation();
    if (isDeletable) {
      deleteNode(nodeId);
    }
  }, [nodeId, isDeletable, deleteNode]);

  const handleDoubleClick = useCallback((e) => {
    e.stopPropagation();
    openNDV(nodeId);
  }, [nodeId, openNDV]);

  // Show the floating toolbar if the node is hovered OR selected
  const showToolbar = (isHovered || selected) && isDeletable;

  return (
    <div
      className="relative flex flex-col items-center group cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onDoubleClick={handleDoubleClick}
      onClick={() => openNDV(nodeId)}
    >
      {/* Floating Action Menu */}
      <div
        className={`absolute -top-12 z-20 flex items-center gap-1 p-1 bg-white border border-neutral-200 rounded-lg shadow-sm transition-all duration-200 ${showToolbar ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
          }`}
      >
        {isDeletable && (
          <button
            onClick={handleDelete}
            className="w-8 h-8 flex items-center justify-center rounded-md text-neutral-500 hover:text-red-600 hover:bg-red-50 transition-colors"
            title="Delete node"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 6h18" />
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
            </svg>
          </button>
        )}
      </div>

      {/* Node Content */}
      <div className="relative flex flex-col items-center">
        {children}
      </div>
    </div>
  );
}
