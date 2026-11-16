export function runWorkflow(request, steps) {
  if (typeof request !== 'string' || !request.trim()) {
    throw new TypeError('A non-empty request is required');
  }
  const outputs = {};
  const trace = [];
  for (const step of steps) {
    outputs[step.name] = step.run(request.trim(), outputs);
    trace.push({ agent: step.name, status: 'completed' });
  }
  return { mode: 'offline-demo', status: 'awaiting_human_review', outputs, trace };
}
