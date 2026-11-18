#!/usr/bin/env node
// Dependency-free MCP server (stdio, newline-delimited JSON-RPC 2.0).
// Lets Kiro (or any MCP client) use the skeleton as tools:
//   list_apps        → registered apps, their steps and schemas
//   run_workflow     → run an app on a request with the deterministic rules
//   validate_output  → check a JSON object against one step schema
//   scaffold_app     → create a new app folder and register it (writes files)
// Runs never execute external actions; results always await human review.
import { createInterface } from 'node:readline';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PROTOCOL = '2025-06-18';
const fresh = async (path) => import(`${pathToFileURL(resolve(root, path)).href}?t=${Date.now()}`);

const TOOLS = [
  {
    name: 'list_apps',
    description: 'List apps registered on the Skeleton Crew skeleton with their steps and output schemas.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'run_workflow',
    description: 'Run a registered app on a customer/job request using deterministic offline rules. Returns step outputs and trace; the result awaits human review and performs no external action.',
    inputSchema: {
      type: 'object',
      properties: {
        appId: { type: 'string', description: 'Registered app id, e.g. support-desk' },
        request: { type: 'string', description: 'Request text (1–4000 characters)' },
        profile: { type: 'object', description: 'Optional business profile: businessName, policies, hours, serviceArea, tone', additionalProperties: { type: 'string' } },
      },
      required: ['appId', 'request'],
      additionalProperties: false,
    },
  },
  {
    name: 'validate_output',
    description: 'Validate a JSON object against one app step schema (the same check model output must pass).',
    inputSchema: {
      type: 'object',
      properties: { appId: { type: 'string' }, step: { type: 'string' }, output: { type: 'object' } },
      required: ['appId', 'step', 'output'],
      additionalProperties: false,
    },
  },
  {
    name: 'scaffold_app',
    description: 'Create apps/<id> from the template and register it in apps/index.js. Writes files in this repository.',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'string', pattern: '^[a-z][a-z0-9-]{1,40}$' }, title: { type: 'string' }, route: { type: 'string' } },
      required: ['id', 'title'],
      additionalProperties: false,
    },
  },
];

async function callTool(name, args = {}) {
  const { registry } = await fresh('apps/index.js');
  if (name === 'list_apps') {
    return registry.list().map((a) => ({ id: a.id, route: a.route, title: a.title, tagline: a.tagline, steps: a.steps.map((s) => ({ name: s.name, label: s.label, schema: s.schema })) }));
  }
  if (name === 'run_workflow') {
    const { runOffline } = await fresh('src/runtime.js');
    const { validateAppId } = await fresh('src/contracts.js');
    const { validateProfile } = await fresh('src/lifecycle.js');
    const app = registry.get(validateAppId(args.appId, registry.ids));
    return { appId: app.id, ...runOffline(app, args.request, { profile: validateProfile(args.profile) }), note: 'Awaiting human review. Nothing was sent, booked or charged.' };
  }
  if (name === 'validate_output') {
    const { validateOutput } = await fresh('src/schema.js');
    const app = registry.get(args.appId);
    const step = app?.steps.find((s) => s.name === args.step);
    if (!step) throw new TypeError('Unknown app or step');
    try { validateOutput(step.name, step.schema, args.output); return { valid: true }; }
    catch (err) { return { valid: false, error: err.message }; }
  }
  if (name === 'scaffold_app') {
    const { scaffold } = await fresh('scripts/new-app.mjs');
    const dir = await scaffold({ id: args.id, title: args.title, route: args.route ?? args.id, root });
    return { created: dir, next: 'Edit workflow.js and manifest.js, then run npm test.' };
  }
  throw new TypeError(`Unknown tool: ${name}`);
}

async function handle(msg) {
  const { id, method, params } = msg;
  if (method === 'initialize') {
    return { protocolVersion: params?.protocolVersion ?? PROTOCOL, capabilities: { tools: {} }, serverInfo: { name: 'skeleton-crew', version: '0.2.0' } };
  }
  if (method === 'ping') return {};
  if (method === 'tools/list') return { tools: TOOLS };
  if (method === 'tools/call') {
    try {
      const result = await callTool(params?.name, params?.arguments);
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }], isError: false };
    } catch (err) {
      return { content: [{ type: 'text', text: err.message }], isError: true };
    }
  }
  if (id === undefined) return undefined; // notification (e.g. notifications/initialized)
  throw Object.assign(new Error(`Method not found: ${method}`), { code: -32601 });
}

const out = (obj) => process.stdout.write(JSON.stringify(obj) + '\n');
createInterface({ input: process.stdin }).on('line', async (line) => {
  if (!line.trim()) return;
  let msg;
  try { msg = JSON.parse(line); } catch { return out({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } }); }
  try {
    const result = await handle(msg);
    if (msg.id !== undefined && result !== undefined) out({ jsonrpc: '2.0', id: msg.id, result });
  } catch (err) {
    if (msg.id !== undefined) out({ jsonrpc: '2.0', id: msg.id, error: { code: err.code ?? -32603, message: err.message } });
  }
});
