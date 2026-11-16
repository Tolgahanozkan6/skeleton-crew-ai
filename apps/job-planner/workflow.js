import { runWorkflow } from '../../src/runtime.js';

// ── scope step ───────────────────────────────────────────────────────────────
// Classifies the job and flags when essential facts are missing.
function scopeStep(text) {
  const matchText = text.replace(/[İı]/g, 'i');
  const isRepair = /repair|broken|fix|fault|leak|damage|tamir|bozul|kırık|kirik|sızıntı|sizinti/i.test(matchText);
  const isInstall = /install|fit|set.?up|mount|kurulum|montaj/i.test(matchText);
  const isUrgent = /urgent|asap|emergency|immediately|acil|hemen/i.test(matchText);
  const hasLocation = /at\s+\w|office|shop|site|address|floor|unit\s+\d/i.test(matchText);
  const hasSize = /\d+\s*(m²|sqm|sq\.?\s*ft|rooms?|floors?)/i.test(matchText);

  const service = isRepair
    ? 'repair-assessment'
    : isInstall
    ? 'installation-assessment'
    : 'general-assessment';

  const missingFacts = [
    ...(!hasLocation ? ['Location or site address is required.'] : []),
    ...(!hasSize ? ['Size or scope (e.g. number of rooms, m²) is needed for a realistic plan.'] : []),
  ];

  return { agent: 'scope', summary: text, service, urgency: isUrgent ? 'high' : 'normal', missingFacts };
}

// ── planner step ─────────────────────────────────────────────────────────────
// Produces a provisional task list; never confirms a booking or invents a quote.
function plannerStep(_text, outputs) {
  const { service, urgency, missingFacts } = outputs.scope;

  const tasks = [
    'Confirm exact location and access arrangements.',
    ...(service === 'repair-assessment' ? ['Diagnose fault and document findings.'] : []),
    ...(service === 'installation-assessment' ? ['Survey installation site.'] : []),
    'Check staff and equipment availability.',
    'Prepare a written estimate for owner review before sharing with the customer.',
    ...(urgency === 'high' ? ['Prioritise scheduling; notify owner before committing a time slot.'] : []),
  ];

  return {
    agent: 'planner',
    tasks,
    bookingConfirmed: false, // bookings require owner approval — never true in offline mode
    missingFactsCarried: missingFacts,
  };
}

// ── clarification step ───────────────────────────────────────────────────────
// Surfaces the questions the owner or customer must answer; never invents answers.
function clarificationStep(_text, outputs) {
  const { missingFacts, urgency } = outputs.scope;

  const questions = [
    ...missingFacts,
    'What is the preferred date and time window for the assessment?',
    'Are there any access restrictions or health-and-safety requirements on site?',
    ...(urgency === 'high'
      ? ['What is driving the urgency — is there an immediate safety risk?']
      : []),
  ];

  return {
    agent: 'clarification',
    questions,
    quote: null, // quotes require owner approval — never set in offline mode
  };
}

// ── public entry point ───────────────────────────────────────────────────────
export function runPlanner(request) {
  return runWorkflow(request, [
    { name: 'scope', run: (text) => scopeStep(text) },
    { name: 'planner', run: (text, outputs) => plannerStep(text, outputs) },
    { name: 'clarification', run: (text, outputs) => clarificationStep(text, outputs) },
  ]);
}
