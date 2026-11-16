# Submission preparation

This document covers all locally-completable submission tasks for the Kiroween 2026 contest.
Items that require the user's personal information, a live deployment, or external access are
marked **[BLOCKED — user action required]**.

## Product description (English)

**Project name:** Skeleton Crew AI

**Category:** Skeleton Crew

**One-line summary:**
An offline-first, reusable AI crew skeleton that helps small businesses triage shop enquiries
and plan service jobs — with two distinct applications sharing one deterministic runtime.

**What it does:**
Skeleton Crew AI provides two applications built on a shared workflow runtime:

1. **Support Desk** — Takes a customer enquiry, classifies its category and urgency, drafts a
   factual reply, and produces an owner checklist. Missing order details become clarification
   questions rather than invented answers. The owner reviews and approves or rejects the draft
   before anything is sent.

2. **Job Planner** — Turns a service request into a scoped work plan with provisional tasks and
   clarification questions for the customer. Bookings and quotes are never confirmed without
   explicit owner approval.

Both applications run entirely offline without API keys. A live OpenAI adapter can be enabled
via environment variable, enforcing a 15-second per-call timeout, a three-call budget per run,
and no automatic retries. The browser never receives provider credentials.

**How Kiro was used:**
Kiro's spec workflow (`steering/`, `specs/two-app-mvp/`) guided the full implementation from
requirements through tasks. See `docs/kiro-usage.md` for a detailed task-by-task record.

**Tech stack:** Node.js 22+, ES modules, zero runtime dependencies. Plain HTML/CSS/JS browser UI.

**Reused material:** None beyond the Node.js standard library. The initial repository skeleton
was prepared by the project owner before this Kiro session.

---

## Jury test steps

### Support Desk

```
npm run start:web
# Open http://127.0.0.1:3000/support
```

1. Click **Load sample** to fill the request textarea with a sample enquiry.
2. Click **Run workflow**. The result card appears with triage category, urgency, reply draft and
   owner checklist.
3. Edit the draft reply if desired.
4. Click **Approve draft** or **Reject**. The status badge updates; no external action is taken.
5. The History section lists all runs for the session.
6. Try the **missing-facts** case: type "I want a refund" (no order number). The draft asks for
   the order reference instead of inventing a resolution.
7. Try the **urgent** case: type "This is urgent! I am extremely unhappy, ASAP." — urgency badge
   shows `high` and the checklist includes a priority flag.

### Job Planner

```
# Same server session
# Open http://127.0.0.1:3000/planner
```

1. Click **Load sample** to fill in a repair request.
2. Click **Plan this job**. Scope (service type, urgency), provisional tasks, clarification
   questions and step trace are shown.
3. `bookingConfirmed: No` and `Quote: not set` confirm no fabricated commitments.
4. Click **Approve plan** or **Reject**.
5. Try a vague request ("We need some work done") — missing-facts questions appear.
6. Try an urgent request ("Emergency — roof leaking ASAP") — urgency `high` and a safety question
   are added.

### Error / injection tests

- Submit an empty request → inline validation error appears; no run is created.
- Paste `<script>alert(1)</script>` as the request and submit → it runs as a string;
  the output is displayed as plain text, not executed.
- Call `POST /api/runs/:id/review` twice with the same version → server returns `409 Conflict`.

---

## Demo video script (≤ 3 minutes)

**Scene 1 — Introduction (0:00–0:20)**
"Skeleton Crew AI is a reusable small-business workflow starter built with Kiro.
It ships two applications from one runtime: Support Desk and Job Planner."

**Scene 2 — Support Desk normal flow (0:20–1:00)**
Show: load sample → run → result card with triage, draft reply, checklist → edit draft → approve.
Narrate: "Every output waits for owner review. Nothing is sent automatically."

**Scene 3 — Support Desk missing-facts case (1:00–1:20)**
Show: type "I want a refund" → run → draft asks for order number, not an invented resolution.

**Scene 4 — Job Planner flow (1:20–1:55)**
Show: load repair sample → plan → scope, tasks, clarification questions, booking not confirmed.
Narrate: "No booking or quote is set without owner approval."

**Scene 5 — Reject and history (1:55–2:15)**
Show: reject a run → status badge changes → History panel updates.

**Scene 6 — Code structure (2:15–2:45)**
Brief terminal: `npm test` output showing 107 passing tests.
Show `apps/support-desk/` and `apps/job-planner/` side by side — shared runtime, separate domains.

**Scene 7 — Close (2:45–3:00)**
"Two applications, one runtime, zero dependencies. All work reviewed before it reaches customers."

---

## Open / blocked items

| Item | Status |
|---|---|
| Rules recheck at kiroween.devpost.com | **[BLOCKED]** — requires browser or user to confirm current rules |
| Personal eligibility (age, country, exclusions) | **[BLOCKED]** — user must declare |
| Deployment to public hosting | **[BLOCKED]** — user must provide hosting account and target |
| Public application URLs | **[BLOCKED]** — depends on deployment |
| Video recording and YouTube upload | **[BLOCKED]** — user must record and upload |
| Devpost submission form | **[BLOCKED]** — user must fill in and submit |
