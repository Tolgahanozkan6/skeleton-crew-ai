// Builds the static public demo from the unchanged ES modules (no bundler).
// Output tree mirrors the repo so relative imports keep working:
//   index.html, <route>/index.html, assets/*, src/<browser-safe modules>, apps/**
// Usage: node scripts/build-public-demo.mjs [targetDir]
import { mkdir, writeFile, copyFile, readdir, rm } from 'node:fs/promises';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { registry } from '../apps/index.js';
import { appPage, landingPage } from '../src/ui/pages.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const target = resolve(process.argv[2] || resolve(root, 'dist/public-demo'));
const opts = { publicDemo: true, linkSuffix: '/' };

// Browser-safe core modules only (no node:* imports).
const CORE = ['runtime.js', 'contracts.js', 'schema.js', 'registry.js', 'lifecycle.js', 'errors.js'];

async function copyTree(from, to) {
  await mkdir(to, { recursive: true });
  for (const entry of await readdir(from, { withFileTypes: true })) {
    const src = join(from, entry.name);
    if (entry.isDirectory()) await copyTree(src, join(to, entry.name));
    else if (entry.name.endsWith('.js')) await copyFile(src, join(to, entry.name));
  }
}

await rm(target, { recursive: true, force: true });
await mkdir(join(target, 'src'), { recursive: true });
await mkdir(join(target, 'assets'), { recursive: true });
for (const file of CORE) await copyFile(join(root, 'src', file), join(target, 'src', file));
await copyTree(join(root, 'apps'), join(target, 'apps'));
await copyFile(join(root, 'src/ui/styles.css'), join(target, 'assets/styles.css'));
await copyFile(join(root, 'src/ui/client.js'), join(target, 'assets/client.js'));
await copyFile(join(root, 'scripts/public-adapter.js'), join(target, 'assets/public-adapter.js'));
await writeFile(join(target, 'index.html'), landingPage(registry, opts));
for (const app of registry.list()) {
  await mkdir(join(target, app.route), { recursive: true });
  await writeFile(join(target, app.route, 'index.html'), appPage(app, registry, opts));
}
await copyFile(join(root, 'LICENSE'), join(target, 'LICENSE.txt'));
console.log(`Built static demo with ${registry.ids.length} apps at ${target}`);
