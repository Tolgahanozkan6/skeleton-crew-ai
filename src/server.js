/**
 * Local HTTP server for Skeleton Crew AI (T4).
 * Binds to 127.0.0.1 only. No external dependencies.
 *
 * Routes:
 *   GET  /                    → redirect to /support
 *   GET  /support             → Support Desk UI
 *   GET  /planner             → Job Planner UI
 *   POST /api/runs            → { appId, request, mode? } → run object
 *   GET  /api/runs            → all runs (array)
 *   GET  /api/runs/:id        → single run
 *   POST /api/runs/:id/review → { decision, editedDraft?, expectedVersion } → updated run
 */

import { createServer } from 'node:http';
import { runSupport } from '../apps/support-desk/workflow.js';
import { runPlanner } from '../apps/job-planner/workflow.js';
import { MemoryStore } from './store.js';
import { validateRequest, validateAppId } from './contracts.js';
import { supportPage } from './ui/support-page.js';
import { plannerPage } from './ui/planner-page.js';

const MAX_BODY = 16_384; // 16 KB request body limit
const store = new MemoryStore();

// ── request body reader ───────────────────────────────────────────────────────

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    let tooLarge = false;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY) {
        tooLarge = true;
        // Drain remaining data so the connection stays open for a proper response
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      if (tooLarge) {
        return reject(Object.assign(new Error('Request body too large'), { status: 413 }));
      }
      resolve(Buffer.concat(chunks).toString('utf8'));
    });
    req.on('error', reject);
  });
}

// ── response helpers ──────────────────────────────────────────────────────────

function json(res, status, data) {
  const body = JSON.stringify(data, null, 2);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

function html(res, body) {
  res.writeHead(200, {
    'Content-Type': 'text/html; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'X-Content-Type-Options': 'nosniff',
  });
  res.end(body);
}

function redirect(res, location) {
  res.writeHead(302, { Location: location });
  res.end();
}

// ── run helpers ───────────────────────────────────────────────────────────────

function executeRun(appId, request) {
  if (appId === 'support-desk') return runSupport(request);
  if (appId === 'job-planner') return runPlanner(request);
  throw new TypeError(`Unknown appId: ${appId}`);
}

// ── API handlers ──────────────────────────────────────────────────────────────

async function handleCreateRun(req, res) {
  let body;
  try {
    body = JSON.parse(await readBody(req));
  } catch (err) {
    return json(res, 400, { error: err.status === 413 ? 'Request too large' : 'Invalid JSON' });
  }

  let appId, text;
  try {
    appId = validateAppId(body.appId);
    text = validateRequest(body.request);
  } catch (err) {
    return json(res, 400, { error: err.message });
  }

  const result = executeRun(appId, text);
  const run = store.createRun(appId, result.mode, result.outputs, result.trace);
  return json(res, 201, run);
}

async function handleSaveReview(req, res, id) {
  let body;
  try {
    body = JSON.parse(await readBody(req));
  } catch {
    return json(res, 400, { error: 'Invalid JSON' });
  }

  try {
    const updated = store.saveReview(id, {
      decision: body.decision,
      editedDraft: body.editedDraft,
      expectedVersion: body.expectedVersion,
    });
    return json(res, 200, updated);
  } catch (err) {
    const status = err instanceof RangeError ? 409 : err instanceof TypeError ? 404 : 400;
    return json(res, status, { error: err.message });
  }
}

// ── router ────────────────────────────────────────────────────────────────────

export async function handleRequest(req, res) {
  const url = new URL(req.url, 'http://localhost');
  const path = url.pathname;
  const method = req.method;

  if (path === '/') return redirect(res, '/support');

  if (path === '/support' && method === 'GET') return html(res, supportPage());
  if (path === '/planner' && method === 'GET') return html(res, plannerPage());

  if (path === '/api/runs' && method === 'GET') {
    return json(res, 200, store.listRuns());
  }

  if (path === '/api/runs' && method === 'POST') {
    return handleCreateRun(req, res);
  }

  const runMatch = path.match(/^\/api\/runs\/([^/]+)$/);
  if (runMatch && method === 'GET') {
    const run = store.getRun(runMatch[1]);
    return run ? json(res, 200, run) : json(res, 404, { error: 'Run not found' });
  }

  const reviewMatch = path.match(/^\/api\/runs\/([^/]+)\/review$/);
  if (reviewMatch && method === 'POST') {
    return handleSaveReview(req, res, reviewMatch[1]);
  }

  return json(res, 404, { error: 'Not found' });
}

// ── entry point ───────────────────────────────────────────────────────────────

export function startServer(port = 3000) {
  const server = createServer((req, res) => {
    handleRequest(req, res).catch((err) => {
      console.error('Unhandled server error:', err);
      if (!res.headersSent) json(res, 500, { error: 'Internal server error' });
    });
  });
  server.listen(port, '127.0.0.1', () => {
    console.log(`Skeleton Crew AI running at http://127.0.0.1:${port}`);
    console.log(`  Support Desk → http://127.0.0.1:${port}/support`);
    console.log(`  Job Planner  → http://127.0.0.1:${port}/planner`);
  });
  return server;
}
