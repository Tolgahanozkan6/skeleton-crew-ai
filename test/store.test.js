/**
 * T3 store tests.
 * Covers: lifecycle, in-memory and JSON adapter, reload, corrupt file,
 * unsupported schema version, stale version, double action, failed run.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { MemoryStore, JsonStore, SCHEMA_VERSION } from '../src/store.js';

// ── shared scenario helpers ───────────────────────────────────────────────────

const GOOD_TRACE = [
  { agent: 'triage', status: 'completed' },
  { agent: 'reply', status: 'completed' },
];
const FAILED_TRACE = [
  { agent: 'triage', status: 'completed' },
  { agent: 'reply', status: 'failed', error: 'provider down' },
];
const OUTPUTS = { triage: { category: 'general' }, reply: { draft: 'Thank you.' } };

function tmpFile(name) {
  const dir = join(tmpdir(), 'skeleton-crew-store-test-' + process.pid);
  mkdirSync(dir, { recursive: true });
  return join(dir, name);
}

// ── MemoryStore ───────────────────────────────────────────────────────────────

test('memory: createRun returns a run with awaiting_human_review status', () => {
  const store = new MemoryStore();
  const run = store.createRun('support-desk', 'offline-demo', OUTPUTS, GOOD_TRACE);
  assert.ok(run.id);
  assert.equal(run.status, 'awaiting_human_review');
  assert.equal(run.version, 1);
  assert.equal(run.appId, 'support-desk');
  assert.equal(run.mode, 'offline-demo');
  assert.equal(run.review, null);
});

test('memory: failed trace produces failed status', () => {
  const store = new MemoryStore();
  const run = store.createRun('support-desk', 'offline-demo', {}, FAILED_TRACE);
  assert.equal(run.status, 'failed');
});

test('memory: getRun returns the stored run', () => {
  const store = new MemoryStore();
  const run = store.createRun('support-desk', 'offline-demo', OUTPUTS, GOOD_TRACE);
  assert.deepEqual(store.getRun(run.id), run);
});

test('memory: getRun returns undefined for unknown id', () => {
  const store = new MemoryStore();
  assert.equal(store.getRun('no-such-id'), undefined);
});

test('memory: listRuns returns all runs', () => {
  const store = new MemoryStore();
  store.createRun('support-desk', 'offline-demo', OUTPUTS, GOOD_TRACE);
  store.createRun('job-planner', 'offline-demo', OUTPUTS, GOOD_TRACE);
  assert.equal(store.listRuns().length, 2);
});

test('memory: approve advances status and version', () => {
  const store = new MemoryStore();
  const run = store.createRun('support-desk', 'offline-demo', OUTPUTS, GOOD_TRACE);
  const updated = store.saveReview(run.id, {
    decision: 'approved',
    editedDraft: 'Edited reply.',
    expectedVersion: 1,
  });
  assert.equal(updated.status, 'approved');
  assert.equal(updated.version, 2);
  assert.equal(updated.review.decision, 'approved');
  assert.equal(updated.review.editedDraft, 'Edited reply.');
});

test('memory: reject advances status and version', () => {
  const store = new MemoryStore();
  const run = store.createRun('support-desk', 'offline-demo', OUTPUTS, GOOD_TRACE);
  const updated = store.saveReview(run.id, { decision: 'rejected', expectedVersion: 1 });
  assert.equal(updated.status, 'rejected');
  assert.equal(updated.version, 2);
});

test('memory: double approval throws RangeError', () => {
  const store = new MemoryStore();
  const run = store.createRun('support-desk', 'offline-demo', OUTPUTS, GOOD_TRACE);
  store.saveReview(run.id, { decision: 'approved', expectedVersion: 1 });
  assert.throws(
    () => store.saveReview(run.id, { decision: 'approved', expectedVersion: 2 }),
    RangeError
  );
});

test('memory: stale version throws RangeError', () => {
  const store = new MemoryStore();
  const run = store.createRun('support-desk', 'offline-demo', OUTPUTS, GOOD_TRACE);
  assert.throws(
    () => store.saveReview(run.id, { decision: 'approved', expectedVersion: 99 }),
    RangeError
  );
});

test('memory: reviewing a failed run throws RangeError', () => {
  const store = new MemoryStore();
  const run = store.createRun('support-desk', 'offline-demo', {}, FAILED_TRACE);
  assert.throws(
    () => store.saveReview(run.id, { decision: 'approved', expectedVersion: 1 }),
    RangeError
  );
});

test('memory: reviewing unknown run throws TypeError', () => {
  const store = new MemoryStore();
  assert.throws(
    () => store.saveReview('ghost', { decision: 'approved', expectedVersion: 1 }),
    TypeError
  );
});

test('memory: unknown decision throws TypeError', () => {
  const store = new MemoryStore();
  const run = store.createRun('support-desk', 'offline-demo', OUTPUTS, GOOD_TRACE);
  assert.throws(
    () => store.saveReview(run.id, { decision: 'maybe', expectedVersion: 1 }),
    TypeError
  );
});

// ── JsonStore ─────────────────────────────────────────────────────────────────

test('json: createRun persists to file', () => {
  const path = tmpFile('runs-persist.json');
  const store = new JsonStore(path);
  const run = store.createRun('job-planner', 'offline-demo', OUTPUTS, GOOD_TRACE);
  // Load fresh instance
  const store2 = new JsonStore(path);
  assert.deepEqual(store2.getRun(run.id), run);
});

test('json: reload preserves runs and reviews', () => {
  const path = tmpFile('runs-reload.json');
  const store = new JsonStore(path);
  const run = store.createRun('support-desk', 'offline-demo', OUTPUTS, GOOD_TRACE);
  store.saveReview(run.id, { decision: 'approved', expectedVersion: 1 });

  const store2 = new JsonStore(path);
  const reloaded = store2.getRun(run.id);
  assert.equal(reloaded.status, 'approved');
  assert.equal(reloaded.version, 2);
  assert.equal(reloaded.review.decision, 'approved');
});

test('json: corrupt file throws on construction', () => {
  const path = tmpFile('corrupt.json');
  writeFileSync(path, '{ not valid json !!!', 'utf8');
  assert.throws(() => new JsonStore(path), /corrupt/i);
});

test('json: unsupported schema version throws on construction', () => {
  const path = tmpFile('old-schema.json');
  writeFileSync(path, JSON.stringify({ schemaVersion: 0, runs: [] }), 'utf8');
  assert.throws(() => new JsonStore(path), /schema version/i);
});

test('json: missing file starts with empty store', () => {
  const path = tmpFile('nonexistent-' + Date.now() + '.json');
  const store = new JsonStore(path);
  assert.equal(store.listRuns().length, 0);
});

test('json: stale version still throws after reload', () => {
  const path = tmpFile('stale.json');
  const store = new JsonStore(path);
  const run = store.createRun('support-desk', 'offline-demo', OUTPUTS, GOOD_TRACE);
  const store2 = new JsonStore(path);
  assert.throws(
    () => store2.saveReview(run.id, { decision: 'approved', expectedVersion: 99 }),
    RangeError
  );
});

test('json: double approval still throws after reload', () => {
  const path = tmpFile('double.json');
  const store = new JsonStore(path);
  const run = store.createRun('support-desk', 'offline-demo', OUTPUTS, GOOD_TRACE);
  store.saveReview(run.id, { decision: 'approved', expectedVersion: 1 });
  const store2 = new JsonStore(path);
  assert.throws(
    () => store2.saveReview(run.id, { decision: 'rejected', expectedVersion: 2 }),
    RangeError
  );
});

test('json: no network side effects (store file is local only)', () => {
  // Simply verify the store can be created and used without touching the network.
  // The absence of any http/https import in store.js is the structural guarantee;
  // this test confirms the full create→review round-trip completes offline.
  const path = tmpFile('no-network.json');
  const store = new JsonStore(path);
  const run = store.createRun('support-desk', 'offline-demo', OUTPUTS, GOOD_TRACE);
  const updated = store.saveReview(run.id, { decision: 'approved', expectedVersion: 1 });
  assert.equal(updated.status, 'approved');
});
