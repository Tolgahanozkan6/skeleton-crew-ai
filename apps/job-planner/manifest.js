import { defineApp } from '../../src/registry.js';
import { steps } from './workflow.js';

export default defineApp({
  id: 'job-planner',
  route: 'planner',
  title: 'Job Planner',
  icon: '🛠️',
  tagline: 'Scope a service request, draft a provisional work plan and list what to ask the customer.',
  inputLabel: 'Service request',
  placeholder: 'Describe the job the customer is asking for…',
  samples: [
    'Please repair our broken shop door at 14 High Street.',
    'Acil tamir: dükkan kapısı bozuldu.',
    'We need installation of 3 ceiling lights in our office on the 2nd floor.',
    'We need some work done.',
  ],
  steps,
  view: [
    { type: 'fields', step: 'scope', title: 'Scope', fields: [['service', 'Job type'], ['urgency', 'Urgency']] },
    { type: 'text', step: 'scope', field: 'summary', title: 'Summary' },
    { type: 'list', step: 'scope', field: 'missingFacts', title: 'Missing information', hideEmpty: true },
    { type: 'list', step: 'planner', field: 'tasks', title: 'Provisional work plan', checklist: true },
    { type: 'list', step: 'clarification', field: 'questions', title: 'Questions for the customer' },
  ],
  approveLabel: 'Approve plan',
  notice: 'Approving a plan is not a booking and includes no price. Nothing is scheduled, sent or charged.',
});
