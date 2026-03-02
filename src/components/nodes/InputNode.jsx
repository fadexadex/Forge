import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { NodeWrapper } from './shared/NodeWrapper';
import { useMcpStore } from '../../stores/mcpStore';

export const InputNode = memo(({ id, data, selected }) => {
  const { openNDV } = useMcpStore();
  const parameters = data.parameters || [];

  const handleClick = () => {
    openNDV(id);
  };

  return (
    <NodeWrapper nodeId={id} nodeType="input" selected={selected}>
      <div
        onClick={handleClick}
        className="bg-white border-2 border-neutral-200 rounded-lg shadow-sm min-w-[200px] cursor-pointer hover:border-neutral-300 transition-colors"
      >
        {/* Header */}
        <div className="px-3 py-2 border-b border-neutral-100 bg-neutral-50 rounded-t-lg">
          <div className="flex items-center gap-2">
            <span className="text-neutral-400">-&gt;</span>
            <span className="text-xs font-semibold text-neutral-600 uppercase tracking-wide">
              Input
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-3">
          {parameters.length === 0 ? (
            <p className="text-xs text-neutral-400">No parameters defined</p>
          ) : (
            <div className="space-y-1">
              {parameters.slice(0, 3).map((param, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="text-sm text-neutral-700">{param.name}</span>
                  <span className="text-xs text-neutral-400">{param.type}</span>
                </div>
              ))}
              {parameters.length > 3 && (
                <p className="text-xs text-neutral-400">+{parameters.length - 3} more</p>
              )}
            </div>
          )}
          <p className="mt-2 text-xs text-neutral-400">Double-click to edit</p>
        </div>

        {/* Output handle */}
        <Handle
          type="source"
          position={Position.Bottom}
          className="!w-3 !h-3 !bg-neutral-300 !border-2 !border-white"
        />
      </div>
    </NodeWrapper>
  );
});

InputNode.displayName = 'InputNode';
