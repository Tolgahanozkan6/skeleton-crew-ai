# Product scope

## Problem and audience
An owner-operated shop loses time sorting customer messages; a local service company loses time turning enquiries into actionable jobs. Skeleton Crew AI provides a small reusable workflow engine rather than two unrelated codebases.

## MVP boundary
Support Desk accepts a message and business policy, classifies urgency/category, drafts a grounded reply and creates an owner checklist. Job Planner accepts a service enquiry and available service catalogue, extracts scope, identifies missing details and drafts a work plan. Neither promises refunds, appointments, prices or availability without supplied facts.

Shared capabilities: validated input, specialist step execution, visible trace, draft review, explicit accept/reject, local persistence and mock/live provider separation. Each application must have its own entry point, fixtures, screen and domain steps while importing the same engine.

## User journey
Choose an application → enter or load a synthetic example → run workflow → inspect specialist outputs and trace → edit draft → approve or reject → inspect saved decision. Approval records a local decision; it does not send email or book work.

## Completion criteria
Both apps start from a clean checkout with documented commands; different inputs produce domain-specific outputs; errors are recoverable; reload preserves runs and reviews; offline mode works without keys. A live adapter is tested separately and visibly labelled. Both web apps must be keyboard usable, show pending/error/empty states, and never render model content as raw HTML.

## Excluded from first release
Real email/calendar/payment connectors, automatic sending, invoicing, production authentication, multi-tenant accounts, vector databases and a distributed agent framework. Local development binds to loopback; public hosting requires a separate exposure and storage review.

## Demonstration
Show a return enquiry in Support Desk, then a repair enquiry in Job Planner. Compare the shared trace/review components and distinct domain outputs. Do not present deterministic role functions as live AI. Success means two complete workflows and demonstrable template reuse; no unmeasured productivity claims.
