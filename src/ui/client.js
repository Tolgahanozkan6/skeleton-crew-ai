// Skeleton Crew AI — one browser client for every registered app.
// Rendering is driven by the app's data-only view config. Untrusted text
// (customer input, model output) is only ever assigned via textContent/value.

const configEl = document.getElementById('app-config');
if (configEl) init(JSON.parse(configEl.textContent));
else initModePill();

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === null || v === false) continue;
    if (k === 'text') node.textContent = v;
    else if (k === 'class') node.className = v;
    else if (k.startsWith('on')) node.addEventListener(k.slice(2), v);
    else node.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children) if (c) node.append(c);
  return node;
}

const PROFILE_KEY = 'skeleton-crew-profile-v1';
function readProfile() {
  try { return JSON.parse(localStorage.getItem(PROFILE_KEY) || '{}') || {}; } catch { return {}; }
}
function writeProfile(p) {
  try { localStorage.setItem(PROFILE_KEY, JSON.stringify(p)); return true; } catch { return false; }
}

async function api(path, options) {
  const res = await fetch(path, options);
  let data = null;
  try { data = await res.json(); } catch { /* empty body */ }
  if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`);
  return data;
}

async function initModePill() {
  const pill = document.getElementById('mode-pill');
  if (!pill) return null;
  try {
    const info = await api('/api/apps');
    if (info.mode === 'live') { pill.dataset.mode = 'live'; pill.textContent = 'Local AI · Ollama'; }
    else if (info.mode === 'public') { pill.dataset.mode = 'public'; pill.textContent = 'Browser demo · rules, no AI'; }
    else { pill.dataset.mode = 'offline'; pill.textContent = 'Offline rules · no AI'; }
    return info.mode;
  } catch { return null; }
}

function init({ app }) {
  const $ = (id) => document.getElementById(id);
  const form = $('run-form'), input = $('request-input'), count = $('char-count');
  const reqErr = $('request-error'), runStatus = $('run-status'), submit = $('submit-btn');
  const crew = $('crew'), body = $('result-body'), badge = $('run-badge');
  const historyList = $('history-list');
  let current = null;
  let serverMode = 'offline-demo';
  initModePill().then((m) => { if (m) serverMode = m; });

  // ── samples + input ────────────────────────────────
  form.querySelectorAll('[data-sample]').forEach((b) => b.addEventListener('click', () => {
    input.value = app.samples[Number(b.dataset.sample)];
    input.dispatchEvent(new Event('input'));
    input.focus();
  }));
  input.addEventListener('input', () => { count.textContent = `${input.value.length} / 4000`; reqErr.textContent = ''; });
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) form.requestSubmit(); });

  // ── business profile ───────────────────────────────
  const profileInputs = [...document.querySelectorAll('[data-profile]')];
  const profileState = $('profile-state'), profileSaved = $('profile-saved');
  function loadProfileForm() {
    const p = readProfile();
    for (const i of profileInputs) i.value = typeof p[i.dataset.profile] === 'string' ? p[i.dataset.profile] : '';
    updateProfileState();
  }
  function currentProfile() {
    const p = {};
    for (const i of profileInputs) if (i.value.trim()) p[i.dataset.profile] = i.value.trim().slice(0, 600);
    return p;
  }
  function updateProfileState() {
    const n = Object.keys(currentProfile()).length;
    profileState.textContent = n ? `${n} field${n > 1 ? 's' : ''} set` : 'not set';
  }
  let saveTimer;
  for (const i of profileInputs) i.addEventListener('input', () => {
    updateProfileState();
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => { profileSaved.textContent = writeProfile(currentProfile()) ? 'Saved on this device' : 'Could not save (storage unavailable)'; }, 400);
  });
  $('profile-clear').addEventListener('click', () => { writeProfile({}); loadProfileForm(); profileSaved.textContent = 'Cleared'; });
  loadProfileForm();

  // ── crew timeline ──────────────────────────────────
  function renderCrew(trace, runningIndex = -1) {
    crew.replaceChildren(...app.steps.map((s, i) => {
      const t = trace?.find((x) => x.agent === s.name);
      const state = t ? t.status : i === runningIndex ? 'running' : 'pending';
      const what = t ? (t.status === 'failed' ? 'failed' : `done${Number.isFinite(t.durationMs) ? ` · ${formatMs(t.durationMs)}` : ''}`)
        : state === 'running' ? 'working…' : 'waiting';
      return el('li', { 'data-state': state },
        el('span', { class: 'who' }, el('span', { class: 'dot', 'aria-hidden': 'true' }), el('span', { text: `${i + 1}. ${s.label}` })),
        el('span', { class: 'what', text: what }));
    }));
  }
  renderCrew(null);

  function formatMs(ms) { return ms < 1000 ? `${ms} ms` : `${(ms / 1000).toFixed(1)} s`; }

  // ── run ────────────────────────────────────────────
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) { reqErr.textContent = 'Please enter a request.'; input.focus(); return; }
    if (text.length > 4000) { reqErr.textContent = 'Request must be 4,000 characters or fewer.'; input.focus(); return; }
    submit.disabled = true;
    const started = Date.now();
    let step = 0;
    renderCrew(null, 0);
    const live = serverMode === 'live';
    runStatus.textContent = live ? 'Running the crew on your local model — this can take up to a minute…' : 'Running the crew…';
    // Visual progress only while waiting for a slow local model; real per-step timings replace it.
    const ticker = live ? setInterval(() => {
      const secs = Math.round((Date.now() - started) / 1000);
      runStatus.textContent = `Running the crew on your local model… ${secs}s elapsed`;
      if (secs % 15 === 14 && step < app.steps.length - 1) renderCrew(null, ++step);
    }, 1000) : null;
    try {
      const profile = currentProfile();
      const run = await api('/api/runs', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appId: app.id, request: text, ...(Object.keys(profile).length ? { profile } : {}) }),
      });
      current = run;
      render(run);
      runStatus.textContent = run.status === 'failed' ? '' : `Finished in ${formatMs(Date.now() - started)}. Review the output below.`;
      loadHistory();
      if (window.matchMedia('(max-width: 880px)').matches) $('result').scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (err) {
      renderCrew(null);
      runStatus.textContent = '';
      reqErr.textContent = err.message;
    } finally {
      clearInterval(ticker);
      submit.disabled = false;
    }
  });

  // ── render result ──────────────────────────────────
  function render(run) {
    renderCrew(run.trace);
    badge.hidden = false;
    badge.dataset.status = run.status;
    badge.textContent = { awaiting_human_review: 'Awaiting your review', approved: 'Approved', rejected: 'Rejected', failed: 'Failed' }[run.status] || run.status;

    const parts = [];
    parts.push(el('p', { class: 'meta', text: `${run.mode === 'live' ? 'Local AI (Ollama)' : 'Deterministic rules'} · ${new Date(run.createdAt).toLocaleString()}${run.profileUsed ? ' · business profile used' : ''}` }));
    if (run.input) parts.push(section('Request', el('p', { class: 'prose', text: run.input })));

    if (run.status === 'failed') {
      parts.push(el('div', { class: 'alert', 'data-tone': 'bad', role: 'alert', text: `${run.error || 'The workflow failed.'} No draft was produced, so there is nothing to approve.` }));
      body.replaceChildren(...parts);
      return;
    }

    let editor = null;
    for (const s of app.view) {
      const out = run.outputs?.[s.step] || {};
      if (s.type === 'fields') {
        parts.push(section(s.title, el('div', { class: 'kv' }, ...s.fields.map(([f, label]) =>
          el('span', { class: 'tag', 'data-tone': out[f] === 'high' ? 'high' : null }, el('span', { text: label }), el('b', { text: String(out[f] ?? '—') }))))));
      } else if (s.type === 'text') {
        parts.push(section(s.title, el('p', { class: 'prose', text: String(out[s.field] ?? '') })));
      } else if (s.type === 'list') {
        const items = Array.isArray(out[s.field]) ? out[s.field] : [];
        if (!items.length && s.hideEmpty) continue;
        const list = s.checklist
          ? el('ul', { class: 'checks' }, ...items.map((x) => el('li', {}, el('label', {}, el('input', { type: 'checkbox' }), el('span', { text: x })))))
          : el('ul', { class: 'list' }, ...items.map((x) => el('li', { text: x })));
        parts.push(section(s.title, items.length ? list : el('p', { class: 'meta', text: 'None' })));
      } else if (s.type === 'editable') {
        const value = run.review?.editedDraft ?? out[s.field] ?? '';
        editor = el('textarea', { id: 'editable-field', 'aria-label': s.title, readonly: run.status !== 'awaiting_human_review' });
        editor.value = value;
        const copy = el('button', { type: 'button', class: 'btn btn-ghost btn-sm', text: 'Copy', onclick: async () => {
          try { await navigator.clipboard.writeText(editor.value); copy.textContent = 'Copied'; }
          catch { editor.select(); copy.textContent = 'Press ⌘/Ctrl+C'; }
          setTimeout(() => { copy.textContent = 'Copy'; }, 1500);
        } });
        const h = section(s.title, editor, s.hint && run.status === 'awaiting_human_review' ? s.hint : run.review?.editedDraft != null ? 'Saved with your decision' : null);
        h.classList.add('editable');
        h.querySelector('h3').append(copy);
        parts.push(h);
        const grow = () => { editor.style.height = 'auto'; editor.style.height = `${Math.min(editor.scrollHeight + 4, 520)}px`; };
        editor.addEventListener('input', grow);
        requestAnimationFrame(grow);
      }
    }

    const msg = el('p', { class: 'notice', 'aria-live': 'polite' });
    if (run.status === 'awaiting_human_review') {
      const approve = el('button', { type: 'button', class: 'btn btn-ok', text: app.approveLabel });
      const reject = el('button', { type: 'button', class: 'btn btn-bad', text: 'Reject' });
      const decide = async (decision) => {
        approve.disabled = reject.disabled = true;
        try {
          const updated = await api(`/api/runs/${encodeURIComponent(run.id)}/review`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ decision, editedDraft: editor ? editor.value : null, expectedVersion: run.version }),
          });
          current = updated;
          render(updated);
          loadHistory();
        } catch (err) {
          msg.textContent = err.message;
          approve.disabled = reject.disabled = false;
        }
      };
      approve.addEventListener('click', () => decide('approved'));
      reject.addEventListener('click', () => decide('rejected'));
      parts.push(el('div', { class: 'reviewbar' }, el('p', { text: app.notice }), el('div', { class: 'actions' }, approve, reject), msg));
    } else {
      const when = run.review?.createdAt ? new Date(run.review.createdAt).toLocaleString() : '';
      parts.push(el('div', { class: 'alert', 'data-tone': run.status === 'approved' ? 'ok' : 'bad',
        text: run.status === 'approved'
          ? `Approved ${when}. Recorded only — nothing was sent, booked or charged.`
          : `Rejected ${when}. Nothing was sent.` }));
    }
    body.replaceChildren(...parts);
  }

  function section(title, content, hint) {
    return el('div', { class: 'section' }, el('h3', {}, el('span', { text: title }), hint ? el('small', { text: hint }) : null), content);
  }

  // ── history ────────────────────────────────────────
  async function loadHistory() {
    try {
      const runs = await api(`/api/runs?appId=${encodeURIComponent(app.id)}`);
      const mine = (Array.isArray(runs) ? runs : []).filter((r) => r.appId === app.id)
        .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))).slice(0, 25);
      if (!mine.length) { historyList.replaceChildren(el('li', { class: 'meta', text: `No ${app.title} runs yet.` })); return; }
      historyList.replaceChildren(...mine.map((r) => el('li', {},
        el('button', { type: 'button', 'aria-current': current?.id === r.id ? 'true' : null, onclick: () => { current = r; render(r); $('result').scrollIntoView({ behavior: 'smooth', block: 'start' }); } },
          el('span', { class: 'preview', text: r.input || r.id.slice(0, 8) }),
          el('span', { class: 'badge', 'data-status': r.status, text: r.status === 'awaiting_human_review' ? 'review' : r.status }),
          el('span', { class: 'when', text: `${new Date(r.createdAt).toLocaleString()} · ${r.mode === 'live' ? 'local AI' : 'rules'}` })))));
    } catch (err) {
      historyList.replaceChildren(el('li', { class: 'alert', 'data-tone': 'bad', text: `History unavailable: ${err.message}` }));
    }
  }
  $('refresh-btn').addEventListener('click', loadHistory);
  loadHistory();
}
