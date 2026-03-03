import { useState, useCallback } from 'react';
import { useMcpStore } from '../../stores/mcpStore';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

export function PromptBuilder() {
    const { getSelectedItem, updateItem } = useMcpStore();
    const prompt = getSelectedItem();

    if (!prompt) return null;

    const [newArgName, setNewArgName] = useState('');
    const [newArgDesc, setNewArgDesc] = useState('');
    const [newArgType, setNewArgType] = useState('string');
    const [newArgRequired, setNewArgRequired] = useState(false);

    const handleAddArg = (e) => {
        e.preventDefault();
        if (!newArgName.trim()) return;

        const newArg = {
            name: newArgName.trim(),
            description: newArgDesc.trim(),
            type: newArgType,
            required: newArgRequired,
        };

        updateItem({ arguments: [...(prompt.arguments || []), newArg] });

        setNewArgName('');
        setNewArgDesc('');
        setNewArgType('string');
        setNewArgRequired(false);
    };

    const handleRemoveArg = (index) => {
        const newArgs = [...(prompt.arguments || [])];
        newArgs.splice(index, 1);
        updateItem({ arguments: newArgs });
    };

    const handleUpdateArg = (index, field, value) => {
        const newArgs = [...(prompt.arguments || [])];
        newArgs[index] = { ...newArgs[index], [field]: value };
        updateItem({ arguments: newArgs });
    };

    // Messages array management
    const messages = prompt.messages || [];

    const handleAddMessage = () => {
        updateItem({ messages: [...messages, { role: 'user', content: '' }] });
    };

    const handleUpdateMessage = (index, field, value) => {
        const newMessages = [...messages];
        newMessages[index] = { ...newMessages[index], [field]: value };
        updateItem({ messages: newMessages });
    };

    const handleRemoveMessage = (index) => {
        const newMessages = [...messages];
        newMessages.splice(index, 1);
        updateItem({ messages: newMessages });
    };

    const handleMoveMessage = (index, direction) => {
        if (direction === 'up' && index > 0) {
            const newMessages = [...messages];
            [newMessages[index - 1], newMessages[index]] = [newMessages[index], newMessages[index - 1]];
            updateItem({ messages: newMessages });
        } else if (direction === 'down' && index < messages.length - 1) {
            const newMessages = [...messages];
            [newMessages[index + 1], newMessages[index]] = [newMessages[index], newMessages[index + 1]];
            updateItem({ messages: newMessages });
        }
    };

    return (
        <div className="flex-1 flex flex-col bg-white overflow-hidden">
            <div className="h-14 border-b border-border flex items-center px-4 shrink-0 bg-white">
                <h2 className="text-sm font-semibold text-neutral-900 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                    {prompt.name}
                </h2>
                <span className="ml-3 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    Prompt Template
                </span>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-4xl mx-auto space-y-12">
                    {/* Header Info */}
                    <div>
                        <h1 className="text-2xl font-semibold text-neutral-900 mb-2">Prompt Configuration</h1>
                        <p className="text-sm text-muted-foreground">
                            {prompt.description || "No description provided."}
                        </p>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-border pb-2">
                            <h3 className="text-lg font-semibold text-neutral-900">
                                Messages
                            </h3>
                            <Button variant="outline" size="sm" onClick={handleAddMessage}>
                                Add Message
                            </Button>
                        </div>

                        {messages.length === 0 ? (
                            <div className="text-sm text-muted-foreground py-10 text-center border-2 border-dashed border-border rounded-lg bg-neutral-50 flex flex-col items-center">
                                <p className="mb-2">No messages defined. The prompt will be empty.</p>
                                <Button variant="primary" size="sm" onClick={handleAddMessage}>
                                    Create First Message
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {messages.map((msg, idx) => (
                                    <div key={idx} className="flex flex-col gap-3 p-4 border border-border rounded-lg bg-white shadow-sm focus-within:ring-2 focus-within:ring-neutral-200 transition-all">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <select
                                                    value={msg.role}
                                                    onChange={(e) => handleUpdateMessage(idx, 'role', e.target.value)}
                                                    className="px-3 py-1.5 text-sm font-medium text-neutral-900 bg-neutral-100 border-none rounded focus:outline-none focus:ring-2 focus:ring-neutral-300"
                                                >
                                                    <option value="system">System</option>
                                                    <option value="user">User</option>
                                                    <option value="assistant">Assistant</option>
                                                </select>
                                                <span className="text-xs text-muted-foreground">
                                                    Use <code className="bg-neutral-100 px-1 py-0.5 rounded">{"{{arg_name}}"}</code> to interpolate arguments.
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <button onClick={() => handleMoveMessage(idx, 'up')} disabled={idx === 0} className="p-1.5 text-muted-foreground hover:bg-neutral-100 rounded disabled:opacity-30">
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6" /></svg>
                                                </button>
                                                <button onClick={() => handleMoveMessage(idx, 'down')} disabled={idx === messages.length - 1} className="p-1.5 text-muted-foreground hover:bg-neutral-100 rounded disabled:opacity-30">
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                                                </button>
                                                <button onClick={() => handleRemoveMessage(idx)} className="p-1.5 text-red-500 hover:bg-red-50 rounded ml-2">
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                                                </button>
                                            </div>
                                        </div>
                                        <textarea
                                            value={msg.content}
                                            onChange={(e) => handleUpdateMessage(idx, 'content', e.target.value)}
                                            placeholder={`Enter ${msg.role} message...`}
                                            className="w-full min-h-[100px] p-3 text-sm text-neutral-900 font-mono bg-neutral-50 border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-neutral-400 focus:bg-white resize-y"
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="space-y-6">
                        <h3 className="text-lg font-semibold text-neutral-900 border-b border-border pb-2">
                            Arguments
                        </h3>

                        {/* Arguments List */}
                        {(!prompt.arguments || prompt.arguments.length === 0) ? (
                            <div className="text-sm text-muted-foreground py-6 text-center border-2 border-dashed border-border rounded-lg bg-neutral-50">
                                No arguments defined for this prompt.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {prompt.arguments.map((arg, idx) => (
                                    <div key={idx} className="flex flex-col gap-3 p-4 border border-border rounded-md bg-white hover:border-neutral-300 transition-colors">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-4">
                                                <div className="col-span-1 lg:col-span-1">
                                                    <label className="text-[10px] uppercase font-bold text-muted-foreground mb-1 block">Name</label>
                                                    <input
                                                        type="text"
                                                        value={arg.name}
                                                        onChange={(e) => handleUpdateArg(idx, 'name', e.target.value)}
                                                        className="w-full text-sm font-medium text-neutral-900 border-b border-transparent hover:border-neutral-200 focus:border-neutral-900 focus:outline-none bg-transparent px-1 py-0.5"
                                                    />
                                                </div>
                                                <div className="col-span-1 lg:col-span-1">
                                                    <label className="text-[10px] uppercase font-bold text-muted-foreground mb-1 block">Type</label>
                                                    <select
                                                        value={arg.type}
                                                        onChange={(e) => handleUpdateArg(idx, 'type', e.target.value)}
                                                        className="w-full text-sm text-neutral-700 bg-transparent border-none p-0 focus:ring-0 cursor-pointer hover:bg-neutral-50 px-1 py-0.5 rounded"
                                                    >
                                                        <option value="string">String</option>
                                                        <option value="number">Number</option>
                                                        <option value="boolean">Boolean</option>
                                                        <option value="array">Array</option>
                                                        <option value="object">Object</option>
                                                    </select>
                                                </div>
                                                <div className="col-span-2 lg:col-span-2">
                                                    <label className="text-[10px] uppercase font-bold text-muted-foreground mb-1 block">Description</label>
                                                    <input
                                                        type="text"
                                                        value={arg.description || ''}
                                                        onChange={(e) => handleUpdateArg(idx, 'description', e.target.value)}
                                                        placeholder="Description"
                                                        className="w-full text-xs text-muted-foreground border-b border-transparent hover:border-neutral-200 focus:border-neutral-900 focus:outline-none bg-transparent px-1 py-0.5"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 ml-4">
                                                <label className="flex items-center gap-1.5 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={arg.required}
                                                        onChange={(e) => handleUpdateArg(idx, 'required', e.target.checked)}
                                                        className="w-3.5 h-3.5 rounded border-border text-neutral-900 focus:ring-neutral-900 cursor-pointer"
                                                    />
                                                    <span className="text-[10px] uppercase font-bold text-neutral-600">Required</span>
                                                </label>
                                                <button
                                                    onClick={() => handleRemoveArg(idx)}
                                                    className="text-muted-foreground hover:text-red-600 transition-colors p-1"
                                                    title="Remove argument"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Add Argument Form */}
                        <div className="mt-6 p-4 border border-border bg-neutral-50 rounded-lg">
                            <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-3">Add New Argument</h4>
                            <form onSubmit={handleAddArg} className="grid gap-4 md:grid-cols-2">
                                <Input
                                    label="Argument Name"
                                    placeholder="e.g. city"
                                    value={newArgName}
                                    onChange={(e) => setNewArgName(e.target.value)}
                                />
                                <div className="space-y-1.5">
                                    <label className="text-sm font-medium text-neutral-700">Type</label>
                                    <select
                                        value={newArgType}
                                        onChange={(e) => setNewArgType(e.target.value)}
                                        className="w-full px-3 py-2 text-sm text-neutral-900 bg-white border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:ring-offset-0 focus:border-transparent"
                                    >
                                        <option value="string">String</option>
                                        <option value="number">Number</option>
                                        <option value="boolean">Boolean</option>
                                        <option value="array">Array</option>
                                        <option value="object">Object</option>
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <Input
                                        label="Description (optional)"
                                        placeholder="e.g. The name of the city to get weather for"
                                        value={newArgDesc}
                                        onChange={(e) => setNewArgDesc(e.target.value)}
                                    />
                                </div>
                                <div className="md:col-span-2 flex items-center mt-1">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={newArgRequired}
                                            onChange={(e) => setNewArgRequired(e.target.checked)}
                                            className="w-4 h-4 rounded border-border text-neutral-900 focus:ring-neutral-900 cursor-pointer"
                                        />
                                        <span className="text-sm text-neutral-700 font-medium">This argument is required</span>
                                    </label>
                                </div>
                                <div className="md:col-span-2 flex justify-end mt-2">
                                    <Button type="submit" disabled={!newArgName.trim()}>
                                        Add Argument
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
