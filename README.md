# Skeleton Crew AI

Category: **Skeleton Crew** — a Kiroween 2026 project starter.

An AI-powered team for small businesses: triage customer requests, draft replies, and organize daily operations. This repository starts with a deterministic, offline demo; live AI providers and external actions are future work.

## Quick start

Requires Node.js 22 or newer. No dependencies or API keys are needed.

```sh
npm start
npm test
```

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

Both are deterministic offline demonstrations, not live model agents. The two application folders are `apps/support-desk/` and `apps/job-planner/`. A complete web MVP, persistence, live inference and deployment remain planned.

```sh
git clone https://github.com/Tolgahanozkan6/skeleton-crew-ai.git
cd skeleton-crew-ai
node --version # Node.js 22+
npm test
npm run demo:support
npm run demo:planner
```

No install step or `.env` copy is required for these dependency-free demos. The existing `npm start` remains available. `.env.example` documents future settings; no code currently loads them.

## Build next

Read [product scope](docs/product-scope.md), [architecture](docs/architecture.md), [development plan](docs/development-plan.md) and [competition checklist](docs/competition.md). Start the new `.kiro/specs/two-app-mvp/tasks.md` at T1 in Kiro. Existing workflow specs remain valid for the legacy demo.

Competition conditions were checked on 2026-11-16; see the linked checklist for sources and remaining eligibility checks. This starter is not a completed submission. File preparation here does not prove that development used Kiro. Record actual Kiro work in [the evidence log](docs/kiro-usage.md).
