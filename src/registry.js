/**
 * App registry — the seam that makes this a skeleton.
 *
 * An application is a manifest declared in its own folder:
 *
 *   defineApp({
 *     id: 'support-desk', route: 'support', title: 'Support Desk',
 *     tagline, icon, inputLabel, placeholder, samples: [...],
 *     steps: [{ name, label, run(text, outputs, ctx), schema, instructions }],
 *     view: [{ type: 'fields'|'list'|'editable'|'text', step, field|fields, title }],
 *     approveLabel, notice,
 *   })
 *
 * The core never names an application. Browser-safe: no Node.js imports.
 */

import { isSchemaType } from './schema.js';

const ID = /^[a-z][a-z0-9-]{1,40}$/;
const STEP = /^[a-z][a-zA-Z0-9]{0,40}$/;
const RESERVED_ROUTES = new Set(['api', 'assets', 'src', 'apps', 'health']);
const SECTION_TYPES = new Set(['fields', 'list', 'editable', 'text']);

function fail(appId, message) {
  throw new TypeError(`Invalid app manifest "${appId ?? '?'}": ${message}`);
}

function nonEmpty(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

export function defineApp(manifest) {
  const m = manifest || {};
  const id = m.id;
  if (typeof id !== 'string' || !ID.test(id)) fail(id, 'id must be lowercase letters, digits and dashes');
  if (typeof m.route !== 'string' || !ID.test(m.route) || RESERVED_ROUTES.has(m.route)) fail(id, 'route must be a lowercase slug and not reserved');
  for (const key of ['title', 'tagline', 'inputLabel', 'placeholder']) {
    if (!nonEmpty(m[key])) fail(id, `${key} is required`);
  }
  if (!Array.isArray(m.samples) || m.samples.length === 0 || !m.samples.every(nonEmpty)) fail(id, 'samples must be a non-empty list of strings');
  if (!Array.isArray(m.steps) || m.steps.length === 0) fail(id, 'at least one step is required');

  const steps = new Map();
  for (const step of m.steps) {
    if (!step || typeof step.name !== 'string' || !STEP.test(step.name)) fail(id, 'step names must be camelCase identifiers');
    if (steps.has(step.name)) fail(id, `duplicate step "${step.name}"`);
    if (typeof step.run !== 'function') fail(id, `step "${step.name}" needs an offline run function`);
    if (!step.schema || typeof step.schema !== 'object' || Object.keys(step.schema).length === 0) fail(id, `step "${step.name}" needs a schema`);
    for (const [field, type] of Object.entries(step.schema)) {
      if (!isSchemaType(type)) fail(id, `step "${step.name}" field "${field}" has an unknown schema type`);
    }
    if (!nonEmpty(step.label)) fail(id, `step "${step.name}" needs a label`);
    if (!nonEmpty(step.instructions)) fail(id, `step "${step.name}" needs model instructions`);
    steps.set(step.name, step);
  }

  if (!Array.isArray(m.view) || m.view.length === 0) fail(id, 'view must list at least one section');
  let editable = 0;
  for (const section of m.view) {
    if (!section || !SECTION_TYPES.has(section.type)) fail(id, 'unknown view section type');
    const step = steps.get(section.step);
    if (!step) fail(id, `view references unknown step "${section.step}"`);
    if (!nonEmpty(section.title)) fail(id, 'every view section needs a title');
    const fields = section.type === 'fields' ? section.fields : [[section.field]];
    if (!Array.isArray(fields) || fields.length === 0) fail(id, 'fields section needs fields');
    for (const [field] of fields) {
      if (!(field in step.schema)) fail(id, `view references unknown field "${section.step}.${field}"`);
    }
    if (section.type === 'list' && step.schema[section.field] !== 'strings') fail(id, `list section "${section.field}" must use a strings field`);
    if ((section.type === 'editable' || section.type === 'text') && step.schema[section.field] !== 'string') fail(id, `${section.type} section "${section.field}" must use a string field`);
    if (section.type === 'editable') editable++;
  }
  if (editable > 1) fail(id, 'at most one editable section is allowed');

  return Object.freeze({ approveLabel: 'Approve', icon: '🦴', notice: 'Approval records a decision only. Nothing is sent, booked or charged.', ...m });
}

/** Data-only description of an app, safe to embed in HTML or send to the browser. */
export function publicView(app) {
  return {
    id: app.id, route: app.route, title: app.title, tagline: app.tagline, icon: app.icon,
    inputLabel: app.inputLabel, placeholder: app.placeholder, samples: [...app.samples],
    approveLabel: app.approveLabel, notice: app.notice,
    steps: app.steps.map((s) => ({ name: s.name, label: s.label })),
    view: app.view.map((s) => JSON.parse(JSON.stringify(s))),
  };
}

export function createRegistry(apps) {
  const byId = new Map();
  const byRoute = new Map();
  for (const app of apps) {
    if (!app || !Object.isFrozen(app)) throw new TypeError('Register apps created with defineApp()');
    if (byId.has(app.id)) throw new TypeError(`Duplicate app id "${app.id}"`);
    if (byRoute.has(app.route)) throw new TypeError(`Duplicate app route "${app.route}"`);
    byId.set(app.id, app);
    byRoute.set(app.route, app);
  }
  return Object.freeze({
    ids: Object.freeze([...byId.keys()]),
    list: () => [...byId.values()],
    get: (id) => byId.get(id),
    byRoute: (route) => byRoute.get(route),
    has: (id) => byId.has(id),
  });
}
