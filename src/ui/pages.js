/**
 * Server-rendered HTML shells. All behaviour lives in /assets/client.js;
 * each page only embeds a data-only app description as JSON (no inline
 * script execution, so a strict CSP applies). App-agnostic.
 */

import { publicView } from '../registry.js';
import { PROFILE_FIELDS } from '../lifecycle.js';

const esc = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

// JSON safe to place inside <script type="application/json">.
const embed = (data) => JSON.stringify(data).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');

function shell({ title, description, body, registry, activeRoute = null, opts = {} }) {
  const suffix = opts.linkSuffix ?? '';
  const nav = registry.list().map((a) =>
    `<a href="/${esc(a.route)}${suffix}"${a.route === activeRoute ? ' aria-current="page"' : ''}>${esc(a.icon)} ${esc(a.title)}</a>`).join('');
  const modeLabel = opts.publicDemo ? 'Browser demo · rules, no AI' : 'Local server';
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="${esc(description)}">
<title>${esc(title)}</title>
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='.9em' font-size='90'%3E%F0%9F%92%80%3C/text%3E%3C/svg%3E">
<link rel="stylesheet" href="/assets/styles.css">
${opts.publicDemo ? '<script type="module" src="/assets/public-adapter.js"></script>\n' : ''}<script type="module" src="/assets/client.js"></script>
</head>
<body>
<a class="sr-only" href="#main">Skip to content</a>
<header class="topbar">
  <a class="brand" href="/"><span class="brand-mark" aria-hidden="true">💀</span> Skeleton Crew <small>AI</small></a>
  <nav class="appnav" aria-label="Apps">${nav}</nav>
  <span class="mode-pill" id="mode-pill" data-mode="${opts.publicDemo ? 'public' : 'local'}">${modeLabel}</span>
</header>
${body}
</body>
</html>`;
}

export function landingPage(registry, opts = {}) {
  const suffix = opts.linkSuffix ?? '';
  const cards = registry.list().map((a) => `
    <a class="card app-card" href="/${esc(a.route)}${suffix}">
      <span class="icon" aria-hidden="true">${esc(a.icon)}</span>
      <h2>${esc(a.title)}</h2>
      <p>${esc(a.tagline)}</p>
      <span class="steps">${a.steps.map((s) => esc(s.label)).join(' → ')} → you review</span>
      <span class="go">Open ${esc(a.title)} →</span>
    </a>`).join('');
  const body = `<main id="main" class="landing">
  <div class="eyebrow">Kiroween 2026 · Skeleton Crew</div>
  <h1>One lean skeleton. A crew for every small-business inbox.</h1>
  <p class="lead">Each app is a folder with a manifest: a few specialist steps, a schema for every output and a view. The shared core runs the steps, validates every output, records a trace and stops for your approval. It never sends, books or charges anything by itself.</p>
  <section class="apps" aria-label="Apps built on the skeleton">${cards}</section>
  <section class="how" aria-label="How it works">
    <div><b>1 · Request</b><span>A customer message or job request, in English or Turkish.</span></div>
    <div><b>2 · Specialist steps</b><span>Rules offline, or a free local model through Ollama. Same schema either way.</span></div>
    <div><b>3 · Validated trace</b><span>Each step's output is checked; an invalid output fails the run instead of producing a half-finished draft.</span></div>
    <div><b>4 · Human review</b><span>Edit, approve or reject. The decision is versioned and saved to history.</span></div>
  </section>
  <footer class="foot">
    ${opts.publicDemo
      ? '<p><strong>This public demo runs the deterministic rules in your browser.</strong> No AI model or server is involved and history stays on this device.</p>'
      : ''}
    <p>Add your own app: <code>npm run new-app my-app "My App"</code>. MIT licensed · <a href="https://github.com/Tolgahanozkan6/skeleton-crew-ai">source on GitHub</a>. Independent hackathon project.</p>
  </footer>
</main>`;
  return shell({ title: 'Skeleton Crew AI — one skeleton, many small-business apps', description: 'Lean starter for human-reviewed small-business workflow apps.', body, registry, opts });
}

export function appPage(app, registry, opts = {}) {
  const profileFields = Object.entries(PROFILE_FIELDS).map(([key, label]) => `
      <div><label for="profile-${key}">${esc(label)}</label>${key === 'policies'
        ? `<textarea id="profile-${key}" data-profile="${key}" maxlength="600" placeholder="e.g. Returns accepted within 14 days with receipt."></textarea>`
        : `<input type="text" id="profile-${key}" data-profile="${key}" maxlength="600">`}</div>`).join('');
  const config = { app: publicView(app), publicDemo: !!opts.publicDemo };
  const body = `<main id="main" class="wrap">
  <script type="application/json" id="app-config">${embed(config)}</script>
  <section class="hero">
    <h1>${esc(app.icon)} ${esc(app.title)}</h1>
    <p>${esc(app.tagline)}</p>
  </section>
  <div class="grid">
    <div class="stack">
      <form class="card" id="run-form" novalidate>
        <label for="request-input">${esc(app.inputLabel)}</label>
        <textarea id="request-input" maxlength="4000" required aria-describedby="request-meta" placeholder="${esc(app.placeholder)}"></textarea>
        <div class="field-meta" id="request-meta"><span id="request-error" class="error-text" role="alert"></span><span id="char-count">0 / 4000</span></div>
        <div class="samples" aria-label="Sample requests">${app.samples.map((s, i) => `<button type="button" class="chip" data-sample="${i}" title="${esc(s)}">${esc(s)}</button>`).join('')}</div>
        <div class="actions">
          <button type="submit" class="btn btn-primary" id="submit-btn">Run the crew</button>
          <span class="kbd">⌘/Ctrl + Enter</span>
        </div>
        <p class="hint" id="run-status" aria-live="polite"></p>
      </form>
      <details class="card profile" id="profile">
        <summary>Business profile <span class="meta" id="profile-state">not set</span></summary>
        <p class="hint">Shared by every app on this device. Steps use it as owner-provided facts (name, policy, hours, area); customer text is never trusted this way.</p>
        <div class="profile-grid">${profileFields}</div>
        <div class="actions"><button type="button" class="btn btn-ghost" id="profile-clear">Clear profile</button><span class="meta" id="profile-saved" aria-live="polite"></span></div>
      </details>
      <section class="card" aria-labelledby="history-title">
        <div class="card-head"><h2 id="history-title">History</h2><button type="button" class="btn btn-ghost" id="refresh-btn">Refresh</button></div>
        <ul class="history" id="history-list"></ul>
      </section>
    </div>
    <section class="card" id="result" aria-live="polite" aria-labelledby="result-title">
      <div class="card-head"><h2 id="result-title">Crew output</h2><span class="badge" id="run-badge" hidden></span></div>
      <ol class="crew" id="crew" aria-label="Specialist steps"></ol>
      <div id="result-body"><div class="empty"><span class="ghost" aria-hidden="true">👻</span>Pick a sample or write a request, then run the crew.</div></div>
    </section>
  </div>
</main>`;
  return shell({ title: `${app.title} — Skeleton Crew AI`, description: app.tagline, body, registry, activeRoute: app.route, opts });
}
