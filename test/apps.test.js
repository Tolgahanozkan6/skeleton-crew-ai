import test from 'node:test';
import assert from 'node:assert/strict';
import { runSupport } from '../apps/support-desk/workflow.js';
import { runPlanner } from '../apps/job-planner/workflow.js';
import { runWorkflow } from '../src/runtime.js';

test('support routes refunds through named specialist steps', () => {
  const result = runSupport('Refund my order');
  assert.equal(result.outputs.triage.category, 'returns');
  assert.deepEqual(result.trace.map(x => x.agent), ['triage', 'reply', 'operations']);
  assert.equal(result.status, 'awaiting_human_review');
});
test('planner produces scope and holds bookings and quotes for review', () => {
  const result = runPlanner('Repair our broken shop door');
  assert.equal(result.outputs.scope.service, 'repair-assessment');
  assert.equal(result.outputs.planner.bookingConfirmed, false);
  assert.equal(result.outputs.clarification.quote, null);
  assert.equal(result.mode, 'offline-demo');
  assert.equal(result.status, 'awaiting_human_review');
  assert.equal(runPlanner('Assess our new office').outputs.scope.service, 'general-assessment');
});
test('both apps reject empty and non-string input before execution', () => {
  for (const run of [runSupport, runPlanner]) {
    for (const value of ['', ' ', null, 42]) assert.throws(() => run(value), TypeError);
  }
});
test('shared runtime stops after specialist failure and returns failed state', () => {
  let called = false;
  const result = runWorkflow('request', [
    { name: 'broken', run: () => { throw new Error('step failed'); } },
    { name: 'later', run: () => { called = true; } },
  ]);
  assert.equal(result.status, 'failed');
  assert.equal(result.failedStep, 'broken');
  assert.match(result.error, /step failed/);
  assert.deepEqual(result.outputs, {});
  assert.equal(result.trace.at(-1).status, 'failed');
  assert.equal(called, false);
});
