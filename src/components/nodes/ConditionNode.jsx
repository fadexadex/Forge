import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { NodeWrapper } from './shared/NodeWrapper';
import { useMcpStore } from '../../stores/mcpStore';

export const ConditionNode = memo(({ id, data, selected }) => {
  const { openNDV } = useMcpStore();
  const expression = data.expression || '';

  const handleClick = () => {
    openNDV(id);
  };

  return (
    <NodeWrapper nodeId={id} nodeType="condition" selected={selected}>
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
            <span className="text-neutral-400">-&gt;</span>
            <span className="text-xs font-semibold text-neutral-600 uppercase tracking-wide">
              Condition
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-3">
          {expression ? (
            <code className="text-xs font-mono text-neutral-700 bg-neutral-50 px-2 py-1 rounded block truncate">
              {expression}
            </code>
          ) : (
            <p className="text-xs text-neutral-400 italic">No condition</p>
          )}
        </div>

        {/* Output handles */}
        <div className="flex justify-between px-3 pb-2">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-400" />
            <span className="text-xs text-neutral-500">true</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs text-neutral-500">false</span>
            <div className="w-2 h-2 rounded-full bg-red-400" />
          </div>
        </div>

        <Handle
          type="source"
          position={Position.Bottom}
          id="true"
          style={{ left: '25%' }}
          className="!w-3 !h-3 !bg-green-400 !border-2 !border-white"
        />
        <Handle
          type="source"
          position={Position.Bottom}
          id="false"
          style={{ left: '75%' }}
          className="!w-3 !h-3 !bg-red-400 !border-2 !border-white"
        />
      </div>
    </NodeWrapper>
  );
});

ConditionNode.displayName = 'ConditionNode';
