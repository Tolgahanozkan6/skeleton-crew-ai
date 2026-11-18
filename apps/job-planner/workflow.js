import { runWorkflow } from '../../src/runtime.js';
import { foldTurkish, detectLanguage, t } from '../shared-text.js';

// Job Planner: service enquiries → scope → provisional plan → clarification questions.
// Rules never confirm a booking or invent a quote; missing facts become questions.

const REPAIR = /repair|broken|fix|fault|leak|damage|not working|tamir|bozul|kırık|kirik|arıza|ariza|sızıntı|sizinti|çalışmıyor|calismiyor/i;
const INSTALL = /install|fit\b|fitting|set.?up|mount|kurulum|montaj|takılması|takilmasi/i;
const URGENT = /urgent|asap|emergency|immediately|today|acil|hemen|bugün|bugun/i;
const LOCATION = /\bat\s+\d|\bat\s+[A-Z]|office|shop|site|address|floor|unit\s+\d|street|road|avenue|ofis|dükkan|dukkan|mağaza|magaza|adres|sokak|cadde|mahalle/i;
const SIZE = /\d+\s*(m²|m2|sqm|sq\.?\s*ft|rooms?|floors?|units?|doors?|windows?|oda|kat|adet|metre)/i;

function scope(text) {
  const m = foldTurkish(text);
  const service = REPAIR.test(m) ? 'repair-assessment' : INSTALL.test(m) ? 'installation-assessment' : 'general-assessment';
  const missingFacts = [
    ...(!LOCATION.test(m) ? ['Location or site address is required.'] : []),
    ...(!SIZE.test(m) ? ['Size or scope (e.g. number of rooms, m²) is needed for a realistic plan.'] : []),
  ];
  const summary = text.length > 160 ? text.slice(0, 157) + '…' : text;
  return { summary, service, urgency: URGENT.test(m) ? 'high' : 'normal', missingFacts };
}

function planner(_text, outputs, ctx = {}) {
  const { service, urgency, missingFacts } = outputs.scope;
  const area = ctx.profile?.serviceArea;
  return {
    tasks: [
      area
        ? `Confirm the site is inside your service area (${area}) and agree access arrangements.`
        : 'Confirm exact location and access arrangements.',
      ...(service === 'repair-assessment' ? ['Diagnose the fault on site and document findings with photos.'] : []),
      ...(service === 'installation-assessment' ? ['Survey the installation site and confirm required materials.'] : []),
      ...(service === 'general-assessment' ? ['Clarify what work is needed before assigning a specialist.'] : []),
      'Check staff and equipment availability.',
      'Prepare a written estimate for owner review before sharing with the customer.',
      ...(urgency === 'high' ? ['Prioritise scheduling; notify the owner before committing a time slot.'] : []),
    ],
    bookingConfirmed: false, // a plan is never a booking
    missingFactsCarried: missingFacts,
  };
}

function clarification(text, outputs) {
  const { missingFacts, urgency } = outputs.scope;
  const lang = detectLanguage(text);
  const map = {
    'Location or site address is required.': t(lang, { en: 'What is the full site address?', tr: 'İşin yapılacağı açık adres nedir?' }),
    'Size or scope (e.g. number of rooms, m²) is needed for a realistic plan.': t(lang, { en: 'How large is the job (for example number of rooms, doors or m²)?', tr: 'İşin büyüklüğü nedir (ör. oda, kapı sayısı veya m²)?' }),
  };
  return {
    questions: [
      ...missingFacts.map((f) => map[f] ?? f),
      t(lang, { en: 'What is the preferred date and time window for the assessment?', tr: 'Keşif için tercih ettiğiniz tarih ve saat aralığı nedir?' }),
      t(lang, { en: 'Are there any access restrictions or health-and-safety requirements on site?', tr: 'Alanda erişim kısıtı veya iş güvenliği gereksinimi var mı?' }),
      ...(urgency === 'high'
        ? [t(lang, { en: 'What is driving the urgency — is there an immediate safety risk?', tr: 'Aciliyetin nedeni nedir — acil bir güvenlik riski var mı?' })]
        : []),
    ],
    quote: null, // prices require the owner's estimate
  };
}

export const steps = [
  {
    name: 'scope',
    label: 'Scope',
    run: (text) => scope(text),
    schema: { summary: 'string', service: ['repair-assessment', 'installation-assessment', 'general-assessment'], urgency: ['high', 'normal'], missingFacts: 'strings' },
    instructions: 'service=repair-assessment for tamir/bozuldu/kırık/repair/broken/leak; installation-assessment for kurulum/montaj/install; otherwise general-assessment. summary describes the request in at most 30 words. urgency=high only for explicit acil/urgent or immediate safety risk. missingFacts lists missing site address and job size when absent.',
  },
  {
    name: 'planner',
    label: 'Work plan',
    run: planner,
    schema: { tasks: 'strings', bookingConfirmed: false, missingFactsCarried: 'strings' },
    instructions: 'Write 3 to 6 useful assessment and planning tasks for the owner, respecting the saved service area. bookingConfirmed must be false. Never book an appointment or invent prices.',
  },
  {
    name: 'clarification',
    label: 'Questions',
    run: clarification,
    schema: { questions: 'strings', quote: null },
    instructions: 'Ask 2 to 5 short direct questions in the customer\'s language about details that are actually missing. quote must be null.',
  },
];

export function runPlanner(request, ctx = {}) {
  return runWorkflow(request, steps, ctx);
}
