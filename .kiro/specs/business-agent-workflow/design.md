# Design

A pure runCrew(request) function coordinates deterministic triage, reply drafting, and operations planning. demo.js prints a sample result. No network calls, persistence, or real customer data are involved. Live inference will be introduced through a separate adapter with schema validation, failure handling, and tests. Sending replies will require a distinct human approval step.
