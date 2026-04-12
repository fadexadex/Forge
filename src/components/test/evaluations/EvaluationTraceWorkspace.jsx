/* eslint-disable react/prop-types */
import { useEffect, useMemo, useState } from 'react';
import { RuntimeConversation } from '../RuntimeConversation.jsx';
import { ToolCallCard } from '../ToolCallCard.jsx';
import { Button } from '../../ui/Button';
import { formatDateTime, formatDuration } from '../../../utils/evaluation/helpers.js';

function prettyJson(value) {
  if (value == null) return '—';
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function tabButtonClasses(active) {
  return active
    ? 'border-neutral-900 bg-white text-neutral-900 shadow-sm'
    : 'border-transparent bg-transparent text-neutral-500 hover:text-neutral-900';
}

function statusClasses(status) {
  switch (status) {
    case 'passed':
    case 'completed':
    case 'matched':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    case 'running':
      return 'border-blue-200 bg-blue-50 text-blue-700';
    case 'partial':
    case 'reordered':
      return 'border-amber-200 bg-amber-50 text-amber-700';
    case 'failed':
    case 'unexpected':
    case 'distractor':
      return 'border-red-200 bg-red-50 text-red-700';
    default:
      return 'border-neutral-200 bg-neutral-50 text-neutral-600';
  }
}

function getSpanStatus(run, span) {
  if (span.kind !== 'tool_call') return null;
  const actualStatus = run.trajectory?.actualStepStatuses?.find(
    (entry) => entry.id === span.toolCallId
  );
  return actualStatus?.status || null;
}

function TimelineView({
  run,
  selectedSpanId,
  setSelectedSpanId,
  zoomLevel,
  onZoomChange,
  onRevealInChat,
  onOpenToolInBuilder,
  testMode,
}) {
  const spans = run.trace || [];
  const [expanded, setExpanded] = useState(false);
  const [filter, setFilter] = useState('All');

  const visibleSpans = useMemo(() => {
    if (filter === 'All') return spans;
    return spans.filter((span) => span.kind === filter);
  }, [filter, spans]);

  const startTime = visibleSpans.length > 0
    ? Math.min(...visibleSpans.map((span) => new Date(span.startedAt).getTime()))
    : 0;
  const endTime = visibleSpans.length > 0
    ? Math.max(...visibleSpans.map((span) => new Date(span.endedAt || span.startedAt).getTime()))
    : startTime;
  const totalDuration = Math.max(1, endTime - startTime);

  const selectedSpan = visibleSpans.find((span) => span.id === selectedSpanId) || visibleSpans[0] || null;
  const selectedSpanStatus = selectedSpan ? getSpanStatus(run, selectedSpan) : null;

  return (
    <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)] gap-4">
      <div className="flex min-h-0 flex-col rounded-xl border border-neutral-200 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-200 px-4 py-3">
          <div className="flex items-center gap-2">
            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              className="h-8 rounded-md border border-neutral-200 bg-white px-2 text-xs text-neutral-700 outline-none"
            >
              <option value="All">All</option>
              <option value="tool_call">Tool calls</option>
              <option value="assistant">Assistant</option>
              <option value="resource_read">Resources</option>
              <option value="judge">Judge</option>
              <option value="error">Errors</option>
            </select>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 px-2 text-xs"
              onClick={() => setExpanded((value) => !value)}
            >
              {expanded ? 'Collapse' : 'Expand'} all
            </Button>
          </div>

          <div className="flex items-center gap-1">
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => onZoomChange(-0.2)}>
              −
            </Button>
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => onZoomChange(0.2)}>
              +
            </Button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
          <div className="space-y-2">
            {visibleSpans.map((span) => {
              const spanStart = new Date(span.startedAt).getTime();
              const spanEnd = new Date(span.endedAt || span.startedAt).getTime();
              const offset = ((spanStart - startTime) / totalDuration) * 100;
              const width = Math.max(2, ((spanEnd - spanStart) / totalDuration) * 100 * (1 + zoomLevel));
              const traceStatus = getSpanStatus(run, span) || span.status;

              return (
                <button
                  key={span.id}
                  type="button"
                  onClick={() => setSelectedSpanId(span.id)}
                  data-testid={selectedSpanId === span.id ? 'evaluation-selected-trace-row' : undefined}
                  className={`w-full rounded-lg border px-3 py-3 text-left transition-colors ${
                    selectedSpanId === span.id
                      ? 'border-neutral-300 bg-neutral-50'
                      : 'border-neutral-200 bg-white hover:border-neutral-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-neutral-900">{span.label}</div>
                      <div className="mt-1 text-[11px] text-neutral-500">
                        {span.kind.replace('_', ' ')} • {formatDuration(span.durationMs)}
                      </div>
                    </div>
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusClasses(traceStatus)}`}>
                      {traceStatus || 'idle'}
                    </span>
                  </div>

                  <div className="mt-3 h-7 rounded-md bg-neutral-100 px-2 py-1">
                    <div className="relative h-full">
                      <div
                        className="absolute top-0 h-full rounded bg-neutral-900/80"
                        style={{ left: `${offset}%`, width: `${Math.min(width, 100 - offset)}%` }}
                      />
                    </div>
                  </div>

                  {expanded && span.payload ? (
                    <div className="mt-3 rounded-md border border-neutral-200 bg-neutral-50 p-3 text-[11px] text-neutral-600">
                      <pre className="overflow-x-auto whitespace-pre-wrap">{prettyJson(span.payload)}</pre>
                    </div>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="min-h-0 rounded-xl border border-neutral-200 bg-white">
        {selectedSpan ? (
          <div className="flex h-full flex-col">
            <div className="border-b border-neutral-200 px-4 py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-neutral-900">{selectedSpan.label}</div>
                  <div className="mt-1 text-[12px] text-neutral-500">
                    {formatDuration(selectedSpan.durationMs)} • {formatDateTime(selectedSpan.startedAt)}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 px-2 text-xs"
                    data-testid="evaluation-reveal-in-chat"
                    onClick={onRevealInChat}
                  >
                    Reveal in Chat
                  </Button>
                  {selectedSpan.toolCallId && testMode === 'builder' ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 px-2 text-xs"
                      onClick={() => onOpenToolInBuilder?.(
                        run.actualToolCalls.find((call) => call.callId === selectedSpan.toolCallId)?.toolName
                      )}
                    >
                      Open Tool in Builder
                    </Button>
                  ) : null}
                </div>
              </div>

              {selectedSpanStatus ? (
                <div className="mt-3">
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusClasses(selectedSpanStatus)}`}>
                    {selectedSpanStatus}
                  </span>
                </div>
              ) : null}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto space-y-4 p-4">
              <div>
                <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                  Input
                </div>
                <pre className="overflow-x-auto rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-[12px] text-neutral-700">
                  {prettyJson(selectedSpan.payload?.input)}
                </pre>
              </div>

              <div>
                <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                  Output
                </div>
                <pre className="overflow-x-auto rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-[12px] text-neutral-700">
                  {prettyJson(selectedSpan.payload?.output)}
                </pre>
              </div>

              <div>
                <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                  Raw payload
                </div>
                <pre className="overflow-x-auto rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-[12px] text-neutral-700">
                  {prettyJson(selectedSpan.payload?.raw || selectedSpan.payload)}
                </pre>
              </div>

              {run.actualToolCalls.find((call) => call.callId === selectedSpan.toolCallId)?.widgetResourceUri ? (
                <div>
                  <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                    Widget resource
                  </div>
                  <div className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-[12px] text-neutral-700">
                    {run.actualToolCalls.find((call) => call.callId === selectedSpan.toolCallId)?.widgetResourceUri}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-neutral-500">
            Select a trace row to inspect the payloads.
          </div>
        )}
      </div>
    </div>
  );
}

function HistoricalChat({ run }) {
  const widgetCalls = (run.actualToolCalls || []).filter((call) => call.widgetResourceUri);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <RuntimeConversation
        messages={run.transcript || []}
        isStreaming={false}
        sessionsById={{}}
        registerWidget={() => {}}
        unregisterWidget={() => {}}
        emptyTitle="No chat transcript"
        emptyBody="Run this scenario to capture a replayable assistant transcript."
      />

      {widgetCalls.length > 0 ? (
        <div className="border-t border-neutral-200 px-6 py-4">
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
            Widget metadata
          </div>
          <div className="space-y-2">
            {widgetCalls.map((call) => (
              <div
                key={`${call.callId}-widget`}
                className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-[12px] text-neutral-700"
              >
                <span className="font-medium">{call.toolName}</span> rendered{' '}
                <span className="font-mono text-[11px]">{call.widgetResourceUri}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ToolsView({ run, onOpenToolInBuilder, testMode }) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto space-y-3 p-4">
      {(run.actualToolCalls || []).length === 0 ? (
        <div className="rounded-lg border border-dashed border-neutral-200 bg-white px-4 py-8 text-center text-sm text-neutral-500">
          No tool calls were recorded for this run.
        </div>
      ) : (
        run.actualToolCalls.map((call) => {
          const actualStatus = run.trajectory?.actualStepStatuses?.find((entry) => entry.id === call.callId);
          const expectedStatus = actualStatus?.status || (call.status === 'failed' ? 'failed' : 'unexpected');
          const expectedStep = run.scenarioSnapshot?.expectedToolCalls?.find(
            (step) => step.id === actualStatus?.expectedStepId || step.toolName === call.toolName
          );

          return (
            <div key={call.callId} className="rounded-xl border border-neutral-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-neutral-900">{call.toolName}</div>
                  <div className="mt-1 text-[12px] text-neutral-500">
                    {formatDuration(call.durationMs)} • {formatDateTime(call.startedAt)}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusClasses(expectedStatus)}`}>
                    {expectedStatus}
                  </span>
                  {call.widgetResourceUri ? (
                    <span className="rounded-full border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-[10px] font-semibold text-neutral-600">
                      Widget
                    </span>
                  ) : null}
                  {testMode === 'builder' ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 px-2 text-xs"
                      onClick={() => onOpenToolInBuilder?.(call.toolName)}
                    >
                      Open Tool in Builder
                    </Button>
                  ) : null}
                </div>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div>
                  <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                    Expected args
                  </div>
                  <pre className="overflow-x-auto rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-[12px] text-neutral-700">
                    {prettyJson(expectedStep?.expectedArgs || {})}
                  </pre>
                </div>
                <div>
                  <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                    Actual args
                  </div>
                  <pre className="overflow-x-auto rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-[12px] text-neutral-700">
                    {prettyJson(call.args)}
                  </pre>
                </div>
              </div>

              <div className="mt-3">
                <ToolCallCard
                  toolCall={{
                    callId: call.callId,
                    toolName: call.toolName,
                    args: call.args,
                    result: call.result,
                    status: call.status,
                    summary: expectedStatus,
                  }}
                />
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

export function EvaluationTraceWorkspace({
  run,
  liveMessages,
  liveIsStreaming,
  liveSessionsById,
  registerWidget,
  unregisterWidget,
  onClear,
  onUseActualPath,
  onOpenToolInBuilder,
  testMode,
}) {
  const [activeTab, setActiveTab] = useState('timeline');
  const [selectedSpanId, setSelectedSpanId] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(0);

  useEffect(() => {
    setSelectedSpanId(run?.trace?.[0]?.id || null);
  }, [run?.id, run?.trace]);

  if (!run) {
    return null;
  }

  const displayMessages = run.status === 'running' ? liveMessages : run.transcript;
  const displayStreaming = run.status === 'running' ? liveIsStreaming : false;
  const displaySessions = run.status === 'running' ? liveSessionsById : {};
  const totalTokens = run.usage?.totalTokens;

  const summaryTitle = [
    `Started ${formatDateTime(run.startedAt)}`,
    `Ended ${formatDateTime(run.endedAt)}`,
    `Input tokens ${run.usage?.inputTokens ?? '—'}`,
    `Output tokens ${run.usage?.outputTokens ?? '—'}`,
  ].join(' • ');

  return (
    <div className="mt-6 flex min-h-0 flex-1 flex-col">
      <div
        title={summaryTitle}
        className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3"
      >
        <div className="flex flex-wrap items-center gap-2 text-[12px] text-neutral-600">
          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusClasses(run.result === 'passed' ? 'passed' : run.status === 'running' ? 'running' : 'failed')}`}>
            {run.status === 'running' ? 'Running' : run.result === 'passed' ? 'Passed' : 'Failed'}
          </span>
          <span>{run.model?.provider}/{run.model?.modelId}</span>
          <span>{run.actualToolCalls?.length || 0} tool calls</span>
          <span>{totalTokens == null ? '— tokens' : `${totalTokens} tokens`}</span>
          <span>{formatDuration(run.durationMs)}</span>
          <span
            data-testid="evaluation-trajectory-score-chip"
            className="rounded-full border border-neutral-200 bg-neutral-50 px-2 py-0.5 font-semibold text-neutral-700"
          >
            Trajectory {Math.round((run.trajectory?.score || 0) * 100)}%
          </span>
        </div>

        <div className="flex items-center gap-2">
          {(run.actualToolCalls || []).length > 0 ? (
            <Button size="sm" variant="ghost" className="h-8 px-2 text-xs" onClick={onUseActualPath}>
              Use actual path as scenario baseline
            </Button>
          ) : null}
          <Button size="sm" variant="ghost" className="h-8 px-2 text-xs" onClick={onClear}>
            Clear
          </Button>
        </div>
      </div>

      {run.latestError ? (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {run.latestError}
        </div>
      ) : null}

      <div className="mt-4 flex items-center gap-1 rounded-lg border border-neutral-200 bg-neutral-50 p-1">
        {[
          ['timeline', 'Timeline'],
          ['chat', 'Chat'],
          ['raw', 'Raw'],
          ['tools', 'Tools'],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            data-testid={`evaluation-trace-tab-${key}`}
            onClick={() => setActiveTab(key)}
            className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${tabButtonClasses(activeTab === key)}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-4 min-h-[440px] flex-1">
        {activeTab === 'timeline' ? (
          <TimelineView
            run={run}
            selectedSpanId={selectedSpanId}
            setSelectedSpanId={setSelectedSpanId}
            zoomLevel={zoomLevel}
            onZoomChange={(delta) => setZoomLevel((value) => Math.max(0, value + delta))}
            onRevealInChat={() => setActiveTab('chat')}
            onOpenToolInBuilder={onOpenToolInBuilder}
            testMode={testMode}
          />
        ) : null}

        {activeTab === 'chat' ? (
          <div className="h-full rounded-xl border border-neutral-200 bg-white">
            {run.status === 'running' ? (
              <RuntimeConversation
                messages={displayMessages || []}
                isStreaming={displayStreaming}
                sessionsById={displaySessions || {}}
                registerWidget={registerWidget}
                unregisterWidget={unregisterWidget}
                emptyTitle="Run in progress"
                emptyBody="The conversation will appear here as the evaluation runs."
              />
            ) : (
              <HistoricalChat run={{ ...run, transcript: displayMessages || [] }} />
            )}
          </div>
        ) : null}

        {activeTab === 'raw' ? (
          <div className="grid h-full gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-neutral-200 bg-white p-4">
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                Run payload
              </div>
              <pre className="h-[520px] overflow-auto rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-[12px] text-neutral-700">
                {prettyJson(run)}
              </pre>
            </div>
            <div className="rounded-xl border border-neutral-200 bg-white p-4">
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                Transcript
              </div>
              <pre className="h-[520px] overflow-auto rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-[12px] text-neutral-700">
                {prettyJson(displayMessages)}
              </pre>
            </div>
          </div>
        ) : null}

        {activeTab === 'tools' ? (
          <div className="h-full rounded-xl border border-neutral-200 bg-neutral-50">
            <ToolsView
              run={run}
              onOpenToolInBuilder={onOpenToolInBuilder}
              testMode={testMode}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
