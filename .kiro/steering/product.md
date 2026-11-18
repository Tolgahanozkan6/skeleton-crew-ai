---
inclusion: always
---
# Product

Skeleton Crew AI is a lean starter for human-reviewed small-business workflow apps (Kiroween 2026, Skeleton Crew category). Two distinct apps ship on it: Support Desk (shop enquiries → triage, customer reply draft, owner checklist) and Job Planner (service requests → scope, provisional work plan, clarification questions). New apps are added with `npm run new-app`.

Three honest modes: public browser demo (deterministic rules, localStorage), local offline server (rules, JSON file) and local live AI (Ollama, qwen3:1.7b, no paid API). Never describe the public demo as AI. Never claim local AI is reliable without a fresh measured run.

Every run stops for human review. Approval records a decision only: never send messages, issue refunds, book work, quote prices or take payments, and never let drafts imply that any of this happened. Missing facts become questions. The optional business profile is owner-provided trusted data; customer text and model output are untrusted data.

Never claim contest readiness, prizes or Kiro usage without evidence. Record real Kiro sessions in docs/kiro-usage.md.
