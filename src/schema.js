/**
 * Step output schemas — one notation for deterministic and model output.
 *
 *   'string'          non-empty text, at most 8,000 characters
 *   'strings'         array of at most 30 strings, each at most 4,000 characters
 *   ['a', 'b', ...]   enum of allowed string values
 *   false | null      required literal (e.g. bookingConfirmed: false)
 *
 * Browser-safe: no Node.js imports.
 */

export const LIMITS = { string: 8000, arrayItems: 30, item: 4000, modelArrayItems: 15 };

export function isSchemaType(type) {
  return type === 'string' || type === 'strings' || type === false || type === null ||
    (Array.isArray(type) && type.length > 0 && type.every((v) => typeof v === 'string'));
}

export function checkField(type, value) {
  if (Array.isArray(type)) return type.includes(value);
  if (type === 'strings') {
    return Array.isArray(value) && value.length <= LIMITS.arrayItems &&
      value.every((x) => typeof x === 'string' && x.length <= LIMITS.item);
  }
  if (type === 'string') return typeof value === 'string' && value.trim().length > 0 && value.length <= LIMITS.string;
  return value === type;
}

/**
 * Validates one step output against its schema.
 * @returns {object} a copy of the output tagged with `agent: stepName`
 * @throws {TypeError} naming the first invalid field (never echoing its value)
 */
export function validateOutput(stepName, schema, output) {
  if (!output || typeof output !== 'object' || Array.isArray(output)) {
    throw new TypeError(`Invalid output from step "${stepName}"`);
  }
  for (const [key, type] of Object.entries(schema)) {
    if (!checkField(type, output[key])) throw new TypeError(`Invalid field "${key}" from step "${stepName}"`);
  }
  return { ...output, agent: stepName };
}

/** Converts a step schema to a JSON Schema object for structured model output. */
export function toJsonSchema(schema) {
  const properties = {};
  for (const [name, type] of Object.entries(schema || {})) {
    properties[name] = Array.isArray(type) ? { type: 'string', enum: type }
      : type === 'strings' ? { type: 'array', items: { type: 'string' }, maxItems: LIMITS.modelArrayItems }
      : type === 'string' ? { type: 'string' }
      : { const: type };
  }
  return { type: 'object', properties, required: Object.keys(properties), additionalProperties: false };
}
