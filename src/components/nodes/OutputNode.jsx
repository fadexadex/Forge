import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { NodeWrapper } from './shared/NodeWrapper';
import { useMcpStore } from '../../stores/mcpStore';

export const OutputNode = memo(({ id, data, selected }) => {
  const { openNDV } = useMcpStore();
  const returnPath = data.returnPath || '';

  const handleClick = () => {
    openNDV(id);
  };

  return (
    <NodeWrapper nodeId={id} nodeType="output" selected={selected}>
      <div
        onClick={handleClick}
        className="bg-white border-2 border-neutral-200 rounded-lg shadow-sm min-w-[200px] cursor-pointer hover:border-neutral-300 transition-colors"
      >
        {/* Input handle */}
        <Handle
          type="target"
          position={Position.Top}
          className="!w-3 !h-3 !bg-neutral-300 !border-2 !border-white"
        />

        {/* Header */}
        <div className="px-3 py-2 border-b border-neutral-100 bg-neutral-50 rounded-t-lg">
          <div className="flex items-center gap-2">
            <span className="text-neutral-400">&lt;-</span>
            <span className="text-xs font-semibold text-neutral-600 uppercase tracking-wide">
              Output
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-3">
          {returnPath ? (
            <code className="text-xs font-mono text-neutral-700 bg-neutral-50 px-2 py-1 rounded block truncate">
              {returnPath}
            </code>
          ) : (
            <p className="text-xs text-neutral-400 italic">No return path</p>
          )}
          <p className="mt-2 text-xs text-neutral-400">Double-click to edit</p>
        </div>
      </div>
    </NodeWrapper>
  );
});

OutputNode.displayName = 'OutputNode';
