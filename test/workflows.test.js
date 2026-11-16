/**
 * T2 workflow tests.
 * Covers: three fixtures per app, output relevance, no fabricated commitments,
 * structured trace, explicit failed state, and no approvable partial draft.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { runSupport } from '../apps/support-desk/workflow.js';
import { runPlanner } from '../apps/job-planner/workflow.js';
import { fixtures as supportFixtures } from '../apps/support-desk/fixtures.js';
import { fixtures as plannerFixtures } from '../apps/job-planner/fixtures.js';
import { runWorkflow } from '../src/runtime.js';

// ── helpers ──────────────────────────────────────────────────────────────────

/** Returns true when a string contains any commitment-like phrasing. */
function containsCommitment(str) {
  return /refund approved|booking confirmed|quote is|price is|£|\$|will refund|will send|guaranteed/i.test(
    str
  );
}

// ── Support Desk: fixture-driven ─────────────────────────────────────────────

test('support/normal: returns category, urgency and checklist; no fabricated commitment', () => {
  const { input, expect: ex } = supportFixtures.normal;
  const result = runSupport(input);

  assert.equal(result.status, 'awaiting_human_review');
  assert.equal(result.mode, 'offline-demo');
  assert.equal(result.outputs.triage.category, ex.category);
  assert.equal(result.outputs.triage.urgency, ex.urgency);
  assert.equal(result.outputs.triage.missingFacts.length === 0, !ex.hasMissingFacts);
  assert.ok(Array.isArray(result.outputs.operations.checklist));
  assert.ok(result.outputs.operations.checklist.length > 0);
  assert.ok(!containsCommitment(result.outputs.reply.draft));
});

test('support/missingFacts: draft asks for order reference; no invented resolution', () => {
  const { input, expect: ex } = supportFixtures.missingFacts;
  const result = runSupport(input);

  assert.equal(result.outputs.triage.category, ex.category);
  assert.ok(result.outputs.triage.missingFacts.length > 0, 'should flag missing order reference');
  assert.ok(result.outputs.reply.clarificationQuestions.length > 0);
  // Draft must ask, not resolve
  assert.ok(!containsCommitment(result.outputs.reply.draft));
  assert.ok(
    /order number|reference/i.test(result.outputs.reply.draft),
    'draft should ask for order info'
  );
});

test('support/urgent: urgency is high; checklist includes priority flag; no commitment', () => {
  const { input, expect: ex } = supportFixtures.urgent;
  const result = runSupport(input);

  assert.equal(result.outputs.triage.urgency, ex.urgency);
  assert.equal(result.outputs.triage.category, ex.category);
  assert.ok(!containsCommitment(result.outputs.reply.draft));
  const checklistText = result.outputs.operations.checklist.join(' ');
  assert.ok(/priority|high/i.test(checklistText), 'checklist should flag high priority');
});

// ── Support Desk: different inputs produce different outputs ─────────────────

test('support: normal vs missing-facts produce different drafts', () => {
  const a = runSupport(supportFixtures.normal.input);
  const b = runSupport(supportFixtures.missingFacts.input);
  assert.notEqual(a.outputs.reply.draft, b.outputs.reply.draft);
});

test('support: normal vs urgent produce different urgency values', () => {
  const a = runSupport(supportFixtures.normal.input);
  const b = runSupport(supportFixtures.urgent.input);
  assert.notEqual(a.outputs.triage.urgency, b.outputs.triage.urgency);
});

// ── Support Desk: trace ──────────────────────────────────────────────────────

test('support: trace lists all three agents in order with completed status', () => {
  const result = runSupport(supportFixtures.normal.input);
  assert.deepEqual(
    result.trace.map((t) => t.agent),
    ['triage', 'reply', 'operations']
  );
  assert.ok(result.trace.every((t) => t.status === 'completed'));
});

// ── Job Planner: fixture-driven ──────────────────────────────────────────────

test('planner/normal: repair service, booking not confirmed, no quote', () => {
  const { input, expect: ex } = plannerFixtures.normal;
  const result = runPlanner(input);

  assert.equal(result.status, 'awaiting_human_review');
  assert.equal(result.mode, 'offline-demo');
  assert.equal(result.outputs.scope.service, ex.service);
  assert.equal(result.outputs.scope.urgency, ex.urgency);
  assert.equal(result.outputs.planner.bookingConfirmed, false);
  assert.equal(result.outputs.clarification.quote, null);
  assert.ok(result.outputs.clarification.questions.length > 0);
});

test('planner/missingFacts: questions raised; no invented location, size or quote', () => {
  const { input, expect: ex } = plannerFixtures.missingFacts;
  const result = runPlanner(input);

  assert.equal(result.outputs.scope.service, ex.service);
  assert.ok(result.outputs.scope.missingFacts.length > 0, 'should flag missing facts');
  assert.equal(result.outputs.clarification.quote, null);
  assert.ok(result.outputs.clarification.questions.length > 0);
  // No invented numbers in clarification questions
  const qText = result.outputs.clarification.questions.join(' ');
  assert.ok(!/£|\$|\d+\s*m²|\d+ rooms?/i.test(qText), 'questions must not invent size or price');
});

test('planner/urgent: service is repair, urgency high, booking still not confirmed', () => {
  const { input, expect: ex } = plannerFixtures.urgent;
  const result = runPlanner(input);

  assert.equal(result.outputs.scope.service, ex.service);
  assert.equal(result.outputs.scope.urgency, ex.urgency);
  assert.equal(result.outputs.planner.bookingConfirmed, false);
  assert.equal(result.outputs.clarification.quote, null);
  // Urgent fixture should ask about safety risk
  const qText = result.outputs.clarification.questions.join(' ');
  assert.ok(/urgent|safety|risk/i.test(qText), 'should raise urgency/safety question');
});

// ── Job Planner: different inputs produce different outputs ──────────────────

test('planner: repair vs general-assessment inputs produce different service values', () => {
  const a = runPlanner(plannerFixtures.normal.input);
  const b = runPlanner(plannerFixtures.missingFacts.input);
  assert.notEqual(a.outputs.scope.service, b.outputs.scope.service);
});

test('planner: normal vs urgent produce different urgency values', () => {
  const a = runPlanner(plannerFixtures.normal.input);
  const b = runPlanner(plannerFixtures.urgent.input);
  assert.notEqual(a.outputs.scope.urgency, b.outputs.scope.urgency);
});

// ── Job Planner: trace ───────────────────────────────────────────────────────

test('planner: trace lists scope, planner, clarification in order', () => {
  const result = runPlanner(plannerFixtures.normal.input);
  assert.deepEqual(
    result.trace.map((t) => t.agent),
    ['scope', 'planner', 'clarification']
  );
  assert.ok(result.trace.every((t) => t.status === 'completed'));
});

// ── Failed state: no approvable partial draft ────────────────────────────────

test('failed step: status is failed, outputs is empty, no partial draft', () => {
  const result = runWorkflow('Some request', [
    { name: 'step-a', run: () => ({ data: 'ok' }) },
    { name: 'step-b', run: () => { throw new Error('provider unavailable'); } },
    { name: 'step-c', run: () => ({ data: 'should not run' }) },
  ]);

  assert.equal(result.status, 'failed');
  assert.equal(result.failedStep, 'step-b');
  assert.match(result.error, /provider unavailable/);
  // outputs must be empty — no partial draft to approve
  assert.deepEqual(result.outputs, {});
  // trace records the failure
  const failedEntry = result.trace.find((t) => t.agent === 'step-b');
  assert.ok(failedEntry, 'trace must include the failing step');
  assert.equal(failedEntry.status, 'failed');
  // step-c must not appear in trace
  assert.ok(!result.trace.find((t) => t.agent === 'step-c'), 'steps after failure must not run');
});

test('failed step: mode is still offline-demo', () => {
  const result = runWorkflow('req', [
    { name: 'boom', run: () => { throw new Error('oops'); } },
  ]);
  assert.equal(result.mode, 'offline-demo');
  assert.equal(result.status, 'failed');
});

test('failed step at first position: outputs empty and trace length is 1', () => {
  const result = runWorkflow('req', [
    { name: 'first', run: () => { throw new Error('immediate failure'); } },
    { name: 'second', run: () => ({}) },
  ]);
  assert.deepEqual(result.outputs, {});
  assert.equal(result.trace.length, 1);
  assert.equal(result.trace[0].agent, 'first');
  assert.equal(result.trace[0].status, 'failed');
});
