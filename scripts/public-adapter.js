// Browser-only deterministic demo API. No cloud/model calls; records stay in this browser.
(() => {
 const key = 'skeleton-crew-public-demo-v1';
 const originalFetch = window.fetch.bind(window);
 const reply = (status, data) => Promise.resolve(new Response(JSON.stringify(data), {status, headers:{'Content-Type':'application/json'}}));
 function load() {
  const data = JSON.parse(localStorage.getItem(key) || '[]');
  if (!Array.isArray(data)) throw new Error('Invalid browser history. Clear this site’s stored data to reset.');
  return data;
 }
 function save(runs) { localStorage.setItem(key, JSON.stringify(runs)); }
 window.fetch = async (url, options = {}) => {
  if (typeof url !== 'string' || !url.startsWith('/api/runs')) return originalFetch(url, options);
  try {
   const runs = load();
   const method = options.method || 'GET';
   if (url === '/api/runs' && method === 'GET') return reply(200, runs);
   if (url === '/api/runs' && method === 'POST') {
    const body = JSON.parse(options.body);
    const request = validateRequest(body.request);
    validateAppId(body.appId);
    if (body.mode && body.mode !== 'offline-demo') return reply(400,{error:'Public demo supports offline-demo only. Run the source locally for AI.'});
    const result = body.appId === 'support-desk' ? runSupport(request) : runPlanner(request);
    const run = { ...result, id: crypto.randomUUID(), appId: body.appId, version: 1, createdAt: new Date().toISOString(), review: null };
    runs.push(run); save(runs); return reply(201, run);
   }
   const parts = url.split('/');
   const index = runs.findIndex(x => x.id === parts[3]);
   if (index < 0) return reply(404,{error:'Run not found'});
   const run = runs[index];
   if (parts.length === 4 && method === 'GET') return reply(200,run);
   if (parts[4] === 'review' && method === 'POST') {
    const body = JSON.parse(options.body);
    if (run.status !== 'awaiting_human_review' || body.expectedVersion !== run.version) return reply(409,{error:'Run already reviewed or version is stale'});
    if (!['approved','rejected'].includes(body.decision)) return reply(400,{error:'Unknown decision'});
    run.status = body.decision; run.version++;
    run.review = {decision:body.decision, editedDraft:body.editedDraft ?? null, version:run.version, createdAt:new Date().toISOString()};
    save(runs); return reply(200,run);
   }
   return reply(404,{error:'Not found'});
  } catch (error) { return reply(400,{error:error.message || 'Demo storage unavailable'}); }
 };
})();
