import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { Canvas } from './components/layout/Canvas';
import { CreateServerModal } from './components/modals/CreateServerModal';
import { CreateToolModal } from './components/modals/CreateToolModal';
import { CreateResourceModal } from './components/modals/CreateResourceModal';
import { CreatePromptModal } from './components/modals/CreatePromptModal';
import { AddNodePicker } from './components/modals/AddNodePicker';
import { NodeDetailView } from './components/ndv/NodeDetailView';

export default function App() {
  return (
    <div className="h-screen w-screen flex flex-col bg-white overflow-hidden">
      <Header />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <Canvas />
      </div>

      {/* Modals */}
      <CreateServerModal />
      <CreateToolModal />
      <CreateResourceModal />
      <CreatePromptModal />
      <AddNodePicker />

      {/* Node Detail View */}
      <NodeDetailView />
    </div>
  );
}
