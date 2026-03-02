import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { Canvas } from './components/layout/Canvas';
import { CreateServerModal } from './components/modals/CreateServerModal';
import { CreateToolModal } from './components/modals/CreateToolModal';
import { AddNodePicker } from './components/modals/AddNodePicker';

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
      <AddNodePicker />
    </div>
  );
}
