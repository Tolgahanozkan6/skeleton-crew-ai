/**
 * Deterministic step runner shared by every app. Browser-safe.
 *
 * Steps run in order; each receives the request text, earlier outputs and a
 * context ({ profile }). When a step declares a schema its output is validated,
 * so offline rules obey the same contract as model output. Any error yields an
 * explicit failed state with no partial (approvable) outputs.
 */

import { validateRequest } from './contracts.js';
import { validateOutput } from './schema.js';

const clock = () => (globalThis.performance?.now?.() ?? Date.now());

export function runWorkflow(request, steps, ctx = {}) {
  const text = validateRequest(request);
  const outputs = {};
  const trace = [];
  for (const step of steps) {
    const started = clock();
    try {
      const raw = step.run(text, outputs, ctx);
      outputs[step.name] = step.schema ? validateOutput(step.name, step.schema, raw) : raw;
      trace.push({ agent: step.name, status: 'completed', durationMs: Math.round(clock() - started) });
    } catch (err) {
      trace.push({ agent: step.name, status: 'failed', error: err.message, durationMs: Math.round(clock() - started) });
      return { mode: 'offline-demo', status: 'failed', failedStep: step.name, error: err.message, outputs: {}, trace };
    }
  }
  return { mode: 'offline-demo', status: 'awaiting_human_review', outputs, trace };
}

/** Runs a registered app with its offline rules. */
export function runOffline(app, request, ctx = {}) {
  return runWorkflow(request, app.steps, ctx);
}
