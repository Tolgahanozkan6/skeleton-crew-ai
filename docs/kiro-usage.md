# Kiro usage and provenance

This file records which tool did which work. Do not add invented sessions, commits, hooks or test evidence.

## Kiro sessions

| Date | Kiro surface | Task | Features used | Validation |
|---|---|---|---|---|
| 2026-11-16 | Kiro Crew dashboard (acp-client) | T1 — contracts | Spec reading, file create (`src/contracts.js`, `test/contracts.test.js`) | 34/34 tests passed |
| 2026-11-16 | Kiro Crew dashboard (acp-client) | T2 — workflows | Spec reading, file edit/create (workflow.js ×2, fixtures.js ×2, workflows.test.js, apps.test.js, runtime.js) | 49/49 tests passed |
| 2026-11-16 | Kiro Crew dashboard (acp-client) | T3 — store | File create (`src/store.js`, `test/store.test.js`) | 69/69 tests passed |
| 2026-11-16 | Kiro Crew dashboard (acp-client) | T4 — browser apps | File create (server.js, web.js, ui pages, server.test.js), package.json edit | 90/90 tests passed |
| 2026-11-16 | Kiro Crew dashboard (acp-client) | T5 — provider adapter | File create (`src/provider.js`, `test/provider.test.js`) | 107/107 tests passed |
| 2026-11-16 | Kiro Crew dashboard (acp-client) | T6 — CI and docs | `.github/workflows/ci.yml`, `docs/progress.md`, README edit | 107/107 local tests |
| 2026-11-16 | Kiro Crew dashboard (acp-client) | T7 — submission prep | `docs/submission.md`, this file | Partial |

**To add:** later Kiro sessions (for example executing the `.kiro/hooks`, using the `skeleton-crew` MCP tools, or building a third app from a spec). Add screenshots or exported logs under `docs/kiro-evidence/`.

## Work done with other assistants

| Date | Tool | Work |
|---|---|---|
| 2026-11-16 | Codex (OpenAI) | Initial repo preparation, product/architecture plan and first `.kiro` files; review of T1–T7; JSON persistence wiring, provider integration, Ollama path, integration tests, Turkish/UX fixes, first public demo publication. |
| 2026-11-16/17 | Claude Code (Anthropic) | Spec `.kiro/specs/app-registry/` and its implementation: manifest registry, app-agnostic core, shared schemas for rules and model, review/status-code fixes, manifest-driven UI and landing page, business profile, static build from unchanged modules, `new-app` scaffolder, MCP server, Kiro hooks and MCP config, updated steering/docs; tests 118 → 145. |

## How Kiro shaped the outcome

- `.kiro/specs/two-app-mvp/` set the task order and acceptance criteria for T1–T7.
- Steering files (`product`, `structure`, `tech`) carried the constraints that every later change kept: ES modules, no runtime dependencies, no fabricated outputs or commitments, human review, secrets never in code.
- The `app-registry` spec and the hooks/MCP config are written so that further work (for example a third app) can be done and verified inside Kiro.

## Third-party material and pre-existing work

- No runtime dependencies; Node.js 22 standard library only.
- Ollama and the Qwen model are separate software with their own licenses; no weights are included.
- The initial repository skeleton (runtime.js, crew.js, demo.js, first tests, MIT license, README, docs) was created by the project owner with Codex before the Kiro sessions. The owner must confirm that all of it was created on or after 2026-10-30.
