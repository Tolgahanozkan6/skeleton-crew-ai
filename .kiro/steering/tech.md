---
inclusion: always
---
# Technology

Node.js 22+, JavaScript ES modules, zero runtime dependencies, no build step. Tests: `npm test` (node:test). Run `npm test` after every change.

- Browser-safe modules (`runtime`, `contracts`, `schema`, `registry`, `lifecycle`, `errors`, `apps/**`) must not import `node:*`; the public demo serves them unchanged.
- Model providers sit behind adapters on the server only, with step-schema validation, per-call timeouts, a three-call budget per run, no retries and redacted errors. Never fall back to offline mode silently. Never add a paid API as a default; the free path is local Ollama.
- Trusted instructions/schema/profile go in system messages; customer text and earlier outputs only in the user message.
- UI: render untrusted text with textContent/value only; no inline scripts (strict CSP); accessible native controls; must work at 390 px wide.
- HTTP: 400 malformed input, 404 unknown run, 409 stale/repeated decision, 413 oversized body; block cross-origin POSTs; never return internal error text.
- Never commit secrets, `.env`, `data/` or customer data. Never add `.kiro/` to `.gitignore`.
