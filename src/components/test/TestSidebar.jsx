import { useTestStore } from '../../stores/testStore';
import { ConnectionForm } from './ConnectionForm';
import { ConnectionStatus } from './ConnectionStatus';
import { ToolList } from './ToolList';

export function TestSidebar() {
  const { connectionStatus } = useTestStore();
  const isConnected = connectionStatus === 'connected';

  return (
    <div className="flex flex-col h-full">
      {isConnected ? (
        <>
          <ConnectionStatus />
          <ToolList />
        </>
      ) : (
        <ConnectionForm />
      )}
    </div>
  );
}
