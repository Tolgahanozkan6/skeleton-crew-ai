# Architecture

Customer request → coordinator → triage → reply draft + operations checklist → human review.

The initial implementation is deterministic and runs entirely offline. No model, database, deployment, or external integrations are configured. Future adapters must preserve review-before-send and keep customer data out of logs.
