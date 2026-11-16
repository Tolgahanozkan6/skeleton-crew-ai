import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateRequest,
  validateAppId,
  validateMode,
  validateDomainOutput,
  MAX_REQUEST_LENGTH,
} from '../src/contracts.js';

// ── validateRequest ──────────────────────────────────────────────────────────

test('validateRequest: accepts a normal string', () => {
  assert.equal(validateRequest('Hello'), 'Hello');
});

test('validateRequest: trims surrounding whitespace', () => {
  assert.equal(validateRequest('  hi  '), 'hi');
});

test('validateRequest: accepts a string of exactly 4,000 characters', () => {
  const text = 'a'.repeat(MAX_REQUEST_LENGTH);
  assert.equal(validateRequest(text).length, MAX_REQUEST_LENGTH);
});

test('validateRequest: rejects a string of 4,001 characters', () => {
  assert.throws(
    () => validateRequest('a'.repeat(MAX_REQUEST_LENGTH + 1)),
    RangeError
  );
});

test('validateRequest: rejects an empty string', () => {
  assert.throws(() => validateRequest(''), TypeError);
});

test('validateRequest: rejects a whitespace-only string', () => {
  assert.throws(() => validateRequest('   '), TypeError);
});

test('validateRequest: rejects null', () => {
  assert.throws(() => validateRequest(null), TypeError);
});

test('validateRequest: rejects a number', () => {
  assert.throws(() => validateRequest(42), TypeError);
});

// ── validateAppId ────────────────────────────────────────────────────────────

test('validateAppId: accepts support-desk', () => {
  assert.equal(validateAppId('support-desk'), 'support-desk');
});

test('validateAppId: accepts job-planner', () => {
  assert.equal(validateAppId('job-planner'), 'job-planner');
});

test('validateAppId: rejects unknown app', () => {
  assert.throws(() => validateAppId('billing-bot'), TypeError);
});

test('validateAppId: rejects null', () => {
  assert.throws(() => validateAppId(null), TypeError);
});

test('validateAppId: rejects a number', () => {
  assert.throws(() => validateAppId(1), TypeError);
});

// ── validateMode ─────────────────────────────────────────────────────────────

test('validateMode: accepts offline-demo', () => {
  assert.equal(validateMode('offline-demo'), 'offline-demo');
});

test('validateMode: rejects unknown mode', () => {
  assert.throws(() => validateMode('live'), TypeError);
});

test('validateMode: rejects null', () => {
  assert.throws(() => validateMode(null), TypeError);
});

// ── validateDomainOutput ─────────────────────────────────────────────────────

test('validateDomainOutput: accepts well-formed output', () => {
  const out = { status: 'awaiting_human_review', outputs: { triage: { category: 'general' } } };
  assert.equal(validateDomainOutput(out), out);
});

test('validateDomainOutput: rejects null', () => {
  assert.throws(() => validateDomainOutput(null), TypeError);
});

test('validateDomainOutput: rejects an array', () => {
  assert.throws(() => validateDomainOutput([]), TypeError);
});

test('validateDomainOutput: rejects output with no status', () => {
  assert.throws(
    () => validateDomainOutput({ outputs: { step: {} } }),
    TypeError
  );
});

test('validateDomainOutput: rejects output with empty status', () => {
  assert.throws(
    () => validateDomainOutput({ status: '', outputs: { step: {} } }),
    TypeError
  );
});

test('validateDomainOutput: rejects output with missing outputs', () => {
  assert.throws(
    () => validateDomainOutput({ status: 'done' }),
    TypeError
  );
});

test('validateDomainOutput: rejects output with empty outputs object', () => {
  assert.throws(
    () => validateDomainOutput({ status: 'done', outputs: {} }),
    TypeError
  );
});

test('validateDomainOutput: rejects output with outputs as array', () => {
  assert.throws(
    () => validateDomainOutput({ status: 'done', outputs: [] }),
    TypeError
  );
});

// ── Legacy API and app integration ───────────────────────────────────────────

test('runCrew legacy API still works after contracts added', async () => {
  const { runCrew } = await import('../src/crew.js');
  const result = runCrew('I would like to return my order.');
  assert.equal(result.triage.category, 'returns');
  assert.equal(result.status, 'awaiting_human_review');
  assert.equal(result.mode, 'offline-demo');
});

test('runSupport output passes validateDomainOutput', async () => {
  const { runSupport } = await import('../apps/support-desk/workflow.js');
  const result = runSupport('I need help with my order');
  validateDomainOutput(result);
});

test('runPlanner output passes validateDomainOutput', async () => {
  const { runPlanner } = await import('../apps/job-planner/workflow.js');
  const result = runPlanner('Fix the broken door');
  validateDomainOutput(result);
});
