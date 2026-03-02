import { useMcpStore } from '../../stores/mcpStore';
import { CreateTab } from '../sidebar/CreateTab';
import { TestTab } from '../sidebar/TestTab';

export function Sidebar() {
  const { activeTab, setActiveTab } = useMcpStore();

  return (
    <aside className="w-64 h-full border-r border-border bg-white flex flex-col">
      {/* Tab buttons */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab('create')}
          className={`
            flex-1 px-4 py-3 text-sm font-medium transition-colors
            ${activeTab === 'create'
              ? 'text-neutral-900 border-b-2 border-neutral-900 -mb-px'
              : 'text-muted-foreground hover:text-neutral-600'
            }
          `}
        >
          Create
        </button>
        <button
          onClick={() => setActiveTab('test')}
          className={`
            flex-1 px-4 py-3 text-sm font-medium transition-colors
            ${activeTab === 'test'
              ? 'text-neutral-900 border-b-2 border-neutral-900 -mb-px'
              : 'text-muted-foreground hover:text-neutral-600'
            }
          `}
        >
          Test
        </button>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {activeTab === 'create' && <CreateTab />}
        {activeTab === 'test' && <TestTab />}
      </div>
    </aside>
  );
}
