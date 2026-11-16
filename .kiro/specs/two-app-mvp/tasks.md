# Implementation tasks

Implementation status below is subject to the independent review follow-up.

- [x] T1 — Define shared request/output contracts (R1, R2).
  - Add validators in src/contracts.js. Cover whitespace, non-string, 4,000/4,001 characters, unknown app/mode and malformed domain output. Preserve legacy API and both demos. Exit: npm test passes with boundary tests.
- [x] T2 — Complete domain workflows (R2, R3).
  - Add three fixtures per app: normal, missing facts, urgent/ambiguous. Assert different input produces relevant output and no fabricated commitments. Display structured trace and explicit failed state; test a throwing step.
- [x] T3 — Implement run store and review service (R3, R4).
  - Add ID/version lifecycle, in-memory store then atomic local JSON adapter. Test reload, corrupt file, stale version, double approval and rejection. No network side effects.
- [ ] T4 — Build two local browser applications (R1, R5).
  - Add loopback HTTP entry, validated routes and separate screens. Add sample input, trace, editable draft, approve/reject and history. Manually check keyboard, narrow screen, loading/error and injected HTML in both apps.
- [ ] T5 — Add one live provider adapter (R3, R6).
  - Choose provider/model; verify official SDK docs and terms; document env loading. Add schema validation, 15-second per-call timeout, three-call budget, no retries and redacted errors. Use stubbed failures in tests; opt-in real integration check must record model/date without secrets.
- [ ] T6 — Reproducible release (R7).
  - Add CI for offline tests and demos. Verify clean checkout on Node 22, deployment storage behavior and both complete browser workflows. Document setup, rollback and limitations.
- [ ] T7 — Competition package (R7). *(Partial — locally-completable sub-tasks done; deployment, video, eligibility and rules recheck blocked on user action.)*

## Independent review (Codex, 2026-11-16)

- T3 adapters exist; persistent web history is not wired up (server uses MemoryStore).
- T4 HTTP tests pass; keyboard/narrow-screen browser checks remain unverified.
- T5 adapter is not used by workflows; start:web does not load .env. Complete live integration and domain schema validation.
- T6 local tests and demos verified by Codex: 107/107 pass. Remote CI pending publication; clean-checkout acceptance remains to be verified.
