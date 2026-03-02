import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { NodeWrapper } from './shared/NodeWrapper';
import { useMcpStore } from '../../stores/mcpStore';

const METHOD_COLORS = {
  GET: 'text-green-600 bg-green-50',
  POST: 'text-blue-600 bg-blue-50',
  PUT: 'text-orange-600 bg-orange-50',
  PATCH: 'text-yellow-600 bg-yellow-50',
  DELETE: 'text-red-600 bg-red-50',
};

export const ApiCallNode = memo(({ id, data, selected }) => {
  const { openNDV } = useMcpStore();

  const method = data.method || 'GET';
  const url = data.url || '';

  // Count active configurations
  const activeConfigs = [
    data.authentication?.type !== 'none',
    data.headers?.enabled && data.headers?.items?.length > 0,
    data.queryParams?.enabled && data.queryParams?.items?.length > 0,
    data.body?.enabled,
  ].filter(Boolean).length;

  const handleClick = () => {
    openNDV(id);
  };

  return (
    <NodeWrapper nodeId={id} nodeType="apiCall" selected={selected}>
      <div
        onClick={handleClick}
        className="bg-white border-2 border-neutral-200 rounded-lg shadow-sm min-w-[220px] cursor-pointer hover:border-neutral-300 transition-colors"
      >
        {/* Input handle */}
        <Handle
          type="target"
          position={Position.Top}
          className="!w-3 !h-3 !bg-neutral-300 !border-2 !border-white"
        />

        {/* Header */}
        <div className="px-3 py-2 border-b border-neutral-100 bg-neutral-50 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-neutral-400">-&gt;</span>
              <span className="text-xs font-semibold text-neutral-600 uppercase tracking-wide">
                HTTP Request
              </span>
            </div>
            {activeConfigs > 0 && (
              <span className="text-xs text-neutral-400">{activeConfigs} config</span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-3">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 text-xs font-semibold rounded ${METHOD_COLORS[method] || 'text-neutral-600 bg-neutral-100'}`}>
              {method}
            </span>
            {url ? (
              <span className="text-xs text-neutral-600 truncate max-w-[140px]">
                {url}
              </span>
            ) : (
              <span className="text-xs text-neutral-400 italic">No URL</span>
            )}
          </div>
          <p className="mt-2 text-xs text-neutral-400">Double-click to configure</p>
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

ApiCallNode.displayName = 'ApiCallNode';
