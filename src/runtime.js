export function runWorkflow(request, steps) {
  if (typeof request !== 'string' || !request.trim()) {
    throw new TypeError('A non-empty request is required');
  }
  const text = request.trim();
  const outputs = {};
  const trace = [];
  for (const step of steps) {
    try {
      outputs[step.name] = step.run(text, outputs);
      trace.push({ agent: step.name, status: 'completed' });
    } catch (err) {
      trace.push({ agent: step.name, status: 'failed', error: err.message });
      // Surface an explicit failed state; no partial draft is returned.
      return {
        mode: 'offline-demo',
        status: 'failed',
        failedStep: step.name,
        error: err.message,
        outputs: {},
        trace,
      };
    }
  }
  return { mode: 'offline-demo', status: 'awaiting_human_review', outputs, trace };
}
