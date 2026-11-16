---
inclusion: always
---
# Structure
src/ contains orchestration and the demo entry point; test/ contains behavior tests; docs/ contains architecture notes. Feature specifications live in .kiro/specs/. Keep requirements, design, and tasks consistent.

apps/support-desk/ and apps/job-planner/ contain distinct application entry points; src/runtime.js is shared coordination. Keep src/crew.js and src/demo.js backward compatible. New cross-app work uses .kiro/specs/two-app-mvp/. Domain behavior belongs in app folders; reusable execution and contracts belong in src/. docs/kiro-usage.md records actual Kiro work.
