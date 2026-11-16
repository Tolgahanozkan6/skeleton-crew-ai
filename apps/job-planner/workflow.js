import { runWorkflow } from '../../src/runtime.js';

export function runPlanner(request) {
  return runWorkflow(request, [
    { name: 'scope', run: text => ({ summary: text, service: /repair|broken/i.test(text) ? 'repair-assessment' : 'general-assessment' }) },
    { name: 'planner', run: () => ({ tasks: ['Confirm scope and location', 'Check staff availability', 'Prepare estimate for owner review'], bookingConfirmed: false }) },
    { name: 'clarification', run: () => ({ questions: ['What location and preferred time should we assess?', 'What budget and scope constraints apply?'], quote: null }) }
  ]);
}
