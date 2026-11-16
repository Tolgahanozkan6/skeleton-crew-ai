import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { startServer } from '../src/server.js';
import { JsonStore } from '../src/store.js';

test('HTTP run and review persist across a server restart', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'crew-http-'));
  const path = join(dir, 'runs.json');
  let server;
  async function start() {
    server = startServer(0, { store: new JsonStore(path) });
    await once(server, 'listening');
    return 'http://127.0.0.1:' + server.address().port;
  }
  try {
    let base = await start();
    const created = await fetch(base + '/api/runs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ appId: 'support-desk', request: 'Refund order #12' }) });
    assert.equal(created.status, 201);
    const run = await created.json();
    const review = await fetch(base + '/api/runs/' + run.id + '/review', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ decision: 'approved', editedDraft: 'Reviewed draft', expectedVersion: run.version }) });
    assert.equal(review.status, 200);
    await new Promise(resolve => server.close(resolve));
    base = await start();
    const saved = await (await fetch(base + '/api/runs/' + run.id)).json();
    assert.equal(saved.status, 'approved');
    assert.equal(saved.review.editedDraft, 'Reviewed draft');
    const invalid = await fetch(base + '/api/runs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ appId: 'support-desk', request: 'test', mode: 'unknown' }) });
    assert.equal(invalid.status, 400);
  } finally {
    if (server?.listening) await new Promise(resolve => server.close(resolve));
    rmSync(dir, { recursive: true, force: true });
  }
});

test('HTTP live mode reaches provider and stores domain output without network', async () => {
  const { MemoryStore } = await import('../src/store.js');
  const { runSupport } = await import('../apps/support-desk/workflow.js');
  const outputs = runSupport('Refund order #12').outputs;
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.CREW_API_KEY;
  const originalProvider = process.env.CREW_PROVIDER;
  process.env.CREW_PROVIDER = 'openai';
  let calls = 0;
  process.env.CREW_API_KEY = 'test-only-key';
  globalThis.fetch = async (url, options) => {
    if (String(url).startsWith('https://api.openai.com/')) {
      calls++;
      const role = JSON.parse(options.body).messages[0].content.match(/You are a (\w+) assistant/)[1];
      return { ok: true, json: async () => ({ choices: [{ message: { content: JSON.stringify({ output: outputs[role] }) } }] }) };
    }
    return originalFetch(url, options);
  };
  const server = startServer(0, { store: new MemoryStore() });
  try {
    await once(server, 'listening');
    const base = 'http://127.0.0.1:' + server.address().port;
    const response = await originalFetch(base + '/api/runs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ appId: 'support-desk', request: 'Refund order #12', mode: 'live' }) });
    const run = await response.json();
    assert.equal(response.status, 201);
    assert.equal(run.mode, 'live');
    assert.equal(run.status, 'awaiting_human_review');
    assert.equal(run.outputs.triage.category, 'returns');
    assert.equal(calls, 3);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalProvider === undefined) delete process.env.CREW_PROVIDER;
    else process.env.CREW_PROVIDER = originalProvider;
    if (originalKey === undefined) delete process.env.CREW_API_KEY;
    else process.env.CREW_API_KEY = originalKey;
    await new Promise(resolve => server.close(resolve));
  }
});
