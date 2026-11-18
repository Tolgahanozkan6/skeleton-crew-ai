import { defineApp } from '../../src/registry.js';
import { steps } from './workflow.js';

export default defineApp({
  id: 'support-desk',
  route: 'support',
  title: 'Support Desk',
  icon: '💬',
  tagline: 'Triage shop enquiries, draft a reply in the customer\'s language and get an owner checklist.',
  inputLabel: 'Customer message',
  placeholder: 'Paste a customer email or chat message…',
  samples: [
    'Order number 1234: my item arrived damaged. I would like to return it.',
    'Sipariş numaram 1234. Ürün kırık, İADE istiyorum.',
    'This is urgent! I am extremely unhappy and need this resolved ASAP.',
    'What are your opening hours on Saturday?',
  ],
  steps,
  view: [
    { type: 'fields', step: 'triage', title: 'Triage', fields: [['category', 'Category'], ['urgency', 'Urgency']] },
    { type: 'list', step: 'triage', field: 'missingFacts', title: 'Missing information', hideEmpty: true },
    { type: 'editable', step: 'reply', field: 'draft', title: 'Reply draft', hint: 'Edit before approving' },
    { type: 'list', step: 'reply', field: 'clarificationQuestions', title: 'Questions for the customer', hideEmpty: true },
    { type: 'list', step: 'operations', field: 'checklist', title: 'Owner checklist', checklist: true },
  ],
  approveLabel: 'Approve reply',
  notice: 'Approval records your decision only. This app never sends messages or issues refunds — copy the approved reply and send it yourself.',
});
