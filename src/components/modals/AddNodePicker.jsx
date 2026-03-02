import { Modal } from './Modal';
import { useMcpStore } from '../../stores/mcpStore';
import { WORKFLOW_NODE_TYPES, NODE_TYPE_META } from '../../utils/constants';

const addableNodeTypes = [
  WORKFLOW_NODE_TYPES.API_CALL,
  WORKFLOW_NODE_TYPES.TRANSFORM,
  WORKFLOW_NODE_TYPES.CONDITION,
];

export function AddNodePicker() {
  const { isAddNodePickerOpen, closeAddNodePicker, addNode } = useMcpStore();

  const handleAddNode = (nodeType) => {
    addNode(nodeType);
  };

  return (
    <Modal
      isOpen={isAddNodePickerOpen}
      onClose={closeAddNodePicker}
      title="Add Node"
    >
      <div className="space-y-2">
        {addableNodeTypes.map((nodeType) => {
          const meta = NODE_TYPE_META[nodeType];
          return (
            <button
              key={nodeType}
              onClick={() => handleAddNode(nodeType)}
              className="
                w-full flex items-start gap-4 p-4
                text-left rounded-lg border border-border
                hover:border-neutral-400 hover:bg-muted
                transition-colors
              "
            >
              <span className="text-2xl w-8 text-center text-neutral-400">
                {meta.icon}
              </span>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-neutral-900">{meta.label}</h4>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {meta.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </Modal>
  );
}
