import { useTestStore } from '../../stores/testStore';
import { Button } from '../ui/Button';

export function PromptsTestPanel() {
  const {
    getSelectedPrompt,
    promptInputValues,
    setPromptInputValue,
    executePrompt,
    isExecuting,
    lastPromptResponse,
  } = useTestStore();

  const prompt = getSelectedPrompt();

  if (!prompt) {
    return (
      <div className="flex-1 flex items-center justify-center bg-muted/30">
        <div className="text-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-3 text-muted-foreground">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <h3 className="text-sm font-medium text-neutral-900 mb-1">Select a Prompt</h3>
          <p className="text-sm text-muted-foreground">Choose a prompt from the sidebar to test it.</p>
        </div>
      </div>
    );
  }

  const hasArguments = prompt.arguments && prompt.arguments.length > 0;

  return (
    <div className="flex-1 flex flex-col bg-white overflow-hidden">
      {/* Prompt Header */}
      <div className="h-14 border-b border-border flex items-center px-4 shrink-0 bg-white">
        <div className="flex items-center gap-2 flex-1">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <h2 className="text-sm font-semibold text-neutral-900">{prompt.name}</h2>
        </div>
        <span className="ml-3 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
          Prompt Template
        </span>
      </div>

      <div className="flex-1 flex min-h-0">
        {/* Input Panel */}
        <div className="w-1/2 border-r border-border flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-neutral-50">
            <h3 className="text-xs font-semibold uppercase text-muted-foreground">Input</h3>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Description */}
            {prompt.description && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-neutral-700">Description</label>
                <p className="text-sm text-muted-foreground">{prompt.description}</p>
              </div>
            )}

            {/* Messages Preview */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-700">Messages ({prompt.messages?.length || 0})</label>
              <div className="space-y-2">
                {(prompt.messages || []).map((msg, idx) => (
                  <div key={idx} className="p-2 bg-neutral-50 border border-border rounded text-xs">
                    <span className={`font-semibold ${
                      msg.role === 'system' ? 'text-purple-600' : 
                      msg.role === 'assistant' ? 'text-blue-600' : 'text-green-600'
                    }`}>
                      {msg.role}:
                    </span>
                    <span className="text-neutral-600 ml-2 line-clamp-2">{msg.content}</span>
                  </div>
                ))}
                {(!prompt.messages || prompt.messages.length === 0) && (
                  <p className="text-xs text-muted-foreground italic">No messages defined</p>
                )}
              </div>
            </div>

            {/* Arguments Input */}
            {hasArguments && (
              <div className="space-y-3">
                <label className="text-sm font-medium text-neutral-700">Arguments</label>
                {prompt.arguments.map((arg) => (
                  <div key={arg.name} className="space-y-1">
                    <label className="text-xs font-medium text-neutral-600">
                      {arg.name}
                      {arg.required && <span className="text-red-500 ml-1">*</span>}
                      {arg.description && (
                        <span className="font-normal text-muted-foreground ml-1">
                          — {arg.description}
                        </span>
                      )}
                    </label>
                    {arg.type === 'boolean' ? (
                      <select
                        value={promptInputValues[arg.name] || ''}
                        onChange={(e) => setPromptInputValue(arg.name, e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-900"
                      >
                        <option value="">Select...</option>
                        <option value="true">true</option>
                        <option value="false">false</option>
                      </select>
                    ) : (
                      <input
                        type={arg.type === 'number' ? 'number' : 'text'}
                        value={promptInputValues[arg.name] || ''}
                        onChange={(e) => setPromptInputValue(arg.name, e.target.value)}
                        placeholder={`Enter ${arg.name}...`}
                        className="w-full px-3 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-900"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            {!hasArguments && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-700">
                  This prompt has no arguments. Messages will be returned as-is.
                </p>
              </div>
            )}
          </div>

          {/* Execute Button */}
          <div className="px-4 py-3 border-t border-border bg-white">
            <Button
              onClick={executePrompt}
              disabled={isExecuting}
              className="w-full"
            >
              {isExecuting ? (
                <>
                  <svg className="animate-spin mr-2" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  Getting Prompt...
                </>
              ) : (
                'Get Prompt'
              )}
            </Button>
          </div>
        </div>

        {/* Output Panel */}
        <div className="w-1/2 flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-neutral-50">
            <h3 className="text-xs font-semibold uppercase text-muted-foreground">Output</h3>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {!lastPromptResponse ? (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                Click "Get Prompt" to see the response
              </div>
            ) : lastPromptResponse.success ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-sm font-medium text-green-700">Success</span>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {lastPromptResponse.responseTime}ms
                  </span>
                </div>

                {/* Formatted Messages View */}
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-muted-foreground uppercase">Resolved Messages</div>
                  {lastPromptResponse.data.messages.map((msg, idx) => (
                    <div key={idx} className={`p-3 rounded-lg ${
                      msg.role === 'system' ? 'bg-purple-50 border border-purple-200' :
                      msg.role === 'assistant' ? 'bg-blue-50 border border-blue-200' :
                      'bg-green-50 border border-green-200'
                    }`}>
                      <div className={`text-xs font-semibold uppercase mb-1 ${
                        msg.role === 'system' ? 'text-purple-600' :
                        msg.role === 'assistant' ? 'text-blue-600' :
                        'text-green-600'
                      }`}>
                        {msg.role}
                      </div>
                      <p className="text-sm text-neutral-800 whitespace-pre-wrap">
                        {msg.content?.text || msg.content}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Raw JSON */}
                <div className="p-3 bg-neutral-900 rounded-lg overflow-x-auto">
                  <div className="text-xs text-neutral-400 uppercase mb-2">MCP Response (prompts/get)</div>
                  <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap">
                    {JSON.stringify(lastPromptResponse.data, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  <span className="text-sm font-medium text-red-700">Error</span>
                </div>
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {lastPromptResponse.error}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
