// Browser-only API shim for the static public demo. It answers the same
// /api/* calls as src/server.js using the SAME registry, runtime and review
// lifecycle modules, so the two cannot drift. No model or network calls;
// runs stay in this browser's localStorage.
import { registry } from '/apps/index.js';
import { runOffline } from '/src/runtime.js';
import { validateRequest, validateAppId } from '/src/contracts.js';
import { makeRun, applyReview, validateProfile, isValidStoredRun } from '/src/lifecycle.js';
import { NotFoundError, ConflictError } from '/src/errors.js';

const KEY = 'skeleton-crew-public-demo-v2';
const nativeFetch = window.fetch.bind(window);
const reply = (status, data) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

function load() {
  let raw;
  try { raw = localStorage.getItem(KEY); } catch { throw new Error('Browser storage is unavailable (private mode or blocked site data).'); }
  const data = JSON.parse(raw || '[]');
  if (!Array.isArray(data)) throw new Error('Stored demo history is invalid. Clear this site\'s data to reset.');
  return data.filter((r) => isValidStoredRun(r, registry.has));
}
function save(runs) {
  try { localStorage.setItem(KEY, JSON.stringify(runs.slice(-200))); }
  catch { throw new Error('Could not save to browser storage (quota full or blocked).'); }
}

function statusOf(err) {
  if (err instanceof NotFoundError) return 404;
  if (err instanceof ConflictError) return 409;
  if (err instanceof TypeError || err instanceof RangeError || err instanceof SyntaxError) return 400;
  return 500;
}

window.fetch = async (input, options = {}) => {
  const url = new URL(typeof input === 'string' ? input : input.url, location.href);
  if (url.origin !== location.origin || !url.pathname.startsWith('/api/')) return nativeFetch(input, options);
  const method = (options.method || 'GET').toUpperCase();
  try {
    if (url.pathname === '/api/apps') return reply(200, { mode: 'public', apps: registry.list().map((a) => ({ id: a.id, route: a.route, title: a.title })) });
    const runs = load();
    if (url.pathname === '/api/runs' && method === 'GET') {
      const appId = url.searchParams.get('appId');
      return reply(200, appId ? runs.filter((r) => r.appId === appId) : runs);
    }
    if (url.pathname === '/api/runs' && method === 'POST') {
      const body = JSON.parse(options.body);
      if (!body || typeof body !== 'object' || Array.isArray(body)) throw new TypeError('Expected a JSON object');
      const appId = validateAppId(body.appId, registry.ids);
      const text = validateRequest(body.request);
      if (body.mode && body.mode !== 'offline-demo') return reply(400, { error: 'The public demo runs rules only. Run the source locally for free local AI.' });
      const profile = validateProfile(body.profile);
      const result = runOffline(registry.get(appId), text, { profile });
      const run = makeRun({ appId, mode: 'offline-demo', outputs: result.outputs, trace: result.trace, input: text, profileUsed: !!profile });
      runs.push(run); save(runs);
      return reply(201, run);
    }
    const match = url.pathname.match(/^\/api\/runs\/([^/]+)(\/review)?$/);
    if (match) {
      const index = runs.findIndex((r) => r.id === decodeURIComponent(match[1]));
      if (match[2] && method === 'POST') {
        const body = JSON.parse(options.body);
        if (index < 0) throw new NotFoundError('Run not found');
        runs[index] = applyReview(runs[index], body);
        save(runs);
        return reply(200, runs[index]);
      }
      if (!match[2] && method === 'GET') return index < 0 ? reply(404, { error: 'Run not found' }) : reply(200, runs[index]);
    }
    return reply(404, { error: 'Not found' });
  } catch (err) {
    const status = statusOf(err);
    return reply(status, { error: status === 500 ? 'Demo error' : err.message });
  }
};
