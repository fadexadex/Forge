import { useState, useCallback, useRef, useEffect } from 'react';
import { useMcpStore } from '../../stores/mcpStore';
import { executeWorkflow } from '../../utils/workflowExecutor';
import { WORKFLOW_NODE_TYPES } from '../../utils/constants';

export function CanvasToolbar() {
  const {
    getSelectedItem,
    updateItem,
    executionState,
    startExecution,
    setExecutionStatus,
    setNodeExecutionState,
    setNodeExecutionData,
    resetExecutionState,
  } = useMcpStore();
  const tool = getSelectedItem();

  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [nameValue, setNameValue] = useState('');
  const [descValue, setDescValue] = useState('');
  const nameRef = useRef(null);
  const descRef = useRef(null);

  // Execution modal state
  const [showInputModal, setShowInputModal] = useState(false);
  const [inputValues, setInputValues] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [executionResult, setExecutionResult] = useState(null);

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
      updateItem({ name: nameValue.trim() });
    }
  }, [nameValue, tool, updateItem]);

  const startEditingDesc = useCallback(() => {
    if (!tool) return;
    setDescValue(tool.description || '');
    setIsEditingDesc(true);
    setTimeout(() => descRef.current?.select(), 0);
  }, [tool]);

  const saveDesc = useCallback(() => {
    setIsEditingDesc(false);
    if (descValue !== (tool?.description || '')) {
      updateItem({ description: descValue.trim() });
    }
  }, [descValue, tool, updateItem]);

  const handleNameKeyDown = (e) => {
    if (e.key === 'Enter') saveName();
    if (e.key === 'Escape') setIsEditingName(false);
  };

  const handleDescKeyDown = (e) => {
    if (e.key === 'Enter') saveDesc();
    if (e.key === 'Escape') setIsEditingDesc(false);
  };

  // Get input parameters from the Input node
  const getInputParameters = useCallback(() => {
    if (!tool || !tool.nodes) return [];
    const inputNode = tool.nodes.find(n => n.type === WORKFLOW_NODE_TYPES.INPUT);
    return inputNode?.data?.parameters || [];
  }, [tool]);

  // Get ordered list of nodes for execution animation
  const getExecutionOrder = useCallback(() => {
    if (!tool || !tool.nodes || !tool.edges) return [];

    const nodes = tool.nodes;
    const edges = tool.edges;
    const order = [];
    const visited = new Set();

    // Find input node
    const inputNode = nodes.find(n => n.type === WORKFLOW_NODE_TYPES.INPUT);
    if (!inputNode) return [];

    // BFS traversal following edges
    const queue = [inputNode.id];
    while (queue.length > 0) {
      const nodeId = queue.shift();
      if (visited.has(nodeId)) continue;
      visited.add(nodeId);
      order.push(nodeId);

      // Find outgoing edges and add targets to queue
      const outgoing = edges.filter(e => e.source === nodeId);
      outgoing.forEach(e => {
        if (!visited.has(e.target)) {
          queue.push(e.target);
        }
      });
    }

    return order;
  }, [tool]);

  // Handle execute button click
  const handleExecuteClick = useCallback(() => {
    const params = getInputParameters();
    if (params.length > 0) {
      // Initialize input values with defaults or empty
      const initialValues = {};
      params.forEach(p => {
        initialValues[p.name] = inputValues[p.name] || '';
      });
      setInputValues(initialValues);
      setShowInputModal(true);
    } else {
      // No parameters, execute immediately
      runAnimatedExecution({});
    }
  }, [getInputParameters, inputValues]);

  // Run the workflow with animated node-by-node execution
  const runAnimatedExecution = useCallback(async (inputs) => {
    if (!tool) return;

    setShowInputModal(false);
    setShowResults(false);
    startExecution();

    const nodes = tool.nodes || [];
    const edges = tool.edges || [];
    const executionOrder = getExecutionOrder();

    // Animation delay between nodes (ms)
    const ANIMATION_DELAY = 600;

    try {
      // 1. Actually execute the workflow to get the real path and data
      const result = await executeWorkflow(nodes, edges, inputs);
      
      // 2. Animate through the real execution steps
      for (let i = 0; i < result.steps.length; i++) {
        const step = result.steps[i];
        const nodeId = step.nodeId;

        // Set node to running
        setNodeExecutionState(nodeId, { status: 'running' });
        
        // Wait for animation
        await new Promise(resolve => setTimeout(resolve, ANIMATION_DELAY));

        // Update data and state based on whether this step had an error
        if (step.error) {
          setNodeExecutionState(nodeId, { status: 'failed', error: step.error });
          setNodeExecutionData(nodeId, { input: step.input, error: step.error });
        } else {
          setNodeExecutionState(nodeId, { status: 'completed' });
          setNodeExecutionData(nodeId, { input: step.input, output: step.output });
        }
      }

      // Update final result
      setExecutionResult(result);
      setExecutionStatus(result.success ? 'completed' : 'failed', result.error);
      setShowResults(true);

    } catch (err) {
      setExecutionResult({ success: false, error: err.message, steps: [] });
      setExecutionStatus('failed', err.message);
      setShowResults(true);
    }
  }, [tool, startExecution, setNodeExecutionState, setNodeExecutionData, setExecutionStatus, getExecutionOrder]);

  if (!tool) return null;

  const parameters = getInputParameters();
  const isRunning = executionState.status === 'running';
  const hasExecutionData = executionState.status !== 'idle';

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
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2">
        <button
          onClick={handleExecuteClick}
          disabled={isRunning}
          className={`inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-medium
          text-white rounded-lg shadow-sm transition-colors ${
            isRunning
              ? 'bg-neutral-400 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          {isRunning ? (
            <>
              <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              Running...
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              Execute
            </>
          )}
        </button>

        {hasExecutionData && !isRunning && (
          <button
            onClick={() => {
              resetExecutionState();
              setShowResults(false);
              setExecutionResult(null);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium
            text-neutral-700 bg-white border border-border rounded-lg shadow-sm hover:bg-neutral-50 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
            Clear Execution
          </button>
        )}
      </div>

      {/* Input Modal */}
      {showInputModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="px-4 py-3 border-b border-border">
              <h3 className="font-semibold text-neutral-900">Input Parameters</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Enter values for the workflow input parameters
              </p>
            </div>
            <div className="p-4 space-y-4">
              {parameters.map((param) => (
                <div key={param.name}>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    {param.name}
                    {param.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  {param.description && (
                    <p className="text-xs text-muted-foreground mb-1">{param.description}</p>
                  )}
                  <input
                    type={param.type === 'number' ? 'number' : 'text'}
                    value={inputValues[param.name] || ''}
                    onChange={(e) => setInputValues({ ...inputValues, [param.name]: e.target.value })}
                    placeholder={`Enter ${param.name}...`}
                    className="w-full px-3 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-900"
                  />
                </div>
              ))}
            </div>
            <div className="px-4 py-3 border-t border-border flex justify-end gap-2">
              <button
                onClick={() => setShowInputModal(false)}
                className="px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => runAnimatedExecution(inputValues)}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors"
              >
                Execute
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Execution Results Panel */}
      {showResults && executionResult && (
        <div className="absolute bottom-20 right-4 z-10 w-96 max-h-80 bg-white border border-border rounded-lg shadow-lg overflow-hidden">
          <div className={`px-4 py-2 flex items-center justify-between ${
            executionResult.success ? 'bg-green-50 border-b border-green-200' : 'bg-red-50 border-b border-red-200'
          }`}>
            <div className="flex items-center gap-2">
              {executionResult.success ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-600">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              )}
              <span className={`font-medium text-sm ${executionResult.success ? 'text-green-700' : 'text-red-700'}`}>
                {executionResult.success ? 'Execution Completed' : 'Execution Failed'}
              </span>
            </div>
            <button
              onClick={() => setShowResults(false)}
              className="p-1 hover:bg-neutral-100 rounded"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-500">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div className="p-4 overflow-y-auto max-h-60 space-y-3">
            {/* Execution Steps */}
            {executionResult.steps && executionResult.steps.length > 0 && (
              <div>
                <div className="text-xs font-semibold text-muted-foreground uppercase mb-2">Execution Steps</div>
                <div className="space-y-1">
                  {executionResult.steps.map((step, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      {step.error ? (
                        <span className="w-2 h-2 rounded-full bg-red-500" />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-green-500" />
                      )}
                      <span className="font-mono text-xs bg-neutral-100 px-1 rounded">{step.type}</span>
                      {step.error && <span className="text-xs text-red-600">{step.error}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Error Message */}
            {executionResult.error && (
              <div className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                {executionResult.error}
              </div>
            )}

            {/* Result Data */}
            {executionResult.success && executionResult.data && (
              <div>
                <div className="text-xs font-semibold text-muted-foreground uppercase mb-2">Output Data</div>
                <pre className="text-xs font-mono bg-neutral-900 text-green-400 p-3 rounded overflow-x-auto">
                  {JSON.stringify(executionResult.data, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
