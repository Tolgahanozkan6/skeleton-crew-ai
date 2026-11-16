import { runWorkflow } from '../../src/runtime.js';

// ── triage step ──────────────────────────────────────────────────────────────
// Classifies the request and signals urgency; never invents a resolution.
function triageStep(text) {
  const matchText = text.replace(/[İı]/g, 'i');
  const lower = text.toLowerCase();
  const isReturn = /refund|return|exchange|iade|değişim|degisim/i.test(matchText);
  const isUrgent = /urgent|asap|immediately|emergency|acil|hemen/i.test(matchText);
  const isMissingFacts = !/order\s*(number|#|id|no\.?)|reference|ticket|sipariş\s*(numara|no)|siparis\s*(numara|no)/i.test(matchText);

  const category = isReturn ? 'returns' : /complaint|dissatisfied|unhappy|şikayet|sikayet|memnun değil/i.test(matchText) ? 'complaint' : 'general';
  const urgency = isUrgent ? 'high' : 'normal';
  const missingFacts = isMissingFacts
    ? ['Order number or reference is required to process this request.']
    : [];

  return { agent: 'triage', category, urgency, missingFacts };
}

// ── reply step ───────────────────────────────────────────────────────────────
// Drafts a factual, non-committal reply; raises clarifying questions for
// missing facts instead of inventing a resolution.
function replyStep(text, outputs) {
  const { category, urgency, missingFacts } = outputs.triage;

  if (missingFacts.length > 0) {
    return {
      agent: 'reply',
      draft:
        'Thank you for getting in touch. To help you further, could you please provide your order number or reference? Once we have that, our team will review your request promptly.',
      clarificationQuestions: missingFacts,
    };
  }

  const tone = urgency === 'high' ? 'as a priority' : 'shortly';
  const topic =
    category === 'returns'
      ? 'return or refund request'
      : category === 'complaint'
      ? 'concern'
      : 'enquiry';

  return {
    agent: 'reply',
    draft: `Thank you for contacting us. We have received your ${topic} and a member of our team will follow up ${tone}. No action has been taken yet; all decisions require owner review.`,
    clarificationQuestions: [],
  };
}

// ── operations step ──────────────────────────────────────────────────────────
// Produces a checklist for the owner; never approves, quotes or refunds.
function operationsStep(_text, outputs) {
  const { category, urgency, missingFacts } = outputs.triage;

  const checklist = [
    'Review the full customer message.',
    'Verify relevant business policy before replying.',
    ...(missingFacts.length > 0
      ? ['Request missing information from the customer before proceeding.']
      : []),
    ...(category === 'returns'
      ? ['Check return/refund eligibility — owner must approve before confirming anything.']
      : []),
    ...(urgency === 'high' ? ['Flag as high priority; respond before close of business.'] : []),
    'Approve or edit the draft reply before it is sent.',
  ];

  return { agent: 'operations', checklist };
}

// ── public entry point ───────────────────────────────────────────────────────
export function runSupport(request) {
  return runWorkflow(request, [
    { name: 'triage', run: (text) => triageStep(text) },
    { name: 'reply', run: (text, outputs) => replyStep(text, outputs) },
    { name: 'operations', run: (text, outputs) => operationsStep(text, outputs) },
  ]);
}
