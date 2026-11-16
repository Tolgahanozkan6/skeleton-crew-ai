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
