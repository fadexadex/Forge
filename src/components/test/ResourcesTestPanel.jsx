import { useTestStore } from '../../stores/testStore';
import { Button } from '../ui/Button';

export function ResourcesTestPanel() {
  const {
    getSelectedResource,
    resourceInputValues,
    setResourceInputValue,
    executeResource,
    isExecuting,
    lastResourceResponse,
  } = useTestStore();

  const resource = getSelectedResource();

  if (!resource) {
    return (
      <div className="flex-1 flex items-center justify-center bg-muted/30">
        <div className="text-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-3 text-muted-foreground">
            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
          </svg>
          <h3 className="text-sm font-medium text-neutral-900 mb-1">Select a Resource</h3>
          <p className="text-sm text-muted-foreground">Choose a resource from the sidebar to test it.</p>
        </div>
      </div>
    );
  }

  const hasVariables = resource.variables && resource.variables.length > 0;

  return (
    <div className="flex-1 flex flex-col bg-white overflow-hidden">
      {/* Resource Header */}
      <div className="h-14 border-b border-border flex items-center px-4 shrink-0 bg-white">
        <div className="flex items-center gap-2 flex-1">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
          </svg>
          <h2 className="text-sm font-semibold text-neutral-900">{resource.name}</h2>
        </div>
        <span className="ml-3 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
          {resource.resourceType === 'direct' ? 'Static' : 'Template'}
        </span>
      </div>

      <div className="flex-1 flex min-h-0">
        {/* Input Panel */}
        <div className="w-1/2 border-r border-border flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-neutral-50">
            <h3 className="text-xs font-semibold uppercase text-muted-foreground">Input</h3>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* URI Display */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-neutral-700">URI Template</label>
              <div className="px-3 py-2 text-sm font-mono bg-neutral-100 border border-border rounded-md text-neutral-700">
                {resource.uri}
              </div>
            </div>

            {/* MIME Type */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-neutral-700">MIME Type</label>
              <div className="px-3 py-2 text-sm bg-neutral-100 border border-border rounded-md text-neutral-700">
                {resource.mimeType}
              </div>
            </div>

            {/* Description */}
            {resource.description && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-neutral-700">Description</label>
                <p className="text-sm text-muted-foreground">{resource.description}</p>
              </div>
            )}

            {/* Variables Input */}
            {hasVariables && (
              <div className="space-y-3">
                <label className="text-sm font-medium text-neutral-700">Template Variables</label>
                {resource.variables.map((variable) => (
                  <div key={variable.name} className="space-y-1">
                    <label className="text-xs font-medium text-neutral-600">
                      {variable.name}
                      {variable.description && (
                        <span className="font-normal text-muted-foreground ml-1">
                          — {variable.description}
                        </span>
                      )}
                    </label>
                    <input
                      type="text"
                      value={resourceInputValues[variable.name] || ''}
                      onChange={(e) => setResourceInputValue(variable.name, e.target.value)}
                      placeholder={`Enter ${variable.name}...`}
                      className="w-full px-3 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-900"
                    />
                  </div>
                ))}
              </div>
            )}

            {!hasVariables && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-700">
                  This is a static resource with no template variables.
                </p>
              </div>
            )}
          </div>

          {/* Execute Button */}
          <div className="px-4 py-3 border-t border-border bg-white">
            <Button
              onClick={executeResource}
              disabled={isExecuting}
              className="w-full"
            >
              {isExecuting ? (
                <>
                  <svg className="animate-spin mr-2" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  Reading...
                </>
              ) : (
                'Read Resource'
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
            {!lastResourceResponse ? (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                Click "Read Resource" to see the response
              </div>
            ) : lastResourceResponse.success ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-sm font-medium text-green-700">Success</span>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {lastResourceResponse.responseTime}ms
                  </span>
                </div>
                <div className="p-3 bg-neutral-900 rounded-lg overflow-x-auto">
                  <div className="text-xs text-neutral-400 uppercase mb-2">MCP Response (resources/read)</div>
                  <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap">
                    {JSON.stringify(lastResourceResponse.data, null, 2)}
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
                  {lastResourceResponse.error}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
