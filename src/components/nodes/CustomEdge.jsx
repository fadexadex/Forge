import { memo } from 'react';
import { getBezierPath, EdgeLabelRenderer } from 'reactflow';
import { useMcpStore } from '../../stores/mcpStore';
import { PlusIcon } from './shared/NodeIcons';

export const CustomEdge = memo(({
  id,
  source,
  target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  sourceHandleId,
  targetHandleId,
  style = {},
  markerEnd,
}) => {
  const { openAddNodePicker } = useMcpStore();

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const handleAddNode = (e) => {
    e.stopPropagation();
    openAddNodePicker({
      type: 'edge',
      sourceId: source,
      targetId: target,
      sourceHandle: sourceHandleId,
      targetHandle: targetHandleId,
      position: { x: labelX, y: labelY },
    });
  };

  return (
    <>
      {/* Invisible wider path for easier hover */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
      />

      {/* Visible edge path */}
      <path
        id={id}
        style={style}
        className="react-flow__edge-path fill-none stroke-2 stroke-neutral-300"
        d={edgePath}
        markerEnd={markerEnd}
      />

      {/* Always-visible add node button at midpoint */}
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          <button
            onClick={handleAddNode}
            className="w-6 h-6 flex items-center justify-center
              rounded-full bg-white border-2 border-neutral-300 text-neutral-400
              opacity-70 hover:opacity-100
              hover:border-neutral-900 hover:bg-neutral-900 hover:text-white
              shadow-sm transition-all"
            title="Add node"
          >
            <PlusIcon />
          </button>
        </div>
      </EdgeLabelRenderer>
    </>
  );
});

CustomEdge.displayName = 'CustomEdge';
