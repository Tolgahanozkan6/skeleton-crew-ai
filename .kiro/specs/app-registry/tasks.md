# App registry tasks

- [x] A1 — Add `src/schema.js`, `src/errors.js`, `src/registry.js` with manifest validation (R1, R3, R4).
- [x] A2 — Move domain steps, schemas and model instructions into `apps/*/workflow.js` and `apps/*/manifest.js`; add `apps/index.js` (R1, R2).
- [x] A3 — Make runtime, live workflow, Ollama adapter and store app-agnostic (R2, R3).
- [x] A4 — Fix review/body validation and status codes; add `?appId=` filter and `/api/apps` (R5).
- [x] A5 — Replace the two copied pages with one manifest-driven UI and landing page (R2).
- [x] A6 — Rebuild public demo from unchanged ES modules; share lifecycle with the server (R2).
- [x] A7 — Add `scripts/new-app.mjs` and generic registry tests (R6, R7).
- [x] A8 — Add shared business profile (R8).

Verification (2026-11-17): `npm test` 145/145 on Node 22.23.2 (macOS); both apps and the static build exercised in headless Chrome (run, edit, approve, reload/open, reject, XSS probe, empty input, 390 px width).

Provenance: tasks A1–A8 were first implemented with Claude Code (Anthropic) on 2026-11-16 at the owner's request. Record any Kiro-run follow-up separately in docs/kiro-usage.md.
