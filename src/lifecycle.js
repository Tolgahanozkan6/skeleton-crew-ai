/**
 * Run lifecycle shared by the Node store and the browser-only public demo,
 * so both enforce exactly the same review contract. Browser-safe.
 *
 * Status: awaiting_human_review | failed  →  approved | rejected
 */

import { ValidationError, ConflictError } from './errors.js';

export const SCHEMA_VERSION = 1;
export const MAX_EDITED_DRAFT = 8000;
export const RUN_STATUSES = ['awaiting_human_review', 'approved', 'rejected', 'failed'];
export const PROFILE_FIELDS = {
  businessName: 'Business name',
  policies: 'Policies (returns, warranty, cancellations)',
  hours: 'Opening hours',
  serviceArea: 'Service area',
  tone: 'Reply tone',
};
export const MAX_PROFILE_FIELD = 600;

const uuid = () => globalThis.crypto.randomUUID();
const now = () => new Date().toISOString();

export function makeRun({ appId, mode, outputs, trace, input = null, profileUsed = false }) {
  const status = trace.some((t) => t.status === 'failed') ? 'failed' : 'awaiting_human_review';
  const time = now();
  return {
    schemaVersion: SCHEMA_VERSION,
    id: uuid(),
    appId,
    mode,
    status,
    version: 1,
    input,
    profileUsed,
    outputs: status === 'failed' ? {} : outputs,
    trace,
    error: status === 'failed' ? (trace.at(-1)?.error ?? 'Workflow failed') : null,
    createdAt: time,
    updatedAt: time,
    review: null,
  };
}

/** Validates the untrusted review request body. */
export function validateReviewBody(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new ValidationError('Review body must be a JSON object');
  const { decision, editedDraft = null, expectedVersion } = body;
  if (decision !== 'approved' && decision !== 'rejected') throw new ValidationError('decision must be "approved" or "rejected"');
  if (!Number.isInteger(expectedVersion) || expectedVersion < 1) throw new ValidationError('expectedVersion must be a positive integer');
  if (editedDraft !== null && typeof editedDraft !== 'string') throw new ValidationError('editedDraft must be a string or null');
  if (typeof editedDraft === 'string' && editedDraft.length > MAX_EDITED_DRAFT) throw new ValidationError(`editedDraft must not exceed ${MAX_EDITED_DRAFT} characters`);
  return { decision, editedDraft, expectedVersion };
}

/** Returns the reviewed copy of a run; throws ConflictError for stale or repeated decisions. */
export function applyReview(run, body) {
  const { decision, editedDraft, expectedVersion } = validateReviewBody(body);
  if (run.version !== expectedVersion) throw new ConflictError(`Stale version: expected ${run.version}, got ${expectedVersion}`);
  if (run.status !== 'awaiting_human_review') throw new ConflictError(`Cannot review a run with status "${run.status}"`);
  const version = run.version + 1;
  const time = now();
  return {
    ...run,
    status: decision,
    version,
    updatedAt: time,
    review: { decision, editedDraft, createdAt: time, version },
  };
}

/**
 * Validates the optional owner business profile. Unknown keys are dropped;
 * empty values are removed. Returns null when nothing is set.
 */
export function validateProfile(profile) {
  if (profile === undefined || profile === null) return null;
  if (typeof profile !== 'object' || Array.isArray(profile)) throw new ValidationError('profile must be an object');
  const clean = {};
  for (const key of Object.keys(PROFILE_FIELDS)) {
    const value = profile[key];
    if (value === undefined || value === null || value === '') continue;
    if (typeof value !== 'string') throw new ValidationError(`profile.${key} must be a string`);
    if (value.length > MAX_PROFILE_FIELD) throw new ValidationError(`profile.${key} must not exceed ${MAX_PROFILE_FIELD} characters`);
    if (value.trim()) clean[key] = value.trim();
  }
  return Object.keys(clean).length ? clean : null;
}

/** Basic structural check used when loading persisted runs. */
export function isValidStoredRun(run, isKnownApp) {
  return !!run && typeof run.id === 'string' && isKnownApp(run.appId) &&
    ['offline-demo', 'live'].includes(run.mode) &&
    RUN_STATUSES.includes(run.status) &&
    Number.isInteger(run.version) && run.version >= 1 &&
    !!run.outputs && typeof run.outputs === 'object' && Array.isArray(run.trace) &&
    (run.review === null || run.review === undefined || (typeof run.review === 'object' && ['approved', 'rejected'].includes(run.review.decision)));
}
