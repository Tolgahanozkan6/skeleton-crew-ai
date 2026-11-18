/**
 * Live (model-backed) execution for any registered app.
 * One provider instance per run gives each run its own call budget.
 * Each step output is validated against the same schema the offline rules use;
 * any failure returns an explicit failed run with no partial outputs and
 * never falls back to offline mode silently.
 */

import { createProvider } from './provider.js';
import { validateOutput } from './schema.js';

export async function executeLiveRun(app, request, factory = createProvider, ctx = {}) {
  if (!app || !Array.isArray(app.steps)) throw new TypeError('executeLiveRun requires a registered app');
  const outputs = {};
  const trace = [];
  let current = app.steps[0].name;
  let started = Date.now();
  try {
    const provider = factory({ mode: 'live' });
    for (const step of app.steps) {
      current = step.name;
      started = Date.now();
      const { output } = await provider.generate({
        role: step.name,
        input: request,
        context: { schema: step.schema, instructions: step.instructions, profile: ctx.profile ?? null, previousOutputs: outputs },
      });
      outputs[step.name] = validateOutput(step.name, step.schema, output);
      trace.push({ agent: step.name, status: 'completed', durationMs: Date.now() - started });
    }
    return { mode: 'live', status: 'awaiting_human_review', outputs, trace };
  } catch {
    // Never expose provider text or configuration secrets to clients or logs.
    const error = (process.env.CREW_PROVIDER ?? 'ollama') === 'ollama'
      ? 'Local AI unavailable or returned an invalid response. Start Ollama and check the model is installed; no cloud service was used.'
      : 'Live workflow failed. Check server configuration or retry later.';
    trace.push({ agent: current, status: 'failed', error, durationMs: Date.now() - started });
    return { mode: 'live', status: 'failed', outputs: {}, trace, error };
  }
}
