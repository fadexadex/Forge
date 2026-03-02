import { memo, useState } from 'react';
import { getBezierPath, EdgeLabelRenderer } from 'reactflow';
import { useMcpStore } from '../../stores/mcpStore';

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
  const [isHovered, setIsHovered] = useState(false);
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
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      />

      {/* Visible edge path */}
      <path
        id={id}
        style={style}
        className={`react-flow__edge-path fill-none stroke-2 transition-colors ${
          isHovered ? 'stroke-neutral-500' : 'stroke-neutral-300'
        }`}
        d={edgePath}
        markerEnd={markerEnd}
      />

      {/* Add node button at midpoint */}
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <button
            onClick={handleAddNode}
            className={`
              w-6 h-6 flex items-center justify-center
              rounded-full bg-white border-2 border-neutral-300
              hover:border-neutral-900 hover:bg-neutral-900 hover:text-white
              text-neutral-500 shadow-sm
              transition-all duration-150
              ${isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}
            `}
            title="Add node"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        </div>
      </EdgeLabelRenderer>
    </>
  );
});

CustomEdge.displayName = 'CustomEdge';
