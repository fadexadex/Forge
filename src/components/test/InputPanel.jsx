import { useEffect } from 'react';
import { useTestStore } from '../../stores/testStore';
import { SchemaForm } from './SchemaForm';
import { JsonEditor } from './JsonEditor';
import { Button } from '../ui/Button';

export function InputPanel({ tool }) {
  const { inputMode, setInputMode, executeTool, isExecuting, inputValues, rawJsonInput } = useTestStore();

  // Keyboard shortcut: Cmd+Enter to run
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        if (!isExecuting) executeTool();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isExecuting, executeTool]);

  const handleCopyInput = () => {
    let data;
    if (inputMode === 'json') {
      data = rawJsonInput;
    } else {
      data = JSON.stringify(inputValues, null, 2);
    }
    navigator.clipboard.writeText(data);
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 border-r border-border">
      {/* Tab bar */}
      <div className="flex border-b border-border shrink-0">
        <button
          onClick={() => setInputMode('form')}
          className={`px-4 py-2 text-xs font-medium transition-colors ${
            inputMode === 'form'
              ? 'text-neutral-900 border-b-2 border-neutral-900 -mb-px'
              : 'text-muted-foreground hover:text-neutral-600'
          }`}
        >
          Form
        </button>
        <button
          onClick={() => setInputMode('json')}
          className={`px-4 py-2 text-xs font-medium transition-colors ${
            inputMode === 'json'
              ? 'text-neutral-900 border-b-2 border-neutral-900 -mb-px'
              : 'text-muted-foreground hover:text-neutral-600'
          }`}
        >
          JSON
        </button>
      </div>

      {/* Form/JSON content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-4">
        {inputMode === 'form' ? (
          <SchemaForm schema={tool.inputSchema} />
        ) : (
          <JsonEditor />
        )}
      </div>

      {/* Bottom action bar */}
      <div className="p-4 border-t border-border shrink-0 space-y-2">
        <Button onClick={executeTool} disabled={isExecuting} className="w-full">
          {isExecuting ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Running...
            </>
          ) : (
            <>
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
                className="mr-1.5"
              >
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              Run Tool
            </>
          )}
        </Button>
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={handleCopyInput} className="text-xs">
            Copy Input
          </Button>
          <span className="text-[11px] text-muted-foreground">⌘ Enter</span>
        </div>
      </div>
    </div>
  );
}
