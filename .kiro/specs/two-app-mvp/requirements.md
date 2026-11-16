# Two-app MVP requirements

R1 — As an owner, I can run two distinct applications from the same skeleton. Each app shall have its own folder, entry point and domain fixtures, importing a shared runtime. Legacy npm start and its tests shall continue to pass.

R2 — When a request is submitted, the system shall accept only trimmed strings of 1–4,000 characters and reject unknown app IDs/modes before executing steps. Support Desk shall return category/urgency, reply and checklist; Job Planner shall return scope, work plan and clarification questions. Missing business facts shall become questions rather than invented commitments.

R3 — When a run executes, the system shall show mode and named step trace. A successful run shall end awaiting human review. A step/provider failure shall produce a recoverable failed state without an approvable partial draft or silent mode switching.

R4 — When an owner approves/rejects a pending draft, the system shall persist the decision and edited draft with version and time. Repeated, stale or invalid decisions shall be rejected; approval shall perform no external action. Reload shall preserve valid runs/reviews.

R5 — Each browser application shall support sample/manual input, pending/success/error states, readable specialist outputs, keyboard review and history. Untrusted content shall render as text. The browser shall never receive provider credentials.

R6 — Offline mode shall work without network or keys. A separately selected live adapter shall validate structured output, timeout within 15 seconds per call and make at most three specialist calls per run without retries. Malformed output or missing credentials shall produce explicit errors. Secrets and full customer content shall not appear in logs.

R7 — A clean checkout shall have documented run/test commands and truthful demo limitations. Both applications shall be tested end to end. Actual Kiro usage, reused material and deployment instructions shall be documented before competition submission.
