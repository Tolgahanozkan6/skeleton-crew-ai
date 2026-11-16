import test from 'node:test';
import assert from 'node:assert/strict';
import { runCrew } from '../src/crew.js';
test('returns are routed and held for human review', () => {
  const result = runCrew('Please refund my order');
  assert.equal(result.triage.category, 'returns');
  assert.equal(result.status, 'awaiting_human_review');
  assert.equal(result.mode, 'offline-demo');
});
test('general requests use general triage', () => {
  assert.equal(runCrew('What are your opening hours?').triage.category, 'general');
});
test('invalid requests are rejected', () => {
  for (const value of ['', '   ', null, 42]) assert.throws(() => runCrew(value), TypeError);
});
