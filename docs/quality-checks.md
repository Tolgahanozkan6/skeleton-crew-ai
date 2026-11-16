# Quality checks — 2026-11-16

## Verified

- 117 tests passed after Turkish case handling and history reopening changes.
- Real local Ollama integration was previously exercised with Turkish Support Desk and Job Planner requests; both ended awaiting human review. Subsequent scope check correctly classified an urgent Turkish repair.
- Browser-only Support Desk: create request, edit draft, approve, reload, reopen history; edited draft retained.
- Browser-only Job Planner: urgent Turkish repair classified as repair-assessment/high with provisional tasks and no confirmed booking/quote.
- At a 390 × 844 viewport, planner document width matched viewport width (390 px); no horizontal overflow. Header wraps and controls remain visible.
- Keyboard submission of empty Job Planner input produced an inline error and restored focus to the input.
- Browser-only mode is visibly identified as deterministic; source/local AI instructions are linked. Browser-only data stays in localStorage.

## Repairs

- Added an accessible Open button to each history row in both apps.
- Restored the saved edited support draft when opening a reviewed run.
- Added Turkish refund/complaint/urgency and repair/installation keywords, including dotted/dotless I handling.
- Wrapped mobile header/navigation/history rows and long text.

## Limits

This is a focused acceptance pass, not an exhaustive accessibility audit. Small local models still make semantic mistakes. Long-running local inference is not hosted by the public demo. Private browsing or clearing site data removes browser-only history. Local JSON storage is single-process. Real customer data, automatic external actions and production multi-user access remain outside the MVP scope.
