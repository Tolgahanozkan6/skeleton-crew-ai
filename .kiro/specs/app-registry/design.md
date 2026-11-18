# App registry design

```text
apps/<id>/workflow.js   steps: { name, label, run, schema, instructions }
apps/<id>/manifest.js   defineApp({ id, route, title, samples, steps, view })
apps/index.js           registry = createRegistry([support, planner, ...])   ← the only shared line per app

src/registry.js   defineApp / createRegistry: manifest validation
src/schema.js     validateOutput(schema, output), toJsonSchema(schema)
src/runtime.js    runWorkflow(request, steps, ctx): validated, timed trace
src/live-workflow.js executeLiveRun(app, request, factory, ctx): one provider per run
src/lifecycle.js  isomorphic makeRun / applyReview / validateReview / validateProfile
src/store.js      MemoryStore, JsonStore (use lifecycle)
src/server.js     generic routes /, /<route>, /api/apps, /api/runs[?appId], /api/runs/:id/review
src/ui/           one page renderer + client.js + styles.css driven by manifest view
scripts/build-public-demo.mjs  copies ES modules unchanged; public-adapter shims /api/*
scripts/new-app.mjs           scaffolds an app from a template
```

Schema notation (unchanged from the live workflow): `'string'`, `'strings'`, enum array, or literal `false`/`null`.

View section types: `fields` (labelled scalar fields), `list` (string array), `editable` (one string field the owner may edit; becomes `editedDraft`), `text` (read-only string).

Browser safety: manifests sent to the browser contain only data (no functions). All untrusted text is rendered with `textContent`.
