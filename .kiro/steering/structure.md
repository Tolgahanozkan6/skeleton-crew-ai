---
inclusion: always
---
# Structure

- `src/` — the reusable skeleton. It must never name an application, step or domain field (enforced by test/registry.test.js).
  - `registry.js` defineApp/createRegistry · `schema.js` step output schemas · `runtime.js` offline runner · `live-workflow.js` model runner · `lifecycle.js` run/review/profile rules shared with the browser demo · `store.js` Memory/Json stores · `server.js` HTTP · `ui/` one manifest-driven page, `client.js`, `styles.css` · `ollama-provider.js`, `provider.js` model adapters.
- `apps/<id>/` — one folder per app: `workflow.js` (steps: name, label, run, schema, instructions), `manifest.js` (defineApp: route, samples, view), `fixtures.js`, `demo.js`, `README.md`.
- `apps/index.js` — the registry; the only shared line per app.
- `scripts/` — `new-app.mjs` scaffolder, `build-public-demo.mjs` static build (copies ES modules unchanged), `public-adapter.js` browser API shim, `mcp-server.mjs` MCP tools for Kiro, `start-free.js` Ollama launcher.
- `test/` — node:test suites; registry tests cover every registered app automatically.
- `.kiro/specs/` — app-registry (current), two-app-mvp and business-agent-workflow (history).

Domain behaviour belongs in app folders; reusable execution, validation and UI belong in `src/`. Keep `src/crew.js` and `src/demo.js` backward compatible.
