---
inclusion: always
---
# Technology
Use Node.js 22+ and JavaScript ES modules. Keep the starter dependency-free. Run npm test and npm start after changes. Isolate future model providers behind an adapter; never commit secrets or customer data.

Current environment examples are documentation only, not runtime configuration. Add providers only on the server behind validation, timeout and bounded-call controls. User content must never grant tools or bypass human review. For planned browser work use safe text rendering and accessible native controls. Keep offline tests independent of network/API credentials.
