import { pageShell } from './shared.js';

export function plannerPage() {
  const body = `
<h2>Job Planner</h2>
<p>Turn service requests into scoped work plans for owner review. Bookings and quotes require owner approval.</p>

<div class="card" id="run-form-card">
  <form id="run-form" novalidate>
    <label for="request-input">Job request</label>
    <textarea id="request-input" name="request" rows="4"
      maxlength="4000" required
      aria-describedby="char-count request-error"
      placeholder="Describe the job or service needed…"></textarea>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-top:0.25rem">
      <span id="request-error" role="alert" aria-live="polite" style="color:#dc3545;font-size:0.85rem"></span>
      <span id="char-count" style="font-size:0.8rem;color:#6c757d">0 / 4000</span>
    </div>
    <div style="margin-top:0.75rem;display:flex;gap:0.5rem;flex-wrap:wrap">
      <button type="submit" class="btn-primary" id="submit-btn">Plan this job</button>
      <button type="button" class="btn-primary" id="sample-btn" style="background:#6c757d;border-color:#6c757d">Load sample</button>
    </div>
  </form>
  <div id="status-msg" aria-live="polite" style="margin-top:0.5rem"></div>
</div>

<div class="card" id="result-card" hidden aria-live="polite">
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.75rem">
    <strong>Run result</strong>
    <span id="run-status-badge" class="status-badge"></span>
  </div>

  <section aria-label="Scope">
    <strong>Scope</strong>
    <dl style="margin:0.25rem 0 0.75rem;display:grid;grid-template-columns:max-content 1fr;gap:0.1rem 0.75rem">
      <dt>Service:</dt><dd id="scope-service" style="margin:0"></dd>
      <dt>Urgency:</dt><dd id="scope-urgency" style="margin:0"></dd>
    </dl>
  </section>

  <section aria-label="Missing facts" id="missing-section">
    <strong>Missing information</strong>
    <ul id="missing-list" style="margin:0.25rem 0 0.75rem;padding-left:1.25rem"></ul>
  </section>

  <section aria-label="Work plan tasks" style="margin-bottom:0.75rem">
    <strong>Provisional tasks</strong>
    <ul id="tasks-list" style="margin:0.25rem 0 0;padding-left:1.25rem"></ul>
    <p id="booking-note" style="margin:0.5rem 0 0;font-size:0.85rem;color:#6c757d"></p>
  </section>

  <section aria-label="Clarification questions" style="margin-bottom:0.75rem">
    <strong>Questions for the customer</strong>
    <ul id="questions-list" style="margin:0.25rem 0;padding-left:1.25rem"></ul>
    <p id="quote-note" style="margin:0.25rem 0 0;font-size:0.85rem;color:#6c757d"></p>
  </section>

  <section aria-label="Step trace" style="margin-bottom:0.75rem">
    <strong>Step trace</strong>
    <div id="trace-list" style="margin-top:0.25rem;display:flex;flex-direction:column;gap:0.15rem"></div>
  </section>

  <div id="review-section" style="display:flex;gap:0.5rem;flex-wrap:wrap">
    <button type="button" class="btn-success" id="approve-btn">Approve plan</button>
    <button type="button" class="btn-danger"  id="reject-btn">Reject</button>
  </div>
  <div id="review-msg" aria-live="polite" style="margin-top:0.5rem;font-size:0.9rem"></div>
</div>

<div class="card">
  <strong>History</strong>
  <div id="history-list" style="margin-top:0.5rem">
    <span style="color:#6c757d;font-size:0.85rem">No runs yet.</span>
  </div>
  <button type="button" id="refresh-btn" style="margin-top:0.5rem;background:none;border:1px solid #ced4da;border-radius:6px;padding:0.3rem 0.8rem;cursor:pointer;font-size:0.85rem">Refresh history</button>
</div>

<script>
(function () {
  const APP_ID = 'job-planner';
  const SAMPLES = [
    'Please repair our broken shop door at 14 High Street — it cannot close properly.',
    'We need some work done on our premises.',
    'Emergency — the roof is leaking urgently and we need someone ASAP.',
  ];
  let currentRun = null;
  let sampleIdx = 0;

  const form      = document.getElementById('run-form');
  const input     = document.getElementById('request-input');
  const charCount = document.getElementById('char-count');
  const statusMsg = document.getElementById('status-msg');
  const resultCard= document.getElementById('result-card');
  const sampleBtn = document.getElementById('sample-btn');
  const submitBtn = document.getElementById('submit-btn');
  const approvBtn = document.getElementById('approve-btn');
  const rejectBtn = document.getElementById('reject-btn');
  const reviewMsg = document.getElementById('review-msg');
  const refreshBtn= document.getElementById('refresh-btn');
  const reqErr    = document.getElementById('request-error');

  sampleBtn.addEventListener('click', () => {
    input.value = SAMPLES[sampleIdx % SAMPLES.length];
    sampleIdx++;
    input.dispatchEvent(new Event('input'));
  });

  input.addEventListener('input', () => {
    charCount.textContent = input.value.length + ' / 4000';
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    reqErr.textContent = '';
    const text = input.value.trim();
    if (!text) { reqErr.textContent = 'Please enter a job request.'; input.focus(); return; }
    if (text.length > 4000) { reqErr.textContent = 'Request must be 4,000 characters or fewer.'; return; }

    submitBtn.disabled = true;
    setStatus('Planning job…', '');
    resultCard.hidden = true;

    try {
      const res = await fetch('/api/runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appId: APP_ID, request: text }),
      });
      const run = await res.json();
      if (!res.ok) throw new Error(run.error || 'Server error');
      currentRun = run;
      renderResult(run);
      setStatus('', '');
      loadHistory();
    } catch (err) {
      setStatus('Error: ' + err.message, 'error');
    } finally {
      submitBtn.disabled = false;
    }
  });

  function setStatus(msg, cls) {
    statusMsg.textContent = msg;
    statusMsg.className = cls || '';
  }

  function renderResult(run) {
    resultCard.hidden = false;
    const badge = document.getElementById('run-status-badge');
    badge.textContent = run.mode + ' · ' + run.status.replace(/_/g, ' ');
    badge.className = 'status-badge status-' + run.status;

    const scope = run.outputs?.scope || {};
    document.getElementById('scope-service').textContent = scope.service || '—';
    document.getElementById('scope-urgency').textContent = scope.urgency || '—';

    const missing = scope.missingFacts || [];
    const missSec = document.getElementById('missing-section');
    missSec.hidden = missing.length === 0;
    const missList = document.getElementById('missing-list');
    missList.innerHTML = '';
    missing.forEach(f => { const li = document.createElement('li'); li.textContent = f; missList.appendChild(li); });

    const tasks = run.outputs?.planner?.tasks || [];
    const tl = document.getElementById('tasks-list');
    tl.innerHTML = '';
    tasks.forEach(t => { const li = document.createElement('li'); li.textContent = t; tl.appendChild(li); });
    document.getElementById('booking-note').textContent =
      'Booking confirmed: ' + (run.outputs?.planner?.bookingConfirmed ? 'Yes (owner approved)' : 'No — awaiting owner approval');

    const qs = run.outputs?.clarification?.questions || [];
    const ql = document.getElementById('questions-list');
    ql.innerHTML = '';
    qs.forEach(q => { const li = document.createElement('li'); li.textContent = q; ql.appendChild(li); });
    document.getElementById('quote-note').textContent =
      run.outputs?.clarification?.quote == null
        ? 'Quote: not set — owner must approve before sharing any figure.'
        : 'Quote: ' + run.outputs.clarification.quote;

    const trace = run.trace || [];
    const traceCont = document.getElementById('trace-list');
    traceCont.innerHTML = '';
    trace.forEach(t => {
      const d = document.createElement('div');
      d.className = 'trace-item' + (t.status === 'failed' ? ' failed' : '');
      d.textContent = t.agent + ': ' + t.status + (t.error ? ' — ' + t.error : '');
      traceCont.appendChild(d);
    });

    const reviewSection = document.getElementById('review-section');
    reviewSection.style.display = run.status === 'awaiting_human_review' ? 'flex' : 'none';
    reviewMsg.textContent = '';
  }

  async function doReview(decision) {
    if (!currentRun) return;
    approvBtn.disabled = true;
    rejectBtn.disabled = true;
    try {
      const res = await fetch('/api/runs/' + currentRun.id + '/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, expectedVersion: currentRun.version }),
      });
      const updated = await res.json();
      if (!res.ok) throw new Error(updated.error || 'Review failed');
      currentRun = updated;
      renderResult(updated);
      reviewMsg.textContent = decision === 'approved' ? 'Plan approved. No external action taken.' : 'Run rejected.';
      loadHistory();
    } catch (err) {
      reviewMsg.textContent = 'Error: ' + err.message;
    } finally {
      approvBtn.disabled = false;
      rejectBtn.disabled = false;
    }
  }

  approvBtn.addEventListener('click', () => doReview('approved'));
  rejectBtn.addEventListener('click', () => doReview('rejected'));

  async function loadHistory() {
    try {
      const res = await fetch('/api/runs');
      const runs = await res.json();
      const container = document.getElementById('history-list');
      const appRuns = Array.isArray(runs) ? runs.filter(r => r.appId === APP_ID) : [];
      if (appRuns.length === 0) {
        container.innerHTML = '<span style="color:#6c757d;font-size:0.85rem">No runs yet.</span>';
        return;
      }
      container.innerHTML = '';
      [...appRuns].reverse().forEach(r => {
        const row = document.createElement('div');
        row.className = 'history-row';
        const idSpan = document.createElement('code');
        idSpan.textContent = r.id.slice(0, 8);
        const statusSpan = document.createElement('span');
        statusSpan.className = 'status-badge status-' + r.status;
        statusSpan.textContent = r.status.replace(/_/g, ' ');
        const timeSpan = document.createElement('span');
        timeSpan.style.color = '#6c757d';
        timeSpan.textContent = new Date(r.createdAt).toLocaleTimeString();
        row.append(idSpan, statusSpan, timeSpan);
        container.appendChild(row);
      });
    } catch { /* ignore */ }
  }

  refreshBtn.addEventListener('click', loadHistory);
  loadHistory();
})();
</script>
`;
  return pageShell({ title: 'Job Planner', appId: 'job-planner', body });
}
