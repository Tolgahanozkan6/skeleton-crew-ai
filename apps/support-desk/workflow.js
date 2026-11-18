import { runWorkflow } from '../../src/runtime.js';
import { foldTurkish, detectLanguage, t } from '../shared-text.js';

// Support Desk: shop enquiries → triage → customer reply draft → owner checklist.
// Rules never approve refunds or invent policy; missing facts become questions.

const RETURN = /refund|return|exchange|money back|iade|değişim|degisim|para iadesi/i;
const COMPLAINT = /complaint|dissatisfied|unhappy|disappointed|terrible|şikayet|sikayet|memnun değil|memnun degil|rezalet/i;
const URGENT = /urgent|asap|immediately|emergency|today|acil|hemen|bugün|bugun/i;
const ORDER_REF = /order\s*(number|#|id|no\.?)|#\s*\d{3,}|reference|ticket|sipariş\s*(numara|no)|siparis\s*(numara|no)/i;

function triage(text) {
  const m = foldTurkish(text);
  const category = RETURN.test(m) ? 'returns' : COMPLAINT.test(m) ? 'complaint' : 'general';
  const needsOrder = category !== 'general' && !ORDER_REF.test(m);
  return {
    category,
    urgency: URGENT.test(m) ? 'high' : 'normal',
    missingFacts: needsOrder ? ['Order number or reference is required to process this request.'] : [],
  };
}

function reply(text, outputs, ctx = {}) {
  const { category, urgency, missingFacts } = outputs.triage;
  const lang = detectLanguage(text);
  const p = ctx.profile || {};
  const greeting = t(lang, { en: 'Hello,', tr: 'Merhaba,' });
  const signOff = p.businessName
    ? t(lang, { en: `Kind regards,\n${p.businessName}`, tr: `Saygılarımızla,\n${p.businessName}` })
    : t(lang, { en: 'Kind regards,\nThe team', tr: 'Saygılarımızla,\nEkibimiz' });

  if (missingFacts.length > 0) {
    return {
      draft: [greeting, t(lang, {
        en: 'Thank you for getting in touch. To look into this, could you please share your order number or reference? Once we have it, we will review your request promptly.',
        tr: 'Bize ulaştığınız için teşekkür ederiz. Talebinizi inceleyebilmemiz için sipariş numaranızı paylaşabilir misiniz? Numarayı aldığımızda talebinizi hemen değerlendireceğiz.',
      }), signOff].join('\n\n'),
      clarificationQuestions: [t(lang, { en: 'What is your order number or reference?', tr: 'Sipariş numaranız nedir?' })],
    };
  }

  const topic = t(lang, {
    en: { returns: 'return request', complaint: 'feedback', general: 'message' }[category],
    tr: { returns: 'iade talebinizi', complaint: 'geri bildiriminizi', general: 'mesajınızı' }[category],
  });
  const when = urgency === 'high'
    ? t(lang, { en: 'as a priority', tr: 'öncelikli olarak' })
    : t(lang, { en: 'shortly', tr: 'en kısa sürede' });
  const hours = p.hours ? t(lang, { en: ` Our opening hours are: ${p.hours}.`, tr: ` Çalışma saatlerimiz: ${p.hours}.` }) : '';
  const body = t(lang, {
    en: `Thank you for contacting us. We have received your ${topic} and a member of our team will follow up ${when}.${hours}`,
    tr: `Bize ulaştığınız için teşekkür ederiz. ${topic[0].toUpperCase() + topic.slice(1)} aldık; ekibimiz ${when} size dönüş yapacak.${hours}`,
  });
  return { draft: [greeting, body, signOff].join('\n\n'), clarificationQuestions: [] };
}

function operations(_text, outputs, ctx = {}) {
  const { category, urgency, missingFacts } = outputs.triage;
  const policies = ctx.profile?.policies;
  return {
    checklist: [
      'Review the full customer message.',
      policies
        ? `Check the request against your saved policy: "${policies.slice(0, 160)}${policies.length > 160 ? '…' : ''}"`
        : 'Verify relevant business policy before replying (no policy saved in the business profile).',
      ...(missingFacts.length > 0 ? ['Request missing information from the customer before proceeding.'] : []),
      ...(category === 'returns' ? ['Check return/refund eligibility — owner must approve before confirming anything.'] : []),
      ...(category === 'complaint' ? ['Decide whether a goodwill gesture is appropriate; do not promise one in the draft.'] : []),
      ...(urgency === 'high' ? ['Flag as high priority; respond before close of business.'] : []),
      'Edit and approve the draft, then send it yourself — this app never sends messages.',
    ],
  };
}

export const steps = [
  {
    name: 'triage',
    label: 'Triage',
    run: (text) => triage(text),
    schema: { category: ['returns', 'complaint', 'general'], urgency: ['high', 'normal'], missingFacts: 'strings' },
    instructions: 'category=returns for iade/refund/return/exchange, complaint for şikayet/complaint/unhappy, otherwise general. urgency=high ONLY for explicit urgent/acil/asap or immediate risk; otherwise normal. missingFacts lists only essential facts the owner needs (for returns/complaints: order reference if absent).',
  },
  {
    name: 'reply',
    label: 'Reply draft',
    run: reply,
    schema: { draft: 'string', clarificationQuestions: 'strings' },
    instructions: 'Write a short polite CUSTOMER-FACING reply, at most 90 words, in the customer\'s language. Use the business profile name, hours and policies only as stated; never imply an approved refund or completed action. Put each missing fact as a clear question in clarificationQuestions.',
  },
  {
    name: 'operations',
    label: 'Owner checklist',
    run: operations,
    schema: { checklist: 'strings' },
    instructions: 'Write 3 to 6 actionable checklist items for the OWNER, referencing the saved business policy when relevant. The owner sends the reply; the app never does.',
  },
];

export function runSupport(request, ctx = {}) {
  return runWorkflow(request, steps, ctx);
}
