import { useState } from 'react';
import { useMcpStore } from '../../stores/mcpStore';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

export function TestTab() {
  const { servers, getSelectedTool, selectedServerId, selectedToolId, selectTool } = useMcpStore();
  const selectedTool = getSelectedTool();

  const [inputs, setInputs] = useState({});
  const [output, setOutput] = useState(null);
  const [isRunning, setIsRunning] = useState(false);

  // Get input parameters from the tool's Input node
  const inputNode = selectedTool?.nodes.find((n) => n.type === 'input');
  const parameters = inputNode?.data?.parameters || [];

  const handleRun = async () => {
    setIsRunning(true);
    setOutput(null);

    // Simulate running the workflow
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setOutput({
      success: true,
      result: {
        message: 'Workflow executed successfully',
        inputs: inputs,
      },
    });
    setIsRunning(false);
  };

  // Flatten tools for the select dropdown
  const allTools = servers.flatMap((server) =>
    server.tools.map((tool) => ({
      serverId: server.id,
      serverName: server.name,
      toolId: tool.id,
      toolName: tool.name,
    }))
  );

  return (
    <div className="p-4 space-y-4">
      {/* Tool selector */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-neutral-700">Tool</label>
        <select
          value={selectedToolId || ''}
          onChange={(e) => {
            const selected = allTools.find((t) => t.toolId === e.target.value);
            if (selected) {
              selectTool(selected.serverId, selected.toolId);
            }
          }}
          className="w-full h-9 px-3 text-sm bg-white border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-900"
        >
          <option value="">Select a tool...</option>
          {allTools.map((tool) => (
            <option key={tool.toolId} value={tool.toolId}>
              {tool.serverName} / {tool.toolName}
            </option>
          ))}
        </select>
      </div>

      {selectedTool && (
        <>
          {/* Input parameters */}
          {parameters.length > 0 ? (
            <div className="space-y-3">
              <label className="text-sm font-medium text-neutral-700">Inputs</label>
              {parameters.map((param) => (
                <Input
                  key={param.name}
                  label={param.name}
                  placeholder={param.type}
                  value={inputs[param.name] || ''}
                  onChange={(e) =>
                    setInputs((prev) => ({
                      ...prev,
                      [param.name]: e.target.value,
                    }))
                  }
                />
              ))}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground py-4 text-center border border-dashed border-border rounded-md">
              No input parameters defined
            </div>
          )}

          {/* Run button */}
          <Button onClick={handleRun} disabled={isRunning} className="w-full">
            {isRunning ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
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

          {/* Output */}
          {output && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-neutral-700">Output</label>
              <pre className="p-3 bg-muted rounded-md text-xs font-mono overflow-auto max-h-60">
                {JSON.stringify(output, null, 2)}
              </pre>
            </div>
          )}
        </>
      )}

      {!selectedTool && (
        <div className="text-sm text-muted-foreground py-8 text-center">
          Select a tool to test
        </div>
      )}
    </div>
  );
}
