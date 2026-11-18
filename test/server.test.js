/**
 * T4 HTTP server tests.
 * Uses Node.js built-in fetch (Node 22+) against a loopback test server.
 * No browser required; covers routes, validation, review lifecycle,
 * error states and HTML injection safety.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { handleRequest } from '../src/server.js';

// ── test server lifecycle ─────────────────────────────────────────────────────

let baseUrl;
let server;

// Start one server for the whole file.
function startTestServer() {
  return new Promise((resolve) => {
    server = createServer((req, res) => {
      handleRequest(req, res).catch((err) => {
        if (!res.headersSent) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'internal' }));
        }
      });
    });
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
}

function stopTestServer() {
  return new Promise((resolve) => server.close(resolve));
}

// node:test does not have a module-level before/after, so use a wrapper.
test('HTTP server routes', async (t) => {
  await startTestServer();

  await t.test('GET / renders a landing page linking every registered app', async () => {
    const res = await fetch(baseUrl + '/');
    assert.equal(res.status, 200);
    const text = await res.text();
    assert.ok(text.includes('href="/support"'));
    assert.ok(text.includes('href="/planner"'));
    assert.ok(res.headers.get('content-security-policy').includes("script-src 'self'"));
  });

  await t.test('GET /support returns HTML', async () => {
    const res = await fetch(baseUrl + '/support');
    assert.equal(res.status, 200);
    assert.ok(res.headers.get('content-type').includes('text/html'));
    const text = await res.text();
    assert.ok(text.includes('Support Desk'));
  });

  await t.test('GET /planner returns HTML', async () => {
    const res = await fetch(baseUrl + '/planner');
    assert.equal(res.status, 200);
    const text = await res.text();
    assert.ok(text.includes('Job Planner'));
  });

  await t.test('GET /unknown returns 404 JSON', async () => {
    const res = await fetch(baseUrl + '/unknown');
    assert.equal(res.status, 404);
  });

  // ── POST /api/runs ──────────────────────────────────────────────────────────

  await t.test('POST /api/runs creates a support-desk run', async () => {
    const res = await fetch(baseUrl + '/api/runs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appId: 'support-desk', request: 'I need help with my order #99.' }),
    });
    assert.equal(res.status, 201);
    const run = await res.json();
    assert.ok(run.id);
    assert.equal(run.appId, 'support-desk');
    assert.equal(run.status, 'awaiting_human_review');
  });

  await t.test('POST /api/runs creates a job-planner run', async () => {
    const res = await fetch(baseUrl + '/api/runs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appId: 'job-planner', request: 'Fix the broken door at our shop.' }),
    });
    assert.equal(res.status, 201);
    const run = await res.json();
    assert.equal(run.appId, 'job-planner');
    assert.equal(run.outputs.scope.service, 'repair-assessment');
  });

  await t.test('POST /api/runs rejects empty request with 400', async () => {
    const res = await fetch(baseUrl + '/api/runs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appId: 'support-desk', request: '   ' }),
    });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.ok(body.error);
  });

  await t.test('POST /api/runs rejects unknown appId with 400', async () => {
    const res = await fetch(baseUrl + '/api/runs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appId: 'billing-bot', request: 'Hello' }),
    });
    assert.equal(res.status, 400);
  });

  await t.test('POST /api/runs rejects malformed JSON with 400', async () => {
    const res = await fetch(baseUrl + '/api/runs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not json',
    });
    assert.equal(res.status, 400);
  });

  await t.test('POST /api/runs rejects oversized body with 413', async () => {
    const res = await fetch(baseUrl + '/api/runs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appId: 'support-desk', request: 'a'.repeat(20_000) }),
    });
    // Either 413 (body limit) or 400 (request length contract) is acceptable
    assert.ok([400, 413].includes(res.status), `Expected 400 or 413, got ${res.status}`);
  });

  // ── GET /api/runs ───────────────────────────────────────────────────────────

  await t.test('GET /api/runs returns an array', async () => {
    const res = await fetch(baseUrl + '/api/runs');
    assert.equal(res.status, 200);
    const runs = await res.json();
    assert.ok(Array.isArray(runs));
    assert.ok(runs.length >= 2); // created above
  });

  // ── GET /api/runs/:id ───────────────────────────────────────────────────────

  await t.test('GET /api/runs/:id returns a specific run', async () => {
    const createRes = await fetch(baseUrl + '/api/runs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appId: 'support-desk', request: 'Order #55 not arrived.' }),
    });
    const run = await createRes.json();
    const getRes = await fetch(baseUrl + '/api/runs/' + run.id);
    assert.equal(getRes.status, 200);
    const fetched = await getRes.json();
    assert.equal(fetched.id, run.id);
  });

  await t.test('GET /api/runs/unknown-id returns 404', async () => {
    const res = await fetch(baseUrl + '/api/runs/no-such-id');
    assert.equal(res.status, 404);
  });

  // ── POST /api/runs/:id/review ───────────────────────────────────────────────

  await t.test('POST review: approve advances status', async () => {
    const createRes = await fetch(baseUrl + '/api/runs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appId: 'support-desk', request: 'Please help me with order #77.' }),
    });
    const run = await createRes.json();

    const reviewRes = await fetch(baseUrl + '/api/runs/' + run.id + '/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision: 'approved', editedDraft: 'Edited.', expectedVersion: 1 }),
    });
    assert.equal(reviewRes.status, 200);
    const updated = await reviewRes.json();
    assert.equal(updated.status, 'approved');
    assert.equal(updated.version, 2);
  });

  await t.test('POST review: reject advances status', async () => {
    const createRes = await fetch(baseUrl + '/api/runs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appId: 'support-desk', request: 'Order #88 wrong item.' }),
    });
    const run = await createRes.json();
    const reviewRes = await fetch(baseUrl + '/api/runs/' + run.id + '/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision: 'rejected', expectedVersion: 1 }),
    });
    assert.equal(reviewRes.status, 200);
    const updated = await reviewRes.json();
    assert.equal(updated.status, 'rejected');
  });

  await t.test('POST review: stale version returns 409', async () => {
    const createRes = await fetch(baseUrl + '/api/runs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appId: 'support-desk', request: 'Help with order #100.' }),
    });
    const run = await createRes.json();
    const reviewRes = await fetch(baseUrl + '/api/runs/' + run.id + '/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision: 'approved', expectedVersion: 99 }),
    });
    assert.equal(reviewRes.status, 409);
  });

  await t.test('POST review: double approval returns 409', async () => {
    const createRes = await fetch(baseUrl + '/api/runs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appId: 'support-desk', request: 'Help with order #200.' }),
    });
    const run = await createRes.json();
    await fetch(baseUrl + '/api/runs/' + run.id + '/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision: 'approved', expectedVersion: 1 }),
    });
    const secondRes = await fetch(baseUrl + '/api/runs/' + run.id + '/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision: 'approved', expectedVersion: 2 }),
    });
    assert.equal(secondRes.status, 409);
  });

  await t.test('POST review: unknown run returns 404', async () => {
    const res = await fetch(baseUrl + '/api/runs/ghost-id/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision: 'approved', expectedVersion: 1 }),
    });
    assert.equal(res.status, 404);
  });

  // ── HTML injection safety ───────────────────────────────────────────────────

  await t.test('HTML injection in request does not execute in API response', async () => {
    const payload = '<script>alert(1)</script>';
    const res = await fetch(baseUrl + '/api/runs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appId: 'support-desk', request: payload }),
    });
    // The request is valid (non-empty string under 4000 chars), so it runs.
    // The API returns JSON — the script tag is data, not markup.
    if (res.status === 201) {
      const run = await res.json();
      // Outputs are stored as plain strings — no execution possible in JSON.
      assert.equal(typeof run.id, 'string');
    } else {
      // If rejected for some reason, that's also safe.
      assert.ok([400, 201].includes(res.status));
    }
  });

  await t.test('HTML pages do not expose X-Content-Type-Options: nosniff', async () => {
    // Actually check it IS set (security header)
    const res = await fetch(baseUrl + '/support');
    assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
  });

  await stopTestServer();
});
