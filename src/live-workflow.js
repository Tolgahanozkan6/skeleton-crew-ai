import { createProvider } from './provider.js';

const schemas = {
  triage: { category: ['returns', 'complaint', 'general'], urgency: ['high', 'normal'], missingFacts: 'strings' },
  reply: { draft: 'string', clarificationQuestions: 'strings' },
  operations: { checklist: 'strings' },
  scope: { summary: 'string', service: ['repair-assessment', 'installation-assessment', 'general-assessment'], urgency: ['high', 'normal'], missingFacts: 'strings' },
  planner: { tasks: 'strings', bookingConfirmed: false, missingFactsCarried: 'strings' },
  clarification: { questions: 'strings', quote: null },
};

export function validateStep(role, output) {
  if (!output || typeof output !== 'object' || Array.isArray(output)) throw new TypeError('Invalid specialist output');
  for (const [key, type] of Object.entries(schemas[role])) {
    const value = output[key];
    const valid = Array.isArray(type) ? type.includes(value)
      : type === 'strings' ? Array.isArray(value) && value.length <= 30 && value.every(x => typeof x === 'string' && x.length <= 4000)
      : type === 'string' ? typeof value === 'string' && value.trim().length > 0 && value.length <= 8000
      : value === type;
    if (!valid) throw new TypeError('Invalid specialist field: ' + key);
  }
  return { ...output, agent: role };
}

export async function executeLiveRun(appId, request, factory = createProvider) {
  const roles = appId === 'support-desk' ? ['triage', 'reply', 'operations'] : ['scope', 'planner', 'clarification'];
  const outputs = {};
  const trace = [];
  let current = roles[0];
  try {
    // One adapter per run gives each run its own three-call budget.
    const provider = factory({ mode: 'live' });
    for (const role of roles) {
      current = role;
      const { output } = await provider.generate({ role, input: request, context: { schema: schemas[role], previousOutputs: outputs } });
      outputs[role] = validateStep(role, output);
      trace.push({ agent: role, status: 'completed' });
    }
    return { mode: 'live', status: 'awaiting_human_review', outputs, trace };
  } catch {
    // Do not expose provider text or configuration secrets to clients/logs.
    const error = process.env.CREW_PROVIDER === 'ollama' ? 'Local AI unavailable or invalid response. Start Ollama and ensure the model is installed; no cloud service was used.' : 'Live workflow failed. Check server configuration or retry later.';
    trace.push({ agent: current, status: 'failed', error });
    return { mode: 'live', status: 'failed', outputs: {}, trace, error };
  }
}
