/**
 * Local HTTP server for Skeleton Crew AI. Binds to 127.0.0.1 only; no dependencies.
 * App-agnostic: every route is derived from the registry.
 *
 *   GET  /                    → landing page listing registered apps
 *   GET  /<app.route>         → manifest-driven app page
 *   GET  /assets/*            → shared UI assets (allow-listed)
 *   GET  /api/apps            → data-only app descriptions + server mode
 *   POST /api/runs            → { appId, request, mode?, profile? } → run (201)
 *   GET  /api/runs[?appId=]   → runs
 *   GET  /api/runs/:id        → run | 404
 *   POST /api/runs/:id/review → { decision, editedDraft?, expectedVersion } → run
 *
 * Status codes: 400 malformed input, 404 unknown run/route, 409 stale or
 * repeated decision, 413 oversized body. Internal error text is never returned.
 */

import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { registry as defaultRegistry } from '../apps/index.js';
import { MemoryStore, JsonStore } from './store.js';
import { runOffline } from './runtime.js';
import { executeLiveRun } from './live-workflow.js';
import { validateRequest, validateAppId, validateMode } from './contracts.js';
import { validateProfile } from './lifecycle.js';
import { NotFoundError, ConflictError, ValidationError, PayloadTooLargeError } from './errors.js';
import { appPage, landingPage } from './ui/pages.js';

const MAX_BODY = 16_384; // bytes

const ASSETS = {
  '/assets/styles.css': ['styles.css', 'text/css; charset=utf-8'],
  '/assets/client.js': ['client.js', 'text/javascript; charset=utf-8'],
};
const assetCache = new Map();
function asset(name) {
  if (!assetCache.has(name)) assetCache.set(name, readFileSync(new URL(`./ui/${name}`, import.meta.url)));
  return assetCache.get(name);
}

// ── body + responses ──────────────────────────────────────────────────────────

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    let tooLarge = false;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY) { tooLarge = true; return; } // keep draining so we can still answer
      chunks.push(chunk);
    });
    req.on('end', () => (tooLarge ? reject(new PayloadTooLargeError()) : resolve(Buffer.concat(chunks).toString('utf8'))));
    req.on('error', reject);
  });
}

async function readJson(req) {
  const raw = await readBody(req);
  try { return JSON.parse(raw); } catch { throw new ValidationError('Invalid JSON'); }
}

function json(res, status, data) {
  const body = JSON.stringify(data, null, 2);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'X-Content-Type-Options': 'nosniff',
    'Cache-Control': 'no-store',
  });
  res.end(body);
}

const CSP = "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'";

function send(res, body, type, extra = {}) {
  res.writeHead(200, {
    'Content-Type': type,
    'Content-Length': Buffer.byteLength(body),
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
    ...extra,
  });
  res.end(body);
}

function errorStatus(err) {
  if (err instanceof PayloadTooLargeError) return 413;
  if (err instanceof NotFoundError) return 404;
  if (err instanceof ConflictError || err instanceof RangeError) return err instanceof ConflictError ? 409 : 400;
  if (err instanceof TypeError) return 400;
  return 500;
}

function sendError(res, err) {
  const status = errorStatus(err);
  if (status === 500) {
    console.error('Unhandled server error:', err?.name);
    return json(res, 500, { error: 'Internal server error' });
  }
  return json(res, status, { error: status === 404 ? 'Run not found' : err.message });
}

/** Blocks cross-site browser POSTs to this loopback server (CSRF). */
function sameOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return true; // non-browser clients (curl, tests)
  try { return new URL(origin).host === req.headers.host; } catch { return false; }
}

// ── handler factory ───────────────────────────────────────────────────────────

export function createHandler({ store = new MemoryStore(), registry = defaultRegistry, live = executeLiveRun } = {}) {
  async function createRun(req, res) {
    const body = await readJson(req);
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new ValidationError('Expected a JSON object');
    const appId = validateAppId(body.appId, registry.ids);
    const text = validateRequest(body.request);
    const mode = validateMode(body.mode ?? process.env.CREW_MODE ?? 'offline-demo');
    const profile = validateProfile(body.profile);
    const app = registry.get(appId);
    const ctx = { profile };
    const result = mode === 'live' ? await live(app, text, undefined, ctx) : runOffline(app, text, ctx);
    const run = store.createRun(appId, result.mode, result.outputs, result.trace, { input: text, profileUsed: !!profile });
    return json(res, 201, run);
  }

  async function review(req, res, id) {
    const body = await readJson(req);
    if (!store.getRun(id)) throw new NotFoundError();
    return json(res, 200, store.saveReview(id, body));
  }

  return async function handleRequest(req, res) {
    const url = new URL(req.url, 'http://localhost');
    const path = url.pathname.length > 1 ? url.pathname.replace(/\/+$/, '') : url.pathname;
    const method = req.method;
    try {
      if (method === 'POST' && !sameOrigin(req)) return json(res, 403, { error: 'Cross-origin request blocked' });

      if (method === 'GET' && path === '/') return send(res, landingPage(registry), 'text/html; charset=utf-8', { 'Content-Security-Policy': CSP });
      if (method === 'GET' && ASSETS[path]) {
        const [name, type] = ASSETS[path];
        return send(res, asset(name), type, { 'Cache-Control': 'no-cache' });
      }
      const app = method === 'GET' ? registry.byRoute(path.slice(1)) : undefined;
      if (app) return send(res, appPage(app, registry), 'text/html; charset=utf-8', { 'Content-Security-Policy': CSP });

      if (path === '/api/apps' && method === 'GET') {
        return json(res, 200, { mode: process.env.CREW_MODE === 'live' ? 'live' : 'offline-demo', apps: registry.list().map((a) => ({ id: a.id, route: a.route, title: a.title })) });
      }
      if (path === '/api/runs' && method === 'GET') {
        const appId = url.searchParams.get('appId');
        if (appId !== null) validateAppId(appId, registry.ids);
        return json(res, 200, store.listRuns(appId ? { appId } : {}));
      }
      if (path === '/api/runs' && method === 'POST') return await createRun(req, res);

      const runMatch = path.match(/^\/api\/runs\/([^/]+)$/);
      if (runMatch && method === 'GET') {
        const run = store.getRun(runMatch[1]);
        return run ? json(res, 200, run) : json(res, 404, { error: 'Run not found' });
      }
      const reviewMatch = path.match(/^\/api\/runs\/([^/]+)\/review$/);
      if (reviewMatch && method === 'POST') return await review(req, res, reviewMatch[1]);

      return json(res, 404, { error: 'Not found' });
    } catch (err) {
      if (res.headersSent) return undefined;
      return sendError(res, err);
    }
  };
}

// Default handler (in-memory store) — used by tests and embedding.
export const handleRequest = createHandler();

// ── entry point ───────────────────────────────────────────────────────────────

export function startServer(port = 3000, options = {}) {
  const registry = options.registry ?? defaultRegistry;
  const store = options.store ?? (port !== 0
    ? new JsonStore(process.env.CREW_DATA_FILE || 'data/runs.json', { isKnownApp: registry.has })
    : new MemoryStore());
  const handler = createHandler({ store, registry });
  const server = createServer((req, res) => {
    handler(req, res).catch(() => { if (!res.headersSent) json(res, 500, { error: 'Internal server error' }); });
  });
  server.listen(port, '127.0.0.1', () => {
    const { port: actual } = server.address();
    console.log(`Skeleton Crew AI running at http://127.0.0.1:${actual} (${process.env.CREW_MODE === 'live' ? 'live AI' : 'offline-demo'} mode)`);
    for (const app of registry.list()) console.log(`  ${app.title.padEnd(14)} → http://127.0.0.1:${actual}/${app.route}`);
  });
  return server;
}
