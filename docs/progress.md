# Development progress

This file is the continuation point for new Kiro sessions. Update after every task.

## Completed

### T1 — Shared request/output contracts
- Added `src/contracts.js`: `validateRequest`, `validateAppId`, `validateMode`, `validateDomainOutput`.
- Added `test/contracts.test.js`: 27 boundary tests (whitespace, null, number, 4000/4001 chars, unknown app/mode, malformed output).
- All 34 tests passed. Legacy `runCrew` API preserved.

### T2 — Complete domain workflows
- Rewrote `apps/support-desk/workflow.js`: triage (category, urgency, missingFacts), reply (draft, clarificationQuestions), operations (checklist).
- Rewrote `apps/job-planner/workflow.js`: scope (service, urgency, missingFacts), planner (tasks, bookingConfirmed:false), clarification (questions, quote:null).
- Added `apps/support-desk/fixtures.js` and `apps/job-planner/fixtures.js`: normal / missingFacts / urgent.
- Added `test/workflows.test.js`: 20 tests covering fixture-driven runs, no fabricated commitments, different input → different output, trace structure, failed-state.
- Updated `src/runtime.js`: step error → `{ status:'failed', outputs:{}, trace }` (no longer throws).
- Updated `test/apps.test.js`: old "throws" assertion updated to new failed-state contract.
- 49/49 tests passed.

### T3 — Run store and review service
- Added `src/store.js`: `MemoryStore` and `JsonStore` with lifecycle, version control, atomic writes.
- Added `test/store.test.js`: 20 tests (lifecycle, reload, corrupt file, unsupported schema, stale version, double action, failed run, no network).
- 69/69 tests passed.

### T4 — Two local browser applications
- Added `src/server.js`: loopback HTTP server, routes `/support`, `/planner`, `/api/runs`, `/api/runs/:id`, `/api/runs/:id/review`.
- Added `src/web.js`: entry point, reads `PORT` env.
- Added `src/ui/shared.js`, `src/ui/support-page.js`, `src/ui/planner-page.js`: plain HTML, safe text rendering (no innerHTML with user content).
- Added `npm run start:web` script.
- Added `test/server.test.js`: 21 HTTP route tests (create, get, list, review lifecycle, error states, HTML injection safety).
- 90/90 tests passed.

### T5 — Provider adapter
- Added `src/provider.js`: `OfflineAdapter` (default), `LiveAdapter` (OpenAI), `createProvider` factory.
- Enforces: 15 s timeout, 3-call budget, no retries, structured output validation, no key/content in logs.
- Added `test/provider.test.js`: 20 tests (offline, missing key, budget, timeout, bad JSON, schema, HTTP error, secret redaction, mode guard, constants).
- Live integration: **blocked** — no `CREW_API_KEY` in this environment. Recorded as open blocker below.
- 107/107 tests passed.

### T6 — Reproducible release
- Added `.github/workflows/ci.yml`: Node 22, `npm test`, `npm run demo:support`, `npm run demo:planner`, `npm start`. No live keys required.
- Updated README: start commands, local URLs, data location, known limits, troubleshooting table.
- `data/` already gitignored. `.env` excluded.
- Local clean-run verified: 107/107 tests, all three demos pass.
- **Remote CI not yet triggered** (no push/PR in this session). Cannot claim CI green until it runs on GitHub.

## In progress / open

### T7 — Competition and submission package
- Sub-tasks prepared but not fully complete (see tasks.md).
- `docs/competition.md` exists; rules URL recheck and eligibility confirmation need a live browser or user action.
- `docs/kiro-usage.md` updated with actual session work.
- English product description, jury test steps and demo script: pending (see T7 work below).
- Deployment: **blocked** — no hosting account or target provided. User must supply.
- Video: **blocked** — requires user action (recording and upload).
- Personal eligibility declaration: **user must provide** (age, country, student status per contest rules).

## Open blockers (require user action or external access)

| Blocker | Why blocked | What's needed |
|---|---|---|
| Live AI test | No `CREW_API_KEY` in env | User sets `CREW_API_KEY` in `.env`; run `npm test` again |
| Remote CI verification | No GitHub push in session | User pushes to GitHub; CI result visible at Actions tab |
| Deployment | No hosting target/account | User provides platform (e.g. Railway, Render, Fly.io) and credentials |
| Competition rules recheck | URL requires browser | User visits https://kiroween.devpost.com/rules and confirms current rules |
| Video recording | Requires screen capture | User records a demo and uploads |
| Personal eligibility | Personal data only user can provide | User confirms age, country, student status |

## Next task

T7 partial work complete. All remaining blockers require user action (see table above).

## Independent review — Codex, 2026-11-16

107/107 tests and all three CLI demos independently passed. Earlier completion statements reflect the Kiro report. Inspection found MemoryStore-only web history and an unconnected live provider adapter. The web server does not load .env; setting a key alone cannot activate live inference. T4/T5/T6 acceptance reopened for missing integration/verification. GitHub publication and CI verification are handled by Codex; they are not inherently user-only tasks.

## Integration update — Codex, 2026-11-16

Connected JsonStore to normal web startup and added optional .env loading. Connected live provider execution for both domains with per-run adapters, three-step budgets, field validation, sanitized failures and mode labels. Added restart persistence and stubbed live HTTP integration tests. Local JSON remains single-process; real provider credentials and browser acceptance remain unverified. Earlier integration-gap notes are superseded by this update.

## Free local AI setup

Added Ollama loopback-only provider with schema-constrained local responses, three-call budget and a separate 120-second local timeout. Added start:free launcher and local adapter tests. No paid account or API key is required. Installation and real-model verification are tracked by the current Codex session. Cloud mode remains optional and explicitly configured.

### Real local-model verification

Installed Ollama 0.40.16 in the workspace and downloaded qwen3:1.7b. Both Turkish end-to-end requests completed through the real local model with awaiting_human_review status (Support Desk 41.6 seconds; Job Planner 48.5 seconds). No API key or cloud inference was used. Small-model quality limitations observed: an urgent classification was overly eager and a repair was classified as general; role prompts were tightened for these cases. This is functional integration evidence, not a quality guarantee. Human review remains required.

## Acceptance and public demo — Codex, 2026-11-16

117 tests passed. Added history reopening, saved edited-draft restoration, Turkish classification regressions and mobile wrapping. Verified Support Desk create/edit/approve/reload/open and planner Turkish urgent repair, mobile width, keyboard empty-input behavior. Published public browser-only demo through Sites and exercised the hosted planner sample. See docs/quality-checks.md and docs/release-links.md. Public generation script reuses the same workflows/UI without copying customer data or model weights. Local AI remains separate. Submission description and timed video plan updated; no video upload or personal eligibility declaration has been made.
