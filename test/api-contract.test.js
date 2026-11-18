// HTTP contract regressions found in the 2026-11-16 review: review body
// validation, status codes, app filter, CSRF guard and business profile.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createHandler } from '../src/server.js';
import { MemoryStore } from '../src/store.js';

test('API contract', async (t) => {
  const server = createServer(createHandler({ store: new MemoryStore() }));
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}`;
  const post = (path, body, headers = {}) => fetch(base + path, {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
  const create = async (appId = 'support-desk', request = 'I want a refund', extra = {}) =>
    (await post('/api/runs', { appId, request, ...extra })).json();

  try {
    await t.test('review: null / array / missing body fields → 400, not 404', async () => {
      const run = await create();
      for (const body of ['null', '[]', '{}', JSON.stringify({ decision: 'approved' })]) {
        const res = await post(`/api/runs/${run.id}/review`, body);
        assert.equal(res.status, 400, body);
        const data = await res.json();
        assert.ok(!/Cannot read properties/.test(data.error), 'no internal error text');
      }
    });

    await t.test('review: unknown decision → 400', async () => {
      const run = await create();
      assert.equal((await post(`/api/runs/${run.id}/review`, { decision: 'yes', expectedVersion: 1 })).status, 400);
    });

    await t.test('review: non-string or oversized editedDraft → 400', async () => {
      const run = await create();
      assert.equal((await post(`/api/runs/${run.id}/review`, { decision: 'approved', editedDraft: { x: 1 }, expectedVersion: 1 })).status, 400);
      assert.equal((await post(`/api/runs/${run.id}/review`, { decision: 'approved', editedDraft: 'a'.repeat(8001), expectedVersion: 1 })).status, 400);
      const ok = await post(`/api/runs/${run.id}/review`, { decision: 'approved', editedDraft: 'Edited.', expectedVersion: 1 });
      assert.equal(ok.status, 200);
      assert.equal((await ok.json()).review.editedDraft, 'Edited.');
    });

    await t.test('review: unknown run → 404; repeat → 409', async () => {
      assert.equal((await post('/api/runs/nope/review', { decision: 'approved', expectedVersion: 1 })).status, 404);
      const run = await create();
      assert.equal((await post(`/api/runs/${run.id}/review`, { decision: 'rejected', expectedVersion: 1 })).status, 200);
      assert.equal((await post(`/api/runs/${run.id}/review`, { decision: 'approved', expectedVersion: 2 })).status, 409);
    });

    await t.test('oversized body → 413', async () => {
      const res = await post('/api/runs', { appId: 'support-desk', request: 'a'.repeat(20000) });
      assert.equal(res.status, 413);
    });

    await t.test('unknown mode → 400; live mode accepted by the same contract', async () => {
      assert.equal((await post('/api/runs', { appId: 'support-desk', request: 'hi', mode: 'turbo' })).status, 400);
    });

    await t.test('GET /api/runs?appId filters; unknown appId → 400', async () => {
      await create('job-planner', 'Fix the door at 3 High Street');
      const runs = await (await fetch(`${base}/api/runs?appId=job-planner`)).json();
      assert.ok(runs.length >= 1 && runs.every((r) => r.appId === 'job-planner'));
      assert.equal((await fetch(`${base}/api/runs?appId=nope`)).status, 400);
    });

    await t.test('cross-origin browser POST is blocked', async () => {
      const res = await post('/api/runs', { appId: 'support-desk', request: 'hi' }, { Origin: 'https://evil.example' });
      assert.equal(res.status, 403);
    });

    await t.test('run stores input and uses the business profile', async () => {
      const run = await create('support-desk', 'Order #5555 arrived broken, I want to return it.', {
        profile: { businessName: 'Kemik Kırtasiye', policies: 'Returns within 14 days with receipt.', unknown: 'dropped' },
      });
      assert.equal(run.input, 'Order #5555 arrived broken, I want to return it.');
      assert.equal(run.profileUsed, true);
      assert.ok(run.outputs.reply.draft.includes('Kemik Kırtasiye'));
      assert.ok(run.outputs.operations.checklist.some((c) => c.includes('14 days')));
    });

    await t.test('invalid profile → 400', async () => {
      assert.equal((await post('/api/runs', { appId: 'support-desk', request: 'hi', profile: { policies: 5 } })).status, 400);
      assert.equal((await post('/api/runs', { appId: 'support-desk', request: 'hi', profile: { policies: 'x'.repeat(601) } })).status, 400);
    });

    await t.test('Turkish request gets a Turkish reply draft', async () => {
      const run = await create('support-desk', 'Sipariş numaram 1234. Ürün kırık, İADE istiyorum.');
      assert.match(run.outputs.reply.draft, /Merhaba/);
    });

    await t.test('assets are served; unknown asset paths are not', async () => {
      assert.equal((await fetch(`${base}/assets/client.js`)).status, 200);
      assert.equal((await fetch(`${base}/assets/styles.css`)).status, 200);
      assert.equal((await fetch(`${base}/assets/../server.js`)).status, 404);
    });
  } finally {
    await new Promise((r) => server.close(r));
  }
});
