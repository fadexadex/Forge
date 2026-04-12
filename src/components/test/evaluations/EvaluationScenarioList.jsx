import { Button } from '../../ui/Button';
import { useEvaluationStore } from '../../../stores/evaluationStore';
import { formatDuration } from '../../../utils/evaluation/helpers.js';

function badgeClasses(kind = 'default') {
  switch (kind) {
    case 'negative':
      return 'border-amber-200 bg-amber-50 text-amber-700';
    case 'success':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    case 'error':
      return 'border-red-200 bg-red-50 text-red-700';
    default:
      return 'border-neutral-200 bg-neutral-50 text-neutral-600';
  }
}

export function EvaluationScenarioList() {
  const {
    currentScopeKey,
    scenariosByScope,
    runsByScenario,
    generationByScope,
    selectedScenarioIdByScope,
    createScenario,
    selectScenario,
  } = useEvaluationStore();

  const scenarios = currentScopeKey ? (scenariosByScope[currentScopeKey] || []) : [];
  const selectedScenarioId = currentScopeKey ? selectedScenarioIdByScope[currentScopeKey] : null;
  const generationState = currentScopeKey ? generationByScope[currentScopeKey] : null;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Scenarios
          </span>
          <span className="rounded-full bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
            {scenarios.length}
          </span>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => createScenario()}
          className="h-7 px-2 text-[11px]"
        >
          New
        </Button>
      </div>

      {generationState?.status === 'generating' ? (
        <div className="mx-4 mb-2 rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-[11px] text-neutral-600">
          Generating evaluation scenarios in the background...
        </div>
      ) : null}

      {generationState?.status === 'missing_key' ? (
        <div className="mx-4 mb-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-800">
          Configure a Gemini API key in Settings to auto-generate evaluations.
        </div>
      ) : null}

      <div
        data-testid="evaluation-scenario-list"
        className="flex-1 overflow-y-auto scrollbar-thin"
      >
        {scenarios.length === 0 ? (
          <div className="px-4 py-8 text-center text-xs text-muted-foreground">
            {generationState?.status === 'generating'
              ? 'Your scenarios will appear here when generation finishes.'
              : 'No scenarios yet for this server snapshot.'}
          </div>
        ) : (
          scenarios.map((scenario) => {
            const latestRun = runsByScenario[scenario.id]?.[0];
            const isSelected = selectedScenarioId === scenario.id;

            return (
              <button
                key={scenario.id}
                type="button"
                onClick={() => selectScenario(scenario.id)}
                data-testid={`evaluation-scenario-item-${scenario.id}`}
                className={`w-full border-b border-neutral-100 px-4 py-3 text-left transition-colors ${
                  isSelected ? 'bg-neutral-100' : 'hover:bg-neutral-50'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-neutral-900">
                      {scenario.title}
                    </div>
                    <div className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-neutral-500">
                      {scenario.scenarioText}
                    </div>
                  </div>

                  {latestRun ? (
                    <span
                      className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                        latestRun.result === 'passed'
                          ? badgeClasses('success')
                          : badgeClasses('error')
                      }`}
                    >
                      {latestRun.result === 'passed' ? 'Pass' : 'Fail'}
                    </span>
                  ) : null}
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <span
                    data-testid={scenario.mode === 'negative' ? 'evaluation-negative-badge' : undefined}
                    className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                      scenario.mode === 'negative'
                        ? badgeClasses('negative')
                        : badgeClasses('default')
                    }`}
                  >
                    {scenario.mode === 'negative' ? 'NEG' : scenario.difficulty}
                  </span>

                  {scenario.source !== 'user' ? (
                    <span
                      data-testid="evaluation-generated-badge"
                      className="rounded-full border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-[10px] font-medium text-neutral-600"
                    >
                      {scenario.source === 'generated-edited' ? 'generated-edited' : 'generated'}
                    </span>
                  ) : null}

                  {scenario.tags.slice(0, 3).map((tag) => (
                    <span
                      key={`${scenario.id}-${tag}`}
                      className="rounded-full border border-neutral-200 bg-white px-2 py-0.5 text-[10px] font-medium text-neutral-500"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {latestRun ? (
                  <div className="mt-2 flex items-center gap-3 text-[11px] text-neutral-500">
                    <span>ATS {Math.round((latestRun.trajectory?.score || 0) * 100)}%</span>
                    <span>{latestRun.actualToolCalls?.length || 0} calls</span>
                    <span>{formatDuration(latestRun.durationMs)}</span>
                  </div>
                ) : null}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
