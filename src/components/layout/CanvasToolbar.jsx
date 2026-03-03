import { useState, useCallback, useRef, useEffect } from 'react';
import { useMcpStore } from '../../stores/mcpStore';

export function CanvasToolbar() {
  const { getSelectedTool, updateTool } = useMcpStore();
  const tool = getSelectedTool();

  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [nameValue, setNameValue] = useState('');
  const [descValue, setDescValue] = useState('');
  const nameRef = useRef(null);
  const descRef = useRef(null);

  useEffect(() => {
    if (tool) {
      setNameValue(tool.name);
      setDescValue(tool.description || '');
    }
  }, [tool?.id]);

  const startEditingName = useCallback(() => {
    if (!tool) return;
    setNameValue(tool.name);
    setIsEditingName(true);
    setTimeout(() => nameRef.current?.select(), 0);
  }, [tool]);

  const saveName = useCallback(() => {
    setIsEditingName(false);
    if (nameValue.trim() && nameValue !== tool?.name) {
      updateTool({ name: nameValue.trim() });
    }
  }, [nameValue, tool, updateTool]);

  const startEditingDesc = useCallback(() => {
    if (!tool) return;
    setDescValue(tool.description || '');
    setIsEditingDesc(true);
    setTimeout(() => descRef.current?.select(), 0);
  }, [tool]);

  const saveDesc = useCallback(() => {
    setIsEditingDesc(false);
    if (descValue !== (tool?.description || '')) {
      updateTool({ description: descValue.trim() });
    }
  }, [descValue, tool, updateTool]);

  const handleNameKeyDown = (e) => {
    if (e.key === 'Enter') saveName();
    if (e.key === 'Escape') setIsEditingName(false);
  };

  const handleDescKeyDown = (e) => {
    if (e.key === 'Enter') saveDesc();
    if (e.key === 'Escape') setIsEditingDesc(false);
  };

  if (!tool) return null;

  return (
    <>
      {/* Editable name/description — top left */}
      <div className="absolute top-4 left-4 z-10">
        <div className="bg-white border border-border rounded-lg px-4 py-3 shadow-sm">
          {isEditingName ? (
            <input
              ref={nameRef}
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
              onBlur={saveName}
              onKeyDown={handleNameKeyDown}
              className="font-medium text-neutral-900 bg-transparent border-b border-neutral-300
                focus:outline-none focus:border-neutral-900 w-full"
              autoFocus
            />
          ) : (
            <h3
              onClick={startEditingName}
              className="font-medium text-neutral-900 cursor-pointer hover:text-neutral-600 transition-colors"
              title="Click to edit"
            >
              {tool.name}
            </h3>
          )}

          {isEditingDesc ? (
            <input
              ref={descRef}
              value={descValue}
              onChange={(e) => setDescValue(e.target.value)}
              onBlur={saveDesc}
              onKeyDown={handleDescKeyDown}
              placeholder="Add a description..."
              className="text-sm text-muted-foreground mt-1 bg-transparent border-b border-neutral-300
                focus:outline-none focus:border-neutral-900 w-full max-w-md"
              autoFocus
            />
          ) : (
            <p
              onClick={startEditingDesc}
              className="text-sm text-muted-foreground mt-0.5 max-w-md cursor-pointer
                hover:text-neutral-600 transition-colors"
              title="Click to edit"
            >
              {tool.description || 'Add a description...'}
            </p>
          )}
        </div>
      </div>

      {/* Execute button — bottom center */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10">
        <button className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-medium
          text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg shadow-sm transition-colors">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
          Execute
        </button>
      </div>
    </>
  );
}
