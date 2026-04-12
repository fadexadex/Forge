import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { scoreTrajectory } from '../src/utils/evaluation/scoreTrajectory.js';

describe('scoreTrajectory', () => {
  test('passes an exact positive match', () => {
    const scenario = {
      mode: 'positive',
      expectedToolCalls: [
        {
          id: 'step-1',
          toolName: 'get-sales-data',
          expectedArgs: { metric: 'revenue', year: '2024' },
          argMatchMode: 'exact',
        },
      ],
      passCriteria: {
        minTrajectoryScore: 0.75,
        failOnUnexpectedTools: true,
      },
    };

    const actual = [
      {
        callId: 'call-1',
        toolName: 'get-sales-data',
        args: { metric: 'revenue', year: '2024' },
      },
    ];

    const result = scoreTrajectory(scenario, actual);

    assert.equal(result.passed, true);
    assert.equal(result.score, 1);
    assert.deepEqual(result.matched, ['get-sales-data']);
    assert.deepEqual(result.unexpected, []);
  });

  test('flags reordered, partial, and unexpected tool usage', () => {
    const scenario = {
      mode: 'positive',
      expectedToolCalls: [
        {
          id: 'step-1',
          toolName: 'get-sales-data',
          expectedArgs: { metric: 'revenue', year: '2024' },
          argMatchMode: 'subset',
        },
        {
          id: 'step-2',
          toolName: 'visualize-sales-data',
          expectedArgs: { selections: {}, report: {} },
          argMatchMode: 'keys-only',
        },
      ],
      passCriteria: {
        minTrajectoryScore: 0.75,
        failOnUnexpectedTools: true,
      },
    };

    const actual = [
      {
        callId: 'call-1',
        toolName: 'visualize-sales-data',
        args: { report: { ok: true } },
      },
      {
        callId: 'call-2',
        toolName: 'get-sales-data',
        args: { metric: 'revenue', year: '2025' },
      },
      {
        callId: 'call-3',
        toolName: 'show-sales-pdf-report',
        args: {},
      },
    ];

    const result = scoreTrajectory(scenario, actual);

    assert.equal(result.passed, false);
    assert.deepEqual(result.reordered, ['visualize-sales-data']);
    assert.deepEqual(result.partial, ['get-sales-data']);
    assert.deepEqual(result.unexpected, ['show-sales-pdf-report']);
    assert.ok(result.score < 0.75);
  });

  test('passes a negative scenario with zero tool calls', () => {
    const scenario = {
      mode: 'negative',
      expectedToolCalls: [],
      passCriteria: {
        minTrajectoryScore: 0.75,
        failOnUnexpectedTools: true,
      },
    };

    const result = scoreTrajectory(scenario, []);

    assert.equal(result.passed, true);
    assert.equal(result.score, 1);
    assert.deepEqual(result.unexpected, []);
  });

  test('fails a negative scenario when any tool is called', () => {
    const scenario = {
      mode: 'negative',
      expectedToolCalls: [],
      passCriteria: {
        minTrajectoryScore: 0.75,
        failOnUnexpectedTools: true,
      },
    };

    const result = scoreTrajectory(scenario, [
      {
        callId: 'call-1',
        toolName: 'get-sales-data',
        args: {},
      },
    ]);

    assert.equal(result.passed, false);
    assert.equal(result.score, 0);
    assert.deepEqual(result.unexpected, ['get-sales-data']);
  });
});
