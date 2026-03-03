import { useState, useMemo } from 'react';
import { useMcpStore } from '../../stores/mcpStore';
import { Input } from '../ui/Input';

export function ResourceEditor() {
    const { getSelectedItem, updateItem } = useMcpStore();
    const resource = getSelectedItem();

    if (!resource) return null;

    // Fallbacks if not set
    const resourceType = resource.resourceType || 'template';
    const uriTemplate = resource.uriTemplate || '';
    const mimeType = resource.mimeType || 'application/json';
    const staticContent = resource.content || '';

    // Auto-extract variables from {param}
    const variables = useMemo(() => {
        const regex = /\{([^}]+)\}/g;
        let match;
        const vars = new Set();
        while ((match = regex.exec(uriTemplate)) !== null) {
            vars.add(match[1]);
        }
        return Array.from(vars);
    }, [uriTemplate]);

    return (
        <div className="flex-1 flex flex-col bg-white overflow-hidden">
            <div className="h-14 border-b border-border flex items-center px-4 shrink-0 bg-white">
                <h2 className="text-sm font-semibold text-neutral-900 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                        <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-0-2.5z" />
                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                    </svg>
                    {resource.name}
                </h2>
                <span className="ml-3 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    {resourceType === 'direct' ? 'Static Resource' : 'Resource Template'}
                </span>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-4xl mx-auto space-y-8">
                    {/* Header Info */}
                    <div>
                        <h1 className="text-2xl font-semibold text-neutral-900 mb-2">Resource Configuration</h1>
                        <p className="text-sm text-muted-foreground">
                            {resource.description || "No description provided."}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Left column: Basic info */}
                        <div className="space-y-6">
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-neutral-900 border-b border-border pb-2">
                                    General Settings
                                </h3>

                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-neutral-700">Type</label>
                                    <select
                                        value={resourceType}
                                        onChange={(e) => updateItem({ resourceType: e.target.value })}
                                        className="w-full px-3 py-2 text-sm text-neutral-900 bg-white border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-900"
                                    >
                                        <option value="direct">Static Resource</option>
                                        <option value="template">Resource Template</option>
                                    </select>
                                </div>

                                <Input
                                    label={resourceType === 'direct' ? 'URI' : 'URI Template'}
                                    placeholder={resourceType === 'direct' ? 'file:///docs/readme.md' : 'weather://forecast/{city}'}
                                    value={uriTemplate}
                                    onChange={(e) => updateItem({ uriTemplate: e.target.value })}
                                />

                                <Input
                                    label="MIME Type"
                                    placeholder="application/json"
                                    value={mimeType}
                                    onChange={(e) => updateItem({ mimeType: e.target.value })}
                                />
                            </div>

                            {/* Variables list (only for templates) */}
                            {resourceType === 'template' && (
                                <div className="space-y-3">
                                    <h3 className="text-lg font-semibold text-neutral-900 border-b border-border pb-2">
                                        Template Variables
                                    </h3>
                                    {variables.length > 0 ? (
                                        <ul className="space-y-2">
                                            {variables.map((v) => (
                                                <li key={v} className="flex items-center gap-2">
                                                    <code className="text-xs font-mono bg-neutral-100 px-1.5 py-0.5 rounded text-neutral-900">
                                                        {v}
                                                    </code>
                                                    <span className="text-xs text-muted-foreground">Auto-extracted from URI</span>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <div className="text-sm text-muted-foreground border-2 border-dashed border-border rounded-lg p-4 text-center">
                                            No variables found. Use <code className="bg-neutral-100 px-1 py-0.5 rounded">{"{param}"}</code> syntax in your URI template.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Right column: Content/Handler */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-neutral-900 border-b border-border pb-2">
                                {resourceType === 'direct' ? 'Resource Content' : 'Resource Template Data'}
                            </h3>

                            <textarea
                                value={staticContent}
                                onChange={(e) => updateItem({ content: e.target.value })}
                                className="w-full h-96 p-4 text-sm font-mono text-neutral-900 bg-neutral-50 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-neutral-400 focus:bg-white resize-y"
                                placeholder={
                                    resourceType === 'direct'
                                        ? "Enter static content here... (e.g. JSON, markdown, etc)"
                                        : "Enter template data here. You can reference variables via interpolation if your backend runner handles it."
                                }
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
