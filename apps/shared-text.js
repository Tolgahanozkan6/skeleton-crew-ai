/**
 * Small text helpers reused by app rules (domain-side, not core).
 * Turkish detection lets offline drafts answer in the customer's language.
 */

export function foldTurkish(text) {
  return text.replace(/[İı]/g, 'i');
}

const TURKISH = /[çğışöüÇĞİŞÖÜ]|\b(ve|bir|için|merhaba|lütfen|lutfen|sipariş|siparis|acil|istiyorum|gerekiyor|bozuldu|tamir|iade)\b/i;

export function detectLanguage(text) {
  return TURKISH.test(text) ? 'tr' : 'en';
}

/** Picks the template for the detected language. */
export function t(lang, texts) {
  return texts[lang] ?? texts.en;
}
