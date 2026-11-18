// new-app scaffolder + public demo build, both exercised in temp directories.
import test from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, mkdtempSync, rmSync, existsSync, readFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
import { scaffold } from '../scripts/new-app.mjs';

const root = resolve('.');

test('new-app scaffolds a third app that registers and runs without manual edits', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'crew-scaffold-'));
  try {
    cpSync(join(root, 'src'), join(dir, 'src'), { recursive: true });
    cpSync(join(root, 'apps'), join(dir, 'apps'), { recursive: true });
    await scaffold({ id: 'review-responder', title: 'Review Responder', route: 'reviews', root: dir });
    await assert.rejects(scaffold({ id: 'review-responder', title: 'Again', root: dir }), /already exists/);
    await assert.rejects(scaffold({ id: 'Bad Id', title: 'x', root: dir }), /lowercase/);

    const { registry } = await import(pathToFileURL(join(dir, 'apps/index.js')).href);
    const { runOffline } = await import(pathToFileURL(join(dir, 'src/runtime.js')).href);
    assert.equal(registry.ids.length, 3);
    const app = registry.byRoute('reviews');
    assert.equal(app.title, 'Review Responder');
    for (const s of app.samples) assert.equal(runOffline(app, s).status, 'awaiting_human_review');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('public demo build mirrors modules so every browser import resolves', () => {
  const out = mkdtempSync(join(tmpdir(), 'crew-public-'));
  try {
    execFileSync(process.execPath, [join(root, 'scripts/build-public-demo.mjs'), out], { stdio: 'pipe' });
    for (const f of ['index.html', 'support/index.html', 'planner/index.html', 'assets/client.js', 'assets/styles.css', 'assets/public-adapter.js']) {
      assert.ok(existsSync(join(out, f)), f);
    }
    // Walk every built JS module and check that each import target exists.
    const seen = new Set();
    const visit = (file) => {
      if (seen.has(file)) return;
      seen.add(file);
      const code = readFileSync(file, 'utf8');
      assert.ok(!/from ['"]node:/.test(code), `${file} imports a Node-only module`);
      for (const [, spec] of code.matchAll(/(?:import|from)\s*['"]([^'"]+)['"]/g)) {
        const target = spec.startsWith('/') ? join(out, spec) : resolve(dirname(file), spec);
        assert.ok(existsSync(target), `${file} → ${spec}`);
        visit(target);
      }
    };
    visit(join(out, 'assets/public-adapter.js'));
    visit(join(out, 'assets/client.js'));
    const html = readFileSync(join(out, 'support/index.html'), 'utf8');
    assert.ok(html.indexOf('public-adapter.js') < html.indexOf('client.js'), 'adapter loads before client');
    assert.ok(readdirSync(join(out, 'apps')).includes('support-desk'));
  } finally {
    rmSync(out, { recursive: true, force: true });
  }
});
