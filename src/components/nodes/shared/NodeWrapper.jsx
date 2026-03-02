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

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onDoubleClick={handleDoubleClick}
    >
      {/* Delete button */}
      {isDeletable && isHovered && (
        <button
          onClick={handleDelete}
          className="absolute -top-2 -right-2 z-10 w-5 h-5 flex items-center justify-center rounded-full bg-red-500 hover:bg-red-600 text-white shadow-sm transition-all"
          title="Delete node"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}

      {/* Selection ring */}
      <div className={`transition-all ${selected ? 'ring-2 ring-neutral-900 ring-offset-2 rounded-lg' : ''}`}>
        {children}
      </div>
    </div>
  );
}
