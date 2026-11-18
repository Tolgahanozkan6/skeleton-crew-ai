# App registry requirements

Goal: make the skeleton genuinely reusable. A new application must be added by creating one folder under `apps/` and one registry line, without editing any file in `src/`.

R1 — Each application shall declare a manifest (`apps/<id>/manifest.js`) containing its id, route, title, samples, ordered steps and view sections. Each step shall declare a name, label, offline `run` function, output schema and model instructions.

R2 — The shared core (`src/`) shall not reference any application id, step name or domain field. The HTTP server, live workflow, browser UI and public demo builder shall obtain applications from the registry.

R3 — One output schema per step shall validate both deterministic and model output. An output that fails validation shall fail the run with no approvable partial draft.

R4 — The registry shall reject invalid manifests at startup: duplicate ids or routes, missing steps, unknown schema types, view sections that reference unknown steps or fields.

R5 — The review API shall return 400 for malformed bodies, unknown decisions or invalid edited drafts (non-string or longer than 8,000 characters), 404 only for unknown runs, 409 for stale or repeated decisions and 413 for oversized bodies. Internal error text shall not be exposed.

R6 — `npm run new-app <id> "<Title>"` shall scaffold a working two-step application that passes the generic registry tests without manual edits.

R7 — Every registered application shall be tested automatically: fixtures run offline, outputs satisfy step schemas, booking/quote/refund literals hold, and the HTML route renders.

R8 — An optional owner business profile (name, policy notes, hours, service area, tone) shall be shared by all apps, validated (strings, at most 600 characters each) and used as trusted owner data. Customer text remains untrusted data.
