// Generic tests: every registered app is checked automatically, including
// apps created later with `npm run new-app`.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { registry } from '../apps/index.js';
import { defineApp, createRegistry, publicView } from '../src/registry.js';
import { runOffline } from '../src/runtime.js';
import { validateOutput } from '../src/schema.js';
import { createHandler } from '../src/server.js';
import { MemoryStore } from '../src/store.js';

async function call(handler, method, url, body) {
  const { Readable } = await import('node:stream');
  const req = Readable.from(body === undefined ? [] : [Buffer.from(typeof body === 'string' ? body : JSON.stringify(body))]);
  Object.assign(req, { method, url, headers: { host: 'localhost' } });
  return new Promise((resolve) => {
    const res = {
      headersSent: false, status: 0, headers: {},
      writeHead(status, headers) { this.status = status; this.headers = headers || {}; this.headersSent = true; },
      end(data = '') { resolve({ status: this.status, headers: this.headers, body: String(data) }); },
    };
    handler(req, res);
  });
}

test('registry has at least two distinct apps with distinct routes and steps', () => {
  assert.ok(registry.ids.length >= 2);
  const stepSets = registry.list().map((a) => a.steps.map((s) => s.name).join(','));
  assert.equal(new Set(stepSets).size, stepSets.length, 'apps must not be the same workflow under different names');
});

for (const app of registry.list()) {
  test(`${app.id}: every sample runs offline, passes step schemas and awaits review`, () => {
    for (const sample of app.samples) {
      const run = runOffline(app, sample);
      assert.equal(run.status, 'awaiting_human_review', sample);
      assert.equal(run.trace.length, app.steps.length);
      for (const step of app.steps) validateOutput(step.name, step.schema, run.outputs[step.name]);
    }
  });

  test(`${app.id}: fixtures run and business profile is accepted`, async () => {
    const { fixtures } = await import(`../apps/${app.id}/fixtures.js`);
    for (const { input } of Object.values(fixtures)) {
      const run = runOffline(app, input, { profile: { businessName: 'Test Shop', policies: 'Returns within 14 days.', serviceArea: 'Kadıköy', hours: '9–18' } });
      assert.equal(run.status, 'awaiting_human_review');
    }
  });

  test(`${app.id}: page renders from the manifest and embeds data only`, async () => {
    const res = await call(createHandler({ store: new MemoryStore() }), 'GET', `/${app.route}`);
    assert.equal(res.status, 200);
    assert.ok(res.body.includes(app.title));
    assert.ok(!/<script>(?!\s*$)/.test(res.body), 'no inline executable scripts');
    assert.doesNotThrow(() => JSON.stringify(publicView(app)));
  });
}

test('shared core never names an application, step or domain field', () => {
  const words = new Set();
  for (const app of registry.list()) {
    words.add(app.id); words.add(app.route);
    for (const s of app.steps) { words.add(s.name); Object.keys(s.schema).forEach((f) => words.add(f)); }
  }
  // Generic field names that may legitimately appear in core code/comments.
  for (const generic of ['summary', 'urgency', 'draft', 'questions', 'tasks']) words.delete(generic);
  const files = ['src/runtime.js', 'src/registry.js', 'src/schema.js', 'src/live-workflow.js', 'src/ollama-provider.js', 'src/store.js', 'src/lifecycle.js', 'src/contracts.js', 'src/server.js', 'src/ui/client.js', 'src/ui/pages.js']
    .concat(readdirSync('src/ui').filter((f) => f.endsWith('.js')).map((f) => `src/ui/${f}`));
  for (const file of new Set(files)) {
    const code = readFileSync(file, 'utf8').replace(/\/\/.*$|\/\*[\s\S]*?\*\//gm, '');
    for (const w of words) {
      assert.ok(!new RegExp(`['"\`/]${w}['"\`/]`).test(code), `${file} references app-specific "${w}"`);
    }
  }
});

const base = {
  id: 'demo-app', route: 'demo', title: 'Demo', tagline: 't', inputLabel: 'i', placeholder: 'p', samples: ['hello'],
  steps: [{ name: 'one', label: 'One', run: () => ({ text: 'x' }), schema: { text: 'string' }, instructions: 'do' }],
  view: [{ type: 'text', step: 'one', field: 'text', title: 'Text' }],
};

test('defineApp rejects invalid manifests', () => {
  assert.doesNotThrow(() => defineApp(base));
  const bad = [
    { ...base, id: 'Bad Id' },
    { ...base, route: 'api' },
    { ...base, samples: [] },
    { ...base, steps: [] },
    { ...base, steps: [base.steps[0], base.steps[0]] },
    { ...base, steps: [{ ...base.steps[0], schema: { text: 'number' } }] },
    { ...base, steps: [{ ...base.steps[0], instructions: '' }] },
    { ...base, view: [{ type: 'text', step: 'missing', field: 'text', title: 'X' }] },
    { ...base, view: [{ type: 'text', step: 'one', field: 'nope', title: 'X' }] },
    { ...base, view: [{ type: 'list', step: 'one', field: 'text', title: 'X' }] },
    { ...base, view: [{ type: 'editable', step: 'one', field: 'text', title: 'A' }, { type: 'editable', step: 'one', field: 'text', title: 'B' }] },
  ];
  for (const m of bad) assert.throws(() => defineApp(m), TypeError, JSON.stringify(m.id));
});

test('createRegistry rejects duplicate ids/routes and unfrozen manifests', () => {
  const a = defineApp(base);
  assert.throws(() => createRegistry([a, a]), /Duplicate app id/);
  assert.throws(() => createRegistry([a, defineApp({ ...base, id: 'other-app' })]), /Duplicate app route/);
  assert.throws(() => createRegistry([{ ...base }]), /defineApp/);
});

test('a step whose output breaks its schema fails the run with no partial outputs', () => {
  const app = defineApp({ ...base, steps: [{ ...base.steps[0], run: () => ({ text: 42 }) }] });
  const run = runOffline(app, 'hello');
  assert.equal(run.status, 'failed');
  assert.deepEqual(run.outputs, {});
  assert.match(run.error, /Invalid field "text"/);
});
