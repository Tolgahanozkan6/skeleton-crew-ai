#!/usr/bin/env node
// Scaffolds a new app on the skeleton: apps/<id>/{workflow,manifest,fixtures,demo}.js + README
// and registers it in apps/index.js. The generated app passes the generic
// registry tests immediately; replace the rules and schema with your domain.
//
// Usage: npm run new-app <id> "<Title>" [-- --route <route>] [--root <dir>]
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ID = /^[a-z][a-z0-9-]{1,40}$/;
const RESERVED = new Set(['api', 'assets', 'src', 'apps', 'health']);

export function camel(id) {
  return id.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());
}

export function templates({ id, title, route }) {
  const q = (s) => JSON.stringify(s);
  return {
    'workflow.js': `import { runWorkflow } from '../../src/runtime.js';

// ${title}: request → analyze → draft. Replace these rules with your domain.
// Keep the safety rule: steps propose, the owner decides.

function analyze(text) {
  const urgent = /urgent|asap|today|acil|hemen/i.test(text);
  const missingFacts = text.length < 40 ? ['More detail is needed to act on this request.'] : [];
  return { summary: text.length > 140 ? text.slice(0, 137) + '…' : text, priority: urgent ? 'high' : 'normal', missingFacts };
}

function draft(_text, outputs, ctx = {}) {
  const name = ctx.profile?.businessName ?? 'our team';
  const { priority, missingFacts } = outputs.analyze;
  return {
    draft: missingFacts.length
      ? \`Thanks for your message. Could you share a few more details so \${name} can help?\`
      : \`Thanks for your message. \${name} will follow up \${priority === 'high' ? 'as a priority' : 'shortly'}.\`,
    nextSteps: ['Review the request.', ...(priority === 'high' ? ['Respond today.'] : []), 'Approve or edit the draft.'],
  };
}

export const steps = [
  {
    name: 'analyze',
    label: 'Analyze',
    run: (text) => analyze(text),
    schema: { summary: 'string', priority: ['high', 'normal'], missingFacts: 'strings' },
    instructions: 'Summarize the request in at most 25 words. priority=high only for explicit urgency. List essential missing facts.',
  },
  {
    name: 'draft',
    label: 'Draft',
    run: draft,
    schema: { draft: 'string', nextSteps: 'strings' },
    instructions: 'Write a short, polite reply in the customer\\'s language without promising anything. List 2 to 4 next steps for the owner.',
  },
];

export function run${camel(id).replace(/^./, (c) => c.toUpperCase())}(request, ctx = {}) {
  return runWorkflow(request, steps, ctx);
}
`,
    'manifest.js': `import { defineApp } from '../../src/registry.js';
import { steps } from './workflow.js';

export default defineApp({
  id: ${q(id)},
  route: ${q(route)},
  title: ${q(title)},
  icon: '🦴',
  tagline: ${q(`${title}: describe what this crew does for a small business.`)},
  inputLabel: 'Request',
  placeholder: 'Paste the request…',
  samples: [
    'Hello, I would like some help with my recent order, it is quite urgent please.',
    'Hi there',
  ],
  steps,
  view: [
    { type: 'fields', step: 'analyze', title: 'Analysis', fields: [['priority', 'Priority']] },
    { type: 'text', step: 'analyze', field: 'summary', title: 'Summary' },
    { type: 'list', step: 'analyze', field: 'missingFacts', title: 'Missing information', hideEmpty: true },
    { type: 'editable', step: 'draft', field: 'draft', title: 'Draft', hint: 'Edit before approving' },
    { type: 'list', step: 'draft', field: 'nextSteps', title: 'Next steps', checklist: true },
  ],
});
`,
    'fixtures.js': `export const fixtures = {
  normal: { input: 'Hello, I would like some help with my recent order, it is quite urgent please.' },
  missingFacts: { input: 'Hi there' },
};
`,
    'demo.js': `import { run${camel(id).replace(/^./, (c) => c.toUpperCase())} } from './workflow.js';
console.log(JSON.stringify(run${camel(id).replace(/^./, (c) => c.toUpperCase())}('Hello, I need help with my order today.'), null, 2));
`,
    'README.md': `# ${title}

Generated with \`npm run new-app ${id} "${title}"\`. Route: \`/${route}\`.

1. Edit \`workflow.js\`: rules, step schemas and model instructions.
2. Edit \`manifest.js\`: samples and view sections.
3. Run \`npm test\` — the generic registry tests cover this app automatically.
`,
  };
}

export async function scaffold({ id, title, route = id, root }) {
  if (!ID.test(id)) throw new Error('id must be lowercase letters, digits and dashes (e.g. review-responder)');
  if (!ID.test(route) || RESERVED.has(route)) throw new Error('route must be a lowercase slug and not reserved');
  if (!title || !title.trim()) throw new Error('title is required');
  const dir = join(root, 'apps', id);
  if (existsSync(dir)) throw new Error(`apps/${id} already exists`);
  const indexPath = join(root, 'apps', 'index.js');
  const index = await readFile(indexPath, 'utf8');
  if (!index.includes('// new-app:imports') || !index.includes('// new-app:entries')) throw new Error('apps/index.js is missing the new-app markers');
  if (new RegExp(`route:\\s*['"]${route}['"]`).test(index)) throw new Error(`route ${route} already used`);

  await mkdir(dir, { recursive: true });
  for (const [name, content] of Object.entries(templates({ id, title: title.trim(), route }))) {
    await writeFile(join(dir, name), content);
  }
  const v = camel(id);
  const updated = index
    .replace('// new-app:imports', `import ${v} from './${id}/manifest.js';\n// new-app:imports`)
    .replace('  // new-app:entries', `  ${v},\n  // new-app:entries`);
  await writeFile(indexPath, updated);
  return dir;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const opt = (name) => { const i = args.indexOf(name); if (i < 0) return undefined; const v = args[i + 1]; args.splice(i, 2); return v; };
  const route = opt('--route');
  const root = resolve(opt('--root') ?? resolve(dirname(fileURLToPath(import.meta.url)), '..'));
  const [id, ...titleParts] = args;
  if (!id) {
    console.error('Usage: npm run new-app <id> "<Title>" [-- --route <route>]');
    process.exit(1);
  }
  try {
    const dir = await scaffold({ id, title: titleParts.join(' ') || id, route: route ?? id, root });
    console.log(`Created ${dir} and registered it in apps/index.js.\nNext: npm test, then npm run start:web and open /${route ?? id}`);
  } catch (err) {
    console.error(`new-app: ${err.message}`);
    process.exit(1);
  }
}
