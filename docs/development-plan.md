# Development plan

This is a proposed sequence, not a claim that the MVP is complete. Task details and requirement mapping live in `.kiro/specs/two-app-mvp/tasks.md`.

| Phase | Deliverable | Exit check |
| --- | --- | --- |
| Ready now | Preserved legacy demo, shared runtime, two offline CLI apps, specs | `npm test`, both demo commands |
| 1: contracts | T1 input/output schemas and run lifecycle | invalid/oversize inputs rejected |
| 2: workflows | T2 domain fixtures and T3 store/review | both domains, reload, conflict tests |
| 3: usable demo | T4 two browser interfaces | keyboard review journey in both apps |
| 4: real inference | T5 one provider adapter | valid, malformed and timeout paths |
| 5: release | T6 clean-checkout checks, T7 submission evidence | two working links, reproducible instructions |

Keep changes small and retain legacy commands. Do not mark tasks complete until their acceptance checks pass. Start in offline mode. Avoid cloud services and paid dependencies until needed. Record actual Kiro prompts, changes and test results after each task.

Suggested working dates: core lifecycle by November 20; two browser workflows by November 24; provider and failure cases by November 27; deployment and recorded demo by December 1. These are internal targets and can change.

First Kiro instruction:

> Read `.kiro/steering/` and `.kiro/specs/two-app-mvp/`. Implement T1 only, preserving the current demos and tests. Add behavior tests for every acceptance case, run all tests and both demos, then report changed files and remaining limitations. Update the task checkbox only after validation.
