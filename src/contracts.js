/**
 * Shared request/output contracts for Skeleton Crew AI.
 * R2: accept only trimmed strings of 1–4,000 characters;
 * reject unknown app IDs/modes; validate domain output shape.
 */

export const VALID_APPS = new Set(['support-desk', 'job-planner']);
export const VALID_MODES = new Set(['offline-demo']);
export const MAX_REQUEST_LENGTH = 4000;

/**
 * Validates a customer request string.
 * Throws TypeError for non-string or empty/whitespace-only input.
 * Throws RangeError when the trimmed text exceeds 4,000 characters.
 * @param {unknown} request
 * @returns {string} trimmed text
 */
export function validateRequest(request) {
  if (typeof request !== 'string' || !request.trim()) {
    throw new TypeError('Request must be a non-empty string');
  }
  const text = request.trim();
  if (text.length > MAX_REQUEST_LENGTH) {
    throw new RangeError(
      `Request must not exceed ${MAX_REQUEST_LENGTH} characters (got ${text.length})`
    );
  }
  return text;
}

/**
 * Validates an app ID against the known set.
 * Throws TypeError for unknown values.
 * @param {unknown} appId
 * @returns {string}
 */
export function validateAppId(appId) {
  if (typeof appId !== 'string' || !VALID_APPS.has(appId)) {
    throw new TypeError(
      `Unknown app ID "${appId}". Valid values: ${[...VALID_APPS].join(', ')}`
    );
  }
  return appId;
}

/**
 * Validates a run mode against the known set.
 * Throws TypeError for unknown values.
 * @param {unknown} mode
 * @returns {string}
 */
export function validateMode(mode) {
  if (typeof mode !== 'string' || !VALID_MODES.has(mode)) {
    throw new TypeError(
      `Unknown mode "${mode}". Valid values: ${[...VALID_MODES].join(', ')}`
    );
  }
  return mode;
}

/**
 * Validates a domain output object from a workflow run.
 * A valid output must be a plain object with a string `status` field
 * and an `outputs` object containing at least one named step result.
 * Throws TypeError on a malformed structure.
 * @param {unknown} output
 * @returns {object}
 */
export function validateDomainOutput(output) {
  if (output === null || typeof output !== 'object' || Array.isArray(output)) {
    throw new TypeError('Domain output must be a plain object');
  }
  if (typeof output.status !== 'string' || !output.status) {
    throw new TypeError('Domain output must have a non-empty string "status" field');
  }
  if (
    output.outputs === null ||
    typeof output.outputs !== 'object' ||
    Array.isArray(output.outputs)
  ) {
    throw new TypeError('Domain output must have an "outputs" object');
  }
  if (Object.keys(output.outputs).length === 0) {
    throw new TypeError('Domain output "outputs" must contain at least one step result');
  }
  return output;
}
