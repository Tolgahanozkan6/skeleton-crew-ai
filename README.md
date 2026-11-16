# Skeleton Crew AI

Category: **Skeleton Crew** — a Kiroween 2026 project starter.

An AI-powered team for small businesses: triage customer requests, draft replies, and organize daily operations. This repository starts with a deterministic, offline demo; live AI providers and external actions are future work.

## Quick start

Requires Node.js 22 or newer. No dependencies or API keys are needed for offline mode.

```sh
# CLI demos (offline, no server)
npm start              # legacy single-crew demo
npm run demo:support   # Support Desk CLI demo
npm run demo:planner   # Job Planner CLI demo

# Tests (all offline, no network required)
npm test

# Local web server (both apps, loopback only)
npm run start:web
# Support Desk → http://127.0.0.1:3000/support
# Job Planner  → http://127.0.0.1:3000/planner
```

The web server binds to `127.0.0.1` only. No install step or `.env` file is required for offline mode.

### Free local AI (recommended)

Use Ollama locally with `qwen3:1.7b`. No API key or cloud account is required. Install [Ollama](https://ollama.com/download), run `ollama pull qwen3:1.7b` once, then use:

```sh
npm run start:free
```

This starts the local model service if needed and enables AI for both apps. The installer prepared in this workspace uses `../ollama-runtime/ollama` and `../ollama-models`; a fresh checkout can use a normal Ollama installation. Local model calls go only to `127.0.0.1:11434`. Each run has at most three calls; local calls time out after 120 seconds to allow model loading. Small local models can make mistakes: review every draft. No messages, bookings or payments are sent.

For the fastest deterministic demo without a model, run `npm run start:web` with `CREW_MODE=offline-demo` (the default). This is also the portable mode for a public demonstration that cannot access your laptop's model.

The optional paid OpenAI adapter remains available only if explicitly configured with `CREW_PROVIDER=openai`, `CREW_MODE=live` and a key; it is not needed for this project. No key has been configured by this setup.

References: [Ollama chat API](https://docs.ollama.com/api/chat), [model and license](https://ollama.com/library/qwen3:1.7b).

### Data location

The web server persists runs and reviews in `data/runs.json` (gitignored). Set `CREW_DATA_FILE` to change the location. A restart preserves records. Corrupt or unsupported files stop startup instead of being overwritten; back up and repair them. Only run one server process per data file.

### Known limitations

- Persistent storage is local and single-process; a hosting platform needs a persistent writable disk.
- No multi-user or multi-process guarantees on the JSON store.
- Live AI is optional; all offline tests pass without any credentials.
- Browser keyboard and narrow-screen checks require manual verification (automated tests cover HTTP routes).

### Troubleshooting

| Problem | Fix |
|---|---|
| `Error: Cannot find module` | Run `node --version`; must be ≥ 22 |
| Port 3000 in use | `PORT=3001 npm run start:web` |
| `CREW_API_KEY is required` | Set the env var or leave `CREW_MODE` unset (defaults to offline) |
| Corrupt data file | Back up and inspect the file before repair |

## Workflow

A coordinator passes a request to a triage agent, then a reply agent and an operations agent. All outputs are drafts for human review; nothing is sent to customers.

## Develop with Kiro

Open the repository in Kiro. Read `.kiro/steering/` and start with `.kiro/specs/business-agent-workflow/tasks.md`. Requirements, design, and implementation tasks are tracked together. See https://kiro.dev/docs/specs/.

## Status and roadmap

Starter only: offline orchestration, sample request, and automated checks. Next: structured model adapter, persistence, approval UI, and evaluation. Competition eligibility and submission rules must be independently verified; this repository does not claim compliance or affiliation.

## License

MIT — see LICENSE.

## Expanded starter: two applications

This repository is a reusable small-business workflow skeleton. Two distinct CLI starters share the same coordination runtime:

| Application | Audience | Input → draft output | Command |
| --- | --- | --- | --- |
| Support Desk | Online shop owner | Customer question → triage, reply, review checklist | `npm run demo:support` |
| Job Planner | Local service business | Job request → scope, work plan, customer questions | `npm run demo:planner` |

Both are deterministic offline demonstrations, not live model agents. The two application folders are `apps/support-desk/` and `apps/job-planner/`. Local web interfaces and review APIs exist; persistent web history and live integration are implemented; real-provider validation, browser acceptance checks and deployment remain pending.

```sh
git clone https://github.com/Tolgahanozkan6/skeleton-crew-ai.git
cd skeleton-crew-ai
node --version # Node.js 22+
npm test
npm run demo:support
npm run demo:planner
```

No install step or `.env` copy is required for these dependency-free demos. The existing `npm start` remains available. The web entry point loads optional `.env` settings; CLI demos remain offline.

## Build next

Read [product scope](docs/product-scope.md), [architecture](docs/architecture.md), [development plan](docs/development-plan.md) and [competition checklist](docs/competition.md). Continue the open integration checks in `.kiro/specs/two-app-mvp/tasks.md`. Existing workflow specs remain valid for the legacy demo.

Competition conditions were checked on 2026-11-16; see the linked checklist for sources and remaining eligibility checks. This starter is not a completed submission. File preparation here does not prove that development used Kiro. Record actual Kiro work in [the evidence log](docs/kiro-usage.md).
