# Design

See docs/architecture.md for interfaces, lifecycle, storage and provider boundaries. The CLI starters establish reuse and domain separation; they do not implement the full requirements.

Use a sequential coordinator, not autonomous recursive delegation. Each app supplies named specialist steps to the same runtime. Preserve existing runCrew behavior behind Support Desk. Job Planner owns scope/planning/clarification functions. Later wrap these roles behind an injectable provider while retaining deterministic fixtures.

Implement R2 contract validation first. Introduce run IDs/status/version in a separate service layer so pure offline functions stay easy to test. Store interfaces: createRun, getRun, listRuns, saveReview(expectedVersion). JSON disk writes must be atomic; reject unsupported schema versions. Public hosting storage is a later deployment decision.

Browser views call the same server service with app IDs. Shared review/trace widgets may be reused, but domain fields and sample scenarios must differ. No sending connectors in this MVP. Do not merge a future live response with an old draft after a failed rerun.

Validation matrix: R1 legacy + two app tests; R2 boundary/unknown modes; R3 failed step + no approval; R4 reload + stale version + duplicate action; R5 keyboard/manual browser journey and text injection; R6 malformed JSON, timeout, call budget and secret redaction; R7 clean checkout and recorded end-to-end demo.
