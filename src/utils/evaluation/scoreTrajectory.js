import { clamp, compareArgs } from './helpers.js';

function uniqueNames(values = []) {
  return Array.from(new Set(values.filter(Boolean)));
}

export function scoreTrajectory(scenario, actualToolCalls = []) {
  const expectedToolCalls = scenario?.expectedToolCalls || [];
  const actualCalls = actualToolCalls || [];
  const failOnUnexpectedTools = scenario?.passCriteria?.failOnUnexpectedTools ?? true;

  if (scenario?.mode === 'negative') {
    const unexpected = actualCalls.map((call) => call.toolName);
    const score = unexpected.length === 0 ? 1 : 0;

    return {
      matched: [],
      partial: [],
      missing: [],
      unexpected,
      reordered: [],
      usedDistractorTools: uniqueNames(unexpected),
      score,
      passed: unexpected.length === 0,
      expectedStepStatuses: [],
      actualStepStatuses: actualCalls.map((call) => ({
        id: call.callId,
        toolName: call.toolName,
        status: 'unexpected',
        argsScore: 0,
      })),
    };
  }

  const usedActualIndexes = new Set();
  const expectedStepStatuses = [];
  const actualStepStatuses = actualCalls.map((call) => ({
    id: call.callId,
    toolName: call.toolName,
    status: 'unexpected',
    argsScore: 0,
  }));

  let lastActualIndex = -1;
  let matchedCount = 0;
  let partialCount = 0;
  let reorderedCount = 0;
  let argsScoreTotal = 0;
  let matchedInOrderCount = 0;

  expectedToolCalls.forEach((step) => {
    const foundIndex = actualCalls.findIndex((call, index) => (
      !usedActualIndexes.has(index) && call.toolName === step.toolName
    ));

    if (foundIndex < 0) {
      expectedStepStatuses.push({
        id: step.id,
        toolName: step.toolName,
        status: 'missing',
        argsScore: 0,
      });
      return;
    }

    usedActualIndexes.add(foundIndex);
    const actualCall = actualCalls[foundIndex];
    const argsScore = compareArgs(step.expectedArgs, actualCall.args, step.argMatchMode);
    const reordered = foundIndex < lastActualIndex;

    if (argsScore >= 1) {
      matchedCount += 1;
    } else {
      partialCount += 1;
    }

    if (reordered) {
      reorderedCount += 1;
    } else {
      matchedInOrderCount += 1;
    }

    argsScoreTotal += argsScore;
    lastActualIndex = Math.max(lastActualIndex, foundIndex);

    const status = reordered
      ? 'reordered'
      : argsScore >= 1
        ? 'matched'
        : 'partial';

    expectedStepStatuses.push({
      id: step.id,
      toolName: step.toolName,
      status,
      argsScore,
      actualCallId: actualCall.callId,
    });

    actualStepStatuses[foundIndex] = {
      id: actualCall.callId,
      toolName: actualCall.toolName,
      status,
      argsScore,
      expectedStepId: step.id,
    };
  });

  const missing = expectedStepStatuses
    .filter((step) => step.status === 'missing')
    .map((step) => step.toolName);
  const matched = expectedStepStatuses
    .filter((step) => step.status === 'matched')
    .map((step) => step.toolName);
  const partial = expectedStepStatuses
    .filter((step) => step.status === 'partial')
    .map((step) => step.toolName);
  const reordered = expectedStepStatuses
    .filter((step) => step.status === 'reordered')
    .map((step) => step.toolName);
  const unexpected = actualStepStatuses
    .filter((step) => step.status === 'unexpected')
    .map((step) => step.toolName);

  const usedExpectedCount = expectedStepStatuses.filter((step) => step.status !== 'missing').length;

  const coverage = expectedToolCalls.length === 0
    ? 1
    : usedExpectedCount / expectedToolCalls.length;
  const precision = actualCalls.length === 0
    ? (expectedToolCalls.length === 0 ? 1 : 0)
    : usedActualIndexes.size / actualCalls.length;
  const averageArgsScore = expectedToolCalls.length === 0
    ? 1
    : argsScoreTotal / expectedToolCalls.length;
  const orderScore = expectedToolCalls.length === 0
    ? 1
    : matchedInOrderCount / expectedToolCalls.length;

  const score = clamp(
    coverage * 0.4 +
      precision * 0.25 +
      averageArgsScore * 0.2 +
      orderScore * 0.15
  );

  const passed = (
    score >= (scenario?.passCriteria?.minTrajectoryScore ?? 0.75) &&
    missing.length === 0 &&
    (!failOnUnexpectedTools || unexpected.length === 0)
  );

  return {
    matched,
    partial,
    missing,
    unexpected,
    reordered,
    usedDistractorTools: uniqueNames(unexpected),
    score,
    passed,
    expectedStepStatuses,
    actualStepStatuses,
  };
}
