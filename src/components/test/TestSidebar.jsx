import { useTestStore } from '../../stores/testStore';
import { ConnectionForm } from './ConnectionForm';
import { ConnectionStatus } from './ConnectionStatus';
import { ToolList } from './ToolList';
import { ResourceList } from './ResourceList';
import { PromptList } from './PromptList';

export function TestSidebar() {
  const { connectionStatus, selectedPrimitiveType } = useTestStore();
  const isConnected = connectionStatus === 'connected';

  const renderList = () => {
    switch (selectedPrimitiveType) {
      case 'resources':
        return <ResourceList />;
      case 'prompts':
        return <PromptList />;
      case 'tools':
      default:
        return <ToolList />;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {isConnected ? (
        <>
          <ConnectionStatus />
          {renderList()}
        </>
      ) : (
        <ConnectionForm />
      )}
    </div>
  );
}
