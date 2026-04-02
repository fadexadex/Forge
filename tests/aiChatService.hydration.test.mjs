import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { __test } from '../src/utils/aiChatService.js';

describe('aiChatService generic helpers', () => {
  test('extractToolData prefers structured content', () => {
    const result = __test.extractToolData({
      content: [{ type: 'text', text: 'fallback' }],
      structuredContent: { status: 'ok', value: 42 },
    });

    assert.deepEqual(result, { status: 'ok', value: 42 });
  });

  test('extractToolData parses JSON text content when structured content is absent', () => {
    const result = __test.extractToolData({
      content: [{ type: 'text', text: '{"value":42}' }],
    });

    assert.deepEqual(result, { value: 42 });
  });

  test('normalizeSchema coerces non-object schemas into object schemas', () => {
    const schema = __test.normalizeSchema({ type: 'string' });

    assert.equal(schema.type, 'object');
    assert.deepEqual(schema.properties, {});
  });
});
