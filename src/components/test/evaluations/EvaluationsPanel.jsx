/* eslint-disable react/prop-types */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTestStore } from '../../../stores/testStore';
import { useSettingsStore } from '../../../stores/settingsStore';
import { useEvaluationStore } from '../../../stores/evaluationStore';
import { Button } from '../../ui/Button';
import { TestEmptyState } from '../TestEmptyState';
import {
  createTransportAdapter,
  getAssistantMessageText,
  getWidgetResourceUri,
  useMcpChatRuntime,
} from '../mcp-apps/useMcpChatRuntime.js';
import { createTrajectoryTransportProxy } from '../../../utils/evaluation/trajectoryTransportProxy.js';
import { createTraceRecorder } from '../../../utils/evaluation/createTraceRecorder.js';
import { scoreTrajectory } from '../../../utils/evaluation/scoreTrajectory.js';
import { judgeOutput } from '../../../utils/evaluation/judgeOutput.js';
import {
  formatDateTime,
  formatDuration,
  stableStringify,
} from '../../../utils/evaluation/helpers.js';
import { EvaluationTraceWorkspace } from './EvaluationTraceWorkspace.jsx';

const MODEL_PRESET = {
  provider: 'google',
  modelId: 'gemini-2.5-flash',
};

const ClipboardIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
  </svg>
);

function prettyJson(value) {
  if (value == null) return '{}';
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return '{}';
  }
}

function parseArgsJson(value) {
  if (!value.trim()) return {};
  return JSON.parse(value);
}

function findLatestAssistantResponse(messages = []) {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message.role !== 'assistant') continue;
    const text = getAssistantMessageText(message);
    if (text) return text;
  }
  return '';
}

function findLatestError(messages = [], spans = []) {
  const traceError = [...spans].reverse().find((span) => span.kind === 'error');
  if (traceError?.payload?.output) {
    return String(traceError.payload.output);
  }

  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message.role !== 'assistant') continue;
    const errorPart = (message.parts || []).find((part) => part.type === 'error' && part.text);
    if (errorPart?.text) {
      return errorPart.text.replace(/^Error:\s*/i, '');
    }
  }

  return null;
}

function mergeToolTelemetry(actualToolCalls, transportEvents) {
  const unmatched = [...transportEvents];

  return actualToolCalls.map((call) => {
    const eventIndex = unmatched.findIndex((event) => (
      event.toolName === call.toolName &&
      stableStringify(event.args || {}) === stableStringify(call.args || {})
    ));

    if (eventIndex < 0) {
      return call;
    }

    const [event] = unmatched.splice(eventIndex, 1);
    return {
      ...call,
      startedAt: call.startedAt || event.startedAt,
      endedAt: call.endedAt || event.endedAt,
      durationMs: call.durationMs ?? event.durationMs,
      widgetResourceUri: call.widgetResourceUri || event.widgetResourceUri || null,
    };
  });
}

function extractActualToolCalls(messages = [], trace = [], tools = [], transportEvents = []) {
  const calls = [];

  for (const message of messages) {
    if (message.role !== 'assistant') continue;

    for (const part of message.parts || []) {
      if (part.type !== 'tool' || !part.toolCall?.callId) continue;

      const span = trace.find((entry) => (
        entry.kind === 'tool_call' && entry.toolCallId === part.toolCall.callId
      ));
      const toolDef = tools.find((tool) => tool.name === part.toolCall.toolName);

      calls.push({
        callId: part.toolCall.callId,
        toolName: part.toolCall.toolName,
        args: part.toolCall.args || {},
        result: part.toolCall.result,
        status: part.toolCall.status === 'failed' ? 'failed' : 'completed',
        startedAt: span?.startedAt,
        endedAt: span?.endedAt,
        durationMs: span?.durationMs,
        widgetResourceUri: getWidgetResourceUri(
          part.toolCall.result,
          toolDef,
          true
        ),
      });
    }
  }

  return mergeToolTelemetry(calls, transportEvents);
}

function stepHasBuilderTool(toolName, tools) {
  return tools.some((tool) => tool.name === toolName);
}

function ScenarioSection({ label, children, className = '' }) {
  return (
    <section className={`rounded-xl border border-neutral-200 bg-white ${className}`}>
      <div className="border-b border-neutral-200 px-4 py-3">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
          {label}
        </div>
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

export function EvaluationsPanel() {
  const {
    tools,
    serverInfo,
    client,
    testMode,
    selectTool,
    setSelectedPrimitiveType,
  } = useTestStore();
  const { geminiApiKey } = useSettingsStore();
  const {
    currentScopeKey,
    scenariosByScope,
    runsByScenario,
    generationByScope,
    selectedScenarioIdByScope,
    selectScenario,
    createScenario,
    updateScenario,
    duplicateScenario,
    addExpectedToolCall,
    removeExpectedToolCall,
    startRun,
    finishRun,
    clearScenarioRuns,
    replaceScenarioWithActualPath,
  } = useEvaluationStore();

  const [selectedRunId, setSelectedRunId] = useState(null);
  const [argsDrafts, setArgsDrafts] = useState({});
  const [argErrors, setArgErrors] = useState({});
  const traceRecorderRef = useRef(createTraceRecorder());
  const transportEventsRef = useRef([]);
  const activeRunRef = useRef(null);
  const finalizingRunRef = useRef(false);

  const scenarios = currentScopeKey ? (scenariosByScope[currentScopeKey] || []) : [];
  const selectedScenarioId = currentScopeKey ? selectedScenarioIdByScope[currentScopeKey] : null;
  const selectedScenario = scenarios.find((scenario) => scenario.id === selectedScenarioId) || null;
  const runs = selectedScenario ? (runsByScenario[selectedScenario.id] || []) : [];
  const generationState = currentScopeKey ? generationByScope[currentScopeKey] : null;

  useEffect(() => {
    if (!selectedScenario && scenarios.length > 0) {
      selectScenario(scenarios[0].id);
    }
  }, [scenarios, selectedScenario, selectScenario]);

  useEffect(() => {
    setSelectedRunId(runs[0]?.id || null);
  }, [selectedScenario?.id, runs]);

  useEffect(() => {
    if (!selectedScenario) {
      setArgsDrafts({});
      setArgErrors({});
      return;
    }

    setArgsDrafts(
      selectedScenario.expectedToolCalls.reduce((acc, call) => {
        acc[call.id] = prettyJson(call.expectedArgs || {});
        return acc;
      }, {})
    );
    setArgErrors({});
  }, [selectedScenario]);

  const selectedRun = runs.find((run) => run.id === selectedRunId) || runs[0] || null;
  const transportBase = useMemo(
    () => createTransportAdapter(testMode, client, tools),
    [testMode, client, tools]
  );
  const transportOverride = useMemo(() => {
    if (!transportBase) return null;

    return createTrajectoryTransportProxy(transportBase, {
      onToolCallResult: (event) => {
        transportEventsRef.current = [...transportEventsRef.current, event];
      },
    });
  }, [transportBase]);

  const {
    messages,
    isStreaming,
    sessionsById,
    sendMessage,
    clearConversation,
    registerWidget,
    unregisterWidget,
    lastUsage,
  } = useMcpChatRuntime({
    tools,
    serverInfo,
    client,
    geminiApiKey,
    testMode,
    transportOverride,
    traceRecorder: traceRecorderRef.current,
    modelPreset: MODEL_PRESET,
  });

  useEffect(() => {
    if (!activeRunRef.current || isStreaming || finalizingRunRef.current === true) {
      return;
    }
    if (messages.length === 0 && transportEventsRef.current.length === 0 && !lastUsage) {
      return;
    }

    const activeRun = activeRunRef.current;
    finalizingRunRef.current = true;

    void (async () => {
      const trace = traceRecorderRef.current.getSpans();
      const actualToolCalls = extractActualToolCalls(
        messages,
        trace,
        tools,
        transportEventsRef.current
      );
      const trajectory = scoreTrajectory(activeRun.scenario, actualToolCalls);
      const assistantResponse = findLatestAssistantResponse(messages);

      traceRecorderRef.current.startJudge({
        scenarioText: activeRun.scenario.scenarioText,
        userPrompt: activeRun.scenario.userPrompt,
        expectedOutput: activeRun.scenario.expectedOutput,
      });

      const outputEvaluation = await judgeOutput({
        scenarioText: activeRun.scenario.scenarioText,
        userPrompt: activeRun.scenario.userPrompt,
        expectedOutput: activeRun.scenario.expectedOutput,
        assistantResponse,
        actualToolCalls,
        apiKey: geminiApiKey,
      });

      traceRecorderRef.current.finishJudge(
        outputEvaluation,
        outputEvaluation.passed ? 'completed' : 'failed'
      );

      const latestError = findLatestError(messages, traceRecorderRef.current.getSpans());
      const passed = trajectory.passed && outputEvaluation.score >= (
        activeRun.scenario.passCriteria?.minOutputScore ?? 0.7
      );
      const endedAt = new Date().toISOString();

      finishRun(activeRun.scenarioId, activeRun.runId, {
        status: latestError ? 'failed' : 'completed',
        result: passed ? 'passed' : 'failed',
        endedAt,
        durationMs: new Date(endedAt).getTime() - new Date(activeRun.startedAt).getTime(),
        usage: lastUsage || {
          inputTokens: undefined,
          outputTokens: undefined,
          totalTokens: undefined,
        },
        transcript: messages,
        actualToolCalls,
        trace: traceRecorderRef.current.getSpans(),
        trajectory,
        outputEvaluation,
        latestError,
      });

      activeRunRef.current = null;
      transportEventsRef.current = [];
      finalizingRunRef.current = false;
    })();
  }, [finishRun, geminiApiKey, isStreaming, lastUsage, messages, tools]);

  const handleRun = async () => {
    if (!selectedScenario || !selectedScenario.userPrompt.trim()) {
      return;
    }

    const run = startRun(selectedScenario.id, MODEL_PRESET);
    if (!run) return;

    setSelectedRunId(run.id);
    activeRunRef.current = {
      runId: run.id,
      scenarioId: selectedScenario.id,
      scenario: JSON.parse(JSON.stringify(selectedScenario)),
      startedAt: run.startedAt,
    };
    finalizingRunRef.current = false;
    transportEventsRef.current = [];
    traceRecorderRef.current.reset();
    traceRecorderRef.current.startPrompt(selectedScenario.userPrompt);
    clearConversation();

    const submitted = await sendMessage(selectedScenario.userPrompt);
    if (!submitted) {
      const latestError = geminiApiKey
        ? 'Unable to start the evaluation run.'
        : 'Configure a Gemini API key in Settings to run evaluations.';

      finishRun(selectedScenario.id, run.id, {
        status: 'failed',
        result: 'failed',
        endedAt: new Date().toISOString(),
        durationMs: 0,
        latestError,
      });
      activeRunRef.current = null;
    }
  };

  const handleOpenToolInBuilder = (toolName) => {
    if (!toolName || !stepHasBuilderTool(toolName, tools)) return;
    selectTool(toolName);
    setSelectedPrimitiveType('tools');
  };

  if (!currentScopeKey) {
    return (
      <div className="flex-1 bg-white">
        <TestEmptyState
          icon={<ClipboardIcon />}
          heading="Connect a server to evaluate it"
          subtitle="Evaluations are scoped to the current connected server or builder preview."
        />
      </div>
    );
  }

  if (!selectedScenario) {
    return (
      <div className="flex-1 bg-white">
        <TestEmptyState
          icon={<ClipboardIcon />}
          heading="No evaluation selected"
          subtitle={
            generationState?.status === 'generating'
              ? 'Forge is generating scenarios in the background. Open one when it appears.'
              : 'Create a scenario from the sidebar or wait for generated scenarios to arrive.'
          }
        />
      </div>
    );
  }

  const isFreshGenerated = (
    selectedScenario.source === 'generated' &&
    generationState?.batchId &&
    generationState.batchId === selectedScenario.generationBatchId
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[#FAFAFA]">
      <div className="border-b border-neutral-200 bg-white px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <input
                value={selectedScenario.title}
                onChange={(event) => updateScenario(selectedScenario.id, { title: event.target.value })}
                className="min-w-[280px] border-none bg-transparent p-0 text-lg font-semibold tracking-tight text-neutral-900 outline-none"
              />

              {selectedScenario.tags.map((tag, index) => (
                <span
                  key={`${selectedScenario.id}-${tag}-${index}`}
                  className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                    tag === 'NEG'
                      ? 'border-amber-200 bg-amber-50 text-amber-700'
                      : 'border-neutral-200 bg-neutral-50 text-neutral-600'
                  }`}
                >
                  {tag}
                </span>
              ))}

              {isFreshGenerated ? (
                <span className="rounded-full border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-[10px] font-semibold text-neutral-600">
                  Freshly generated
                </span>
              ) : null}
            </div>

            <div className="mt-1 text-[12px] text-neutral-500">
              Last updated {formatDateTime(selectedScenario.updatedAt)}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              data-testid="evaluation-model-selector"
              value={MODEL_PRESET.modelId}
              onChange={() => {}}
              className="h-9 rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-700 outline-none"
            >
              <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
            </select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => duplicateScenario(selectedScenario.id)}
            >
              Duplicate
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => createScenario()}
            >
              New Scenario
            </Button>
            <Button
              size="sm"
              onClick={handleRun}
              data-testid="evaluation-run-button"
              disabled={!geminiApiKey || isStreaming || !selectedScenario.userPrompt.trim()}
            >
              {isStreaming ? 'Running...' : 'Run'}
            </Button>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
        {!geminiApiKey ? (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Configure API key to auto-generate evaluations and run this scenario.
          </div>
        ) : null}

        <div className="space-y-4">
          <ScenarioSection label="Scenario">
            <textarea
              value={selectedScenario.scenarioText}
              onChange={(event) => updateScenario(selectedScenario.id, { scenarioText: event.target.value })}
              className="min-h-[84px] w-full resize-y rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-800 outline-none focus:border-neutral-300"
            />

            {selectedScenario.source === 'generated' ? (
              <div className="mt-3">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 px-2 text-xs"
                  onClick={() => updateScenario(selectedScenario.id, { source: 'user' })}
                >
                  Convert to user scenario
                </Button>
              </div>
            ) : null}
          </ScenarioSection>

          <ScenarioSection label="User Prompt">
            <textarea
              value={selectedScenario.userPrompt}
              onChange={(event) => updateScenario(selectedScenario.id, { userPrompt: event.target.value })}
              className="min-h-[96px] w-full resize-y rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-800 outline-none focus:border-neutral-300"
            />
          </ScenarioSection>

          <ScenarioSection label="Expected Tool Path">
            {selectedScenario.mode === 'negative' ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-800">
                Expected tool calls: none
              </div>
            ) : (
              <div className="space-y-3">
                {selectedScenario.expectedToolCalls.map((call, index) => (
                  <div key={call.id} className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <div className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                        Step {index + 1}
                      </div>
                      <div className="flex items-center gap-2">
                        {testMode === 'builder' && stepHasBuilderTool(call.toolName, tools) ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 px-2 text-xs"
                            onClick={() => handleOpenToolInBuilder(call.toolName)}
                          >
                            Open Tool in Builder
                          </Button>
                        ) : null}
                        {tools.find((tool) => tool.name === call.toolName)?._meta?.ui?.resourceUri ? (
                          <span className="rounded-full border border-neutral-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-neutral-600">
                            Widget
                          </span>
                        ) : null}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 px-2 text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
                          onClick={() => removeExpectedToolCall(selectedScenario.id, call.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px]">
                      <div>
                        <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                          Tool
                        </div>
                        <input
                          list={`evaluation-tools-${selectedScenario.id}`}
                          value={call.toolName}
                          onChange={(event) => {
                            const nextCalls = selectedScenario.expectedToolCalls.map((entry) => (
                              entry.id === call.id
                                ? { ...entry, toolName: event.target.value }
                                : entry
                            ));
                            updateScenario(selectedScenario.id, { expectedToolCalls: nextCalls });
                          }}
                          className="h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm text-neutral-800 outline-none focus:border-neutral-300"
                        />
                      </div>

                      <div>
                        <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                          Match mode
                        </div>
                        <select
                          value={call.argMatchMode}
                          onChange={(event) => {
                            const nextCalls = selectedScenario.expectedToolCalls.map((entry) => (
                              entry.id === call.id
                                ? { ...entry, argMatchMode: event.target.value }
                                : entry
                            ));
                            updateScenario(selectedScenario.id, { expectedToolCalls: nextCalls });
                          }}
                          className="h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm text-neutral-800 outline-none focus:border-neutral-300"
                        >
                          <option value="exact">Exact</option>
                          <option value="subset">Subset</option>
                          <option value="keys-only">Keys only</option>
                        </select>
                      </div>
                    </div>

                    <div className="mt-3">
                      <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                        Expected arguments
                      </div>
                      <textarea
                        value={argsDrafts[call.id] ?? prettyJson(call.expectedArgs)}
                        onChange={(event) => {
                          setArgsDrafts((prev) => ({ ...prev, [call.id]: event.target.value }));
                          setArgErrors((prev) => ({ ...prev, [call.id]: null }));
                        }}
                        onBlur={() => {
                          try {
                            const parsed = parseArgsJson(argsDrafts[call.id] ?? prettyJson(call.expectedArgs));
                            const nextCalls = selectedScenario.expectedToolCalls.map((entry) => (
                              entry.id === call.id
                                ? { ...entry, expectedArgs: parsed }
                                : entry
                            ));
                            updateScenario(selectedScenario.id, { expectedToolCalls: nextCalls });
                            setArgErrors((prev) => ({ ...prev, [call.id]: null }));
                          } catch (error) {
                            setArgErrors((prev) => ({ ...prev, [call.id]: error.message }));
                          }
                        }}
                        className={`min-h-[120px] w-full resize-y rounded-lg border bg-white px-3 py-2 font-mono text-[12px] text-neutral-800 outline-none ${
                          argErrors[call.id] ? 'border-red-300' : 'border-neutral-200 focus:border-neutral-300'
                        }`}
                      />
                      {argErrors[call.id] ? (
                        <div className="mt-2 text-xs text-red-600">{argErrors[call.id]}</div>
                      ) : null}
                    </div>
                  </div>
                ))}

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => addExpectedToolCall(selectedScenario.id, tools[0]?.name || '')}
                >
                  Add expected tool call
                </Button>
              </div>
            )}

            <datalist id={`evaluation-tools-${selectedScenario.id}`}>
              {tools.map((tool) => (
                <option key={tool.name} value={tool.name}>
                  {tool.description}
                </option>
              ))}
            </datalist>
          </ScenarioSection>

          <ScenarioSection label="Expected Output">
            <textarea
              value={selectedScenario.expectedOutput}
              onChange={(event) => updateScenario(selectedScenario.id, { expectedOutput: event.target.value })}
              className="min-h-[96px] w-full resize-y rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-800 outline-none focus:border-neutral-300"
            />
          </ScenarioSection>

          <details className="rounded-xl border border-neutral-200 bg-white" open={false}>
            <summary className="cursor-pointer list-none px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
              Advanced pass criteria
            </summary>
            <div className="grid gap-3 border-t border-neutral-200 p-4 md:grid-cols-3">
              <label className="space-y-2 text-sm text-neutral-700">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                  Min trajectory score
                </div>
                <input
                  type="number"
                  min="0"
                  max="1"
                  step="0.05"
                  value={selectedScenario.passCriteria.minTrajectoryScore}
                  onChange={(event) => updateScenario(selectedScenario.id, {
                    passCriteria: {
                      ...selectedScenario.passCriteria,
                      minTrajectoryScore: Number(event.target.value),
                    },
                  })}
                  className="h-10 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 outline-none focus:border-neutral-300"
                />
              </label>

              <label className="space-y-2 text-sm text-neutral-700">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                  Min output score
                </div>
                <input
                  type="number"
                  min="0"
                  max="1"
                  step="0.05"
                  value={selectedScenario.passCriteria.minOutputScore}
                  onChange={(event) => updateScenario(selectedScenario.id, {
                    passCriteria: {
                      ...selectedScenario.passCriteria,
                      minOutputScore: Number(event.target.value),
                    },
                  })}
                  className="h-10 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 outline-none focus:border-neutral-300"
                />
              </label>

              <label className="flex items-end gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-3 text-sm text-neutral-700">
                <input
                  type="checkbox"
                  checked={selectedScenario.passCriteria.failOnUnexpectedTools}
                  onChange={(event) => updateScenario(selectedScenario.id, {
                    passCriteria: {
                      ...selectedScenario.passCriteria,
                      failOnUnexpectedTools: event.target.checked,
                    },
                  })}
                />
                <span>Fail on unexpected tools</span>
              </label>
            </div>
          </details>
        </div>

        {selectedRun ? (
          <EvaluationTraceWorkspace
            run={selectedRun}
            liveMessages={messages}
            liveIsStreaming={isStreaming}
            liveSessionsById={sessionsById}
            registerWidget={registerWidget}
            unregisterWidget={unregisterWidget}
            onClear={() => clearScenarioRuns(selectedScenario.id)}
            onUseActualPath={() => replaceScenarioWithActualPath(selectedScenario.id, selectedRun.id)}
            onOpenToolInBuilder={handleOpenToolInBuilder}
            testMode={testMode}
          />
        ) : null}

        {runs.length > 0 ? (
          <div className="mt-6 rounded-xl border border-neutral-200 bg-white">
            <div className="border-b border-neutral-200 px-4 py-3">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                Run history
              </div>
            </div>
            <div className="divide-y divide-neutral-100">
              {runs.map((run) => (
                <button
                  key={run.id}
                  type="button"
                  onClick={() => setSelectedRunId(run.id)}
                  className={`flex w-full flex-wrap items-center justify-between gap-3 px-4 py-3 text-left transition-colors ${
                    selectedRun?.id === run.id ? 'bg-neutral-50' : 'hover:bg-neutral-50'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-neutral-900">
                      {formatDateTime(run.startedAt)}
                    </div>
                    <div className="mt-1 text-[12px] text-neutral-500">
                      {run.actualToolCalls?.length || 0} tool calls • {formatDuration(run.durationMs)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-[12px] text-neutral-500">
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                      run.result === 'passed'
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : 'border-red-200 bg-red-50 text-red-700'
                    }`}>
                      {run.result === 'passed' ? 'Pass' : 'Fail'}
                    </span>
                    <span>{Math.round((run.trajectory?.score || 0) * 100)}%</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
