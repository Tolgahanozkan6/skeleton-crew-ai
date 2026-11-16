# Kiroween 2026 submission draft

## Product description

**Skeleton Crew AI** is an offline-first foundation for small-business workflow apps. Support Desk classifies shop enquiries, drafts customer replies and creates owner checklists. Job Planner scopes service enquiries, drafts provisional work plans and asks for missing information. They share coordination, validation, traces and human review while retaining separate application folders and specialist roles.

Every successful run waits for human review. Approving a draft records a decision; it never sends email, issues refunds, books appointments or takes payments.

There are two honest execution modes:

- **Public interactive demo:** deterministic workflows run in the browser without any model or API calls. Runs and decisions are stored only in the visitor's browser. It works without the owner's laptop.
- **Free local AI:** Node.js and Ollama run qwen3:1.7b on the user's own computer. A three-call budget, JSON field validation, explicit failures and human review constrain each run. Local calls have a 120-second timeout. No paid API key is required.

The local model is small and imperfect. Initial real Turkish tests completed in approximately 42–49 seconds. Demonstrate its limitations honestly; do not promise production accuracy or measured business savings.

## Reuse and provenance

Node.js standard library and browser APIs are used without external runtime dependencies. Ollama and the Qwen model are separate third-party software with their own licenses; model weights are not included in the repository. The project source is MIT licensed. Initial preparation and later integration/QA were performed in Codex for the project owner. Kiro implementation activity is recorded in docs/kiro-usage.md based on the development sessions. The owner must review the record and confirm project ownership, dates and all reused work before submission.

## Judge instructions

1. Open the public demo and choose Support Desk. Its banner explicitly identifies the deterministic mode.
2. Load a sample or enter a synthetic return enquiry with an order reference. Run the workflow; inspect category, urgency, draft, checklist and trace.
3. Edit the draft and approve it. Refresh the page and use **Open** in history to inspect the saved decision and edited draft.
4. Choose Job Planner, enter an urgent repair request and inspect provisional tasks and clarification questions. Reject the plan; confirm history updates.
5. Empty input must show an inline error. No external action should occur on approval or rejection.
6. To reproduce real AI locally, follow README's Ollama setup and run `npm run start:free`. The public browser-only demo does not expose the owner's local model.
7. Run `npm test` to check offline contracts, lifecycle, provider failures, HTTP routes and persistence. The suite includes no paid inference.

## Demonstration script (target 2:45)

- **0:00–0:15:** Explain the audience and two-app reusable foundation.
- **0:15–0:45:** Public Support Desk: sample → classification → edit reply → approve. Mention browser-only deterministic mode.
- **0:45–1:10:** Public Job Planner: urgent repair → provisional tasks → reject. Show the same trace/review pattern with different domain outputs.
- **1:10–1:50:** Show a pre-run actual local AI example and its mode/trace. State it uses Ollama on this laptop, not a paid cloud API. If waiting time is edited, label the time cut and show measured duration; do not present a scripted output as live inference.
- **1:50–2:15:** Refresh, open history, show the saved edited draft. Show no booking/refund/message was executed.
- **2:15–2:35:** Show the two app folders, shared runtime and actual Kiro specs/steering. Explain one concrete Kiro-assisted implementation change from the evidence log.
- **2:35–2:45:** Show current passing tests and repository URL; close with the local-model quality limitation and human review requirement.

## Required final items

- Public demo URL: recorded after successful publication in docs/release-links.md.
- Repository: https://github.com/Tolgahanozkan6/skeleton-crew-ai
- Actual YouTube video URL: pending recording/upload; no video has been fabricated.
- Personal eligibility, applicable bonus categories and ownership declarations: owner must confirm.
- Devpost final form submission: pending; this draft is not an entry or a guarantee of category acceptance.
