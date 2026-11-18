import test from 'node:test';
import assert from 'node:assert/strict';
import { executeLiveRun } from '../src/live-workflow.js';
import { runSupport } from '../apps/support-desk/workflow.js';
import { runPlanner } from '../apps/job-planner/workflow.js';
import { registry } from '../apps/index.js';

for (const [app, offline] of [['support-desk', runSupport], ['job-planner', runPlanner]]) {
  test(app + ': live orchestration uses all three domain steps and fresh providers', async () => {
    const expected = offline('Repair order #12 at our shop').outputs;
    let instances = 0;
    let calls = 0;
    const factory = () => {
      instances++;
      return { generate: async ({ role }) => { calls++; return { output: expected[role] }; } };
    };
    for (let i = 0; i < 2; i++) {
      const run = await executeLiveRun(registry.get(app), 'Repair order #12 at our shop', factory);
      assert.equal(run.status, 'awaiting_human_review');
      assert.equal(run.mode, 'live');
      assert.equal(run.trace.length, 3);
      assert.ok(run.trace.every((t) => Number.isInteger(t.durationMs)));
      assert.deepEqual(run.outputs, expected);
    }
    assert.equal(instances, 2);
    assert.equal(calls, 6);
  });
}
test('invalid domain output removes partial drafts and stops execution', async () => {
  let calls = 0;
  const run = await executeLiveRun(registry.get('support-desk'), 'test', () => ({ generate: async () => {
    calls++;
    return { output: calls === 1 ? { category: 'general', urgency: 'normal', missingFacts: [] } : { draft: 42 } };
  } }));
  assert.equal(calls, 2);
  assert.equal(run.status, 'failed');
  assert.deepEqual(run.outputs, {});
});
test('provider failure is sanitized and never changes to offline mode', async () => {
  const run = await executeLiveRun(registry.get('job-planner'), 'test', () => { throw new Error('secret-key'); });
  assert.equal(run.mode, 'live');
  assert.equal(run.status, 'failed');
  assert.ok(!JSON.stringify(run).includes('secret-key'));
});
