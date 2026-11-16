# Kiro usage and provenance

This file records actual Kiro work performed on this project.
Do not add invented sessions, commits, hooks or test evidence.

## Session record

| Date | Kiro surface | Task | Features used | Validation |
|---|---|---|---|---|
| 2026-11-16 | Kiro Crew dashboard (acp-client) | T1 — contracts | Spec reading, file create (`src/contracts.js`, `test/contracts.test.js`) | 34/34 tests passed |
| 2026-11-16 | Kiro Crew dashboard (acp-client) | T2 — workflows | Spec reading, file edit/create (workflow.js ×2, fixtures.js ×2, workflows.test.js, apps.test.js, runtime.js) | 49/49 tests passed |
| 2026-11-16 | Kiro Crew dashboard (acp-client) | T3 — store | File create (`src/store.js`, `test/store.test.js`) | 69/69 tests passed |
| 2026-11-16 | Kiro Crew dashboard (acp-client) | T4 — browser apps | File create (server.js, web.js, ui/shared.js, ui/support-page.js, ui/planner-page.js, server.test.js), package.json edit | 90/90 tests passed |
| 2026-11-16 | Kiro Crew dashboard (acp-client) | T5 — provider adapter | File create (`src/provider.js`, `test/provider.test.js`) | 107/107 tests passed; live integration blocked (no key) |
| 2026-11-16 | Kiro Crew dashboard (acp-client) | T6 — CI and docs | File create (`.github/workflows/ci.yml`, `docs/progress.md`), README edit | 107/107 local tests; remote CI pending push |
| 2026-11-16 | Kiro Crew dashboard (acp-client) | T7 — submission prep | File create (`docs/submission.md`), kiro-usage.md update | Partial — blocked items recorded |

## How Kiro changed the outcome

- The `.kiro/specs/two-app-mvp/` spec drove the implementation order and acceptance criteria for each task.
- Kiro read steering files (`tech.md`, `structure.md`, `product.md`) at the start of each task to enforce constraints (ES modules, no frameworks, no fabricated outputs, secrets never in code).
- Each task was validated against the spec's exit criteria before being marked complete.
- The two-application separation and shared-runtime pattern came from the spec's design file.

## Third-party material and pre-existing work

- **No runtime dependencies** — only Node.js 22 standard library.
- Initial repository skeleton (runtime.js, crew.js, demo.js, original tests, MIT license, README base, docs/) was created by the project owner before this Kiro session.
- All files in `src/contracts.js`, `src/store.js`, `src/server.js`, `src/provider.js`, `src/web.js`, `src/ui/`, `apps/*/workflow.js` (rewritten), `apps/*/fixtures.js`, `test/contracts.test.js`, `test/store.test.js`, `test/server.test.js`, `test/provider.test.js`, `test/workflows.test.js`, `.github/workflows/ci.yml`, `docs/progress.md`, `docs/submission.md` were created or substantially rewritten in this Kiro session.

## Uncommitted / unpublished

Local files have been created and edited in this session. No `git commit` or `git push` has been performed. GitHub history does not yet reflect this work. CI has not run. This note must be updated when commits are made.
