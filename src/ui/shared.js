/**
 * Shared HTML helpers — safe text rendering only.
 * All user/model content is rendered via textContent or createTextNode,
 * never innerHTML, so untrusted text cannot inject markup.
 */

export function pageShell({ title, appId, navActive, body }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title} — Skeleton Crew AI</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    body { font-family: system-ui, sans-serif; margin: 0; background: #f8f9fa; color: #212529; }
    header { background: #1a1a2e; color: #fff; padding: 1rem 1.5rem; display: flex; align-items: center; gap: 1.5rem; }
    header h1 { margin: 0; font-size: 1.1rem; }
    nav a { color: #adb5bd; text-decoration: none; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.95rem; }
    nav a[aria-current="page"] { background: #e9ecef; color: #1a1a2e; font-weight: 600; }
    main { max-width: 820px; margin: 2rem auto; padding: 0 1rem; }
    h2 { margin-top: 0; }
    .card { background: #fff; border: 1px solid #dee2e6; border-radius: 8px; padding: 1.25rem; margin-bottom: 1.25rem; }
    label { display: block; font-weight: 600; margin-bottom: 0.4rem; }
    textarea, input[type=text] { width: 100%; padding: 0.5rem 0.75rem; border: 1px solid #ced4da; border-radius: 6px; font-size: 1rem; font-family: inherit; }
    textarea { min-height: 80px; resize: vertical; }
    button { cursor: pointer; padding: 0.5rem 1.1rem; border-radius: 6px; font-size: 0.95rem; border: 1px solid transparent; }
    .btn-primary { background: #0d6efd; color: #fff; }
    .btn-primary:hover { background: #0b5ed7; }
    .btn-success { background: #198754; color: #fff; }
    .btn-success:hover { background: #157347; }
    .btn-danger  { background: #dc3545; color: #fff; }
    .btn-danger:hover  { background: #bb2d3b; }
    button:focus-visible, a:focus-visible, textarea:focus-visible, input:focus-visible { outline: 3px solid #0d6efd; outline-offset: 2px; }
    .status-badge { display: inline-block; padding: 0.2em 0.6em; border-radius: 4px; font-size: 0.8rem; font-weight: 600; }
    .status-awaiting_human_review { background: #fff3cd; color: #664d03; }
    .status-approved  { background: #d1e7dd; color: #0a3622; }
    .status-rejected  { background: #f8d7da; color: #58151c; }
    .status-failed    { background: #f8d7da; color: #58151c; }
    .trace-item { font-size: 0.85rem; color: #6c757d; display: flex; gap: 0.5rem; }
    .trace-item.failed { color: #dc3545; }
    #status-msg { font-size: 0.9rem; color: #6c757d; min-height: 1.2em; }
    #status-msg.error { color: #dc3545; }
    #status-msg.ok    { color: #198754; }
    .history-row { font-size: 0.85rem; border-bottom: 1px solid #e9ecef; padding: 0.5rem 0; display: flex; gap: 1rem; align-items: baseline; }
    .history-row:last-child { border-bottom: none; }
    @media (max-width: 540px) { main { padding: 0 0.5rem; } .card { padding: 1rem; } }
  </style>
</head>
<body>
<header>
  <h1>👻 Skeleton Crew AI</h1>
  <nav>
    <a href="/support" ${appId === 'support-desk' ? 'aria-current="page"' : ''}>Support Desk</a>
    <a href="/planner" ${appId === 'job-planner' ? 'aria-current="page"' : ''}>Job Planner</a>
  </nav>
</header>
<main>
${body}
</main>
<script>
// Safe text renderer — never use innerHTML with user/model content.
function setText(el, value) {
  if (typeof value === 'string') el.textContent = value;
}
function escHtml(s) {
  return String(s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
</script>
</body>
</html>`;
}
