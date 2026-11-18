/**
 * Run stores. Both adapters share one interface and the lifecycle in
 * src/lifecycle.js (also used by the browser-only public demo):
 *
 *   createRun(appId, mode, outputs, trace, { input, profileUsed }) → run
 *   getRun(id)                                                     → run | undefined
 *   listRuns({ appId }?)                                           → run[]
 *   saveReview(id, { decision, editedDraft, expectedVersion })     → run
 *
 * Errors: NotFoundError (TypeError) for unknown ids, ValidationError (TypeError)
 * for malformed reviews, ConflictError (RangeError) for stale/repeated decisions.
 * Stores never name an application; JsonStore accepts an `isKnownApp` predicate.
 */

import { readFileSync, writeFileSync, mkdirSync, renameSync, existsSync } from 'node:fs';
import { dirname } from 'node:path';
import { NotFoundError } from './errors.js';
import { SCHEMA_VERSION, makeRun, applyReview, isValidStoredRun } from './lifecycle.js';

export { SCHEMA_VERSION };

const SLUG = /^[a-z][a-z0-9-]{1,40}$/;
const defaultIsKnownApp = (id) => typeof id === 'string' && SLUG.test(id);

class BaseStore {
  _runs = new Map();

  createRun(appId, mode, outputs, trace, extra = {}) {
    const run = makeRun({ appId, mode, outputs, trace, ...extra });
    this._runs.set(run.id, run);
    try { this._persist(); } catch (error) { this._runs.delete(run.id); throw error; }
    return run;
  }

  getRun(id) {
    return this._runs.get(id);
  }

  listRuns({ appId } = {}) {
    const runs = [...this._runs.values()];
    return appId ? runs.filter((r) => r.appId === appId) : runs;
  }

  saveReview(id, body) {
    const run = this._runs.get(id);
    if (!run) throw new NotFoundError(`Run not found: ${id}`);
    const updated = applyReview(run, body);
    this._runs.set(id, updated);
    try { this._persist(); } catch (error) { this._runs.set(id, run); throw error; }
    return updated;
  }

  _persist() {}
}

export class MemoryStore extends BaseStore {}

export class JsonStore extends BaseStore {
  #path;
  #isKnownApp;

  constructor(filePath, { isKnownApp = defaultIsKnownApp } = {}) {
    super();
    this.#path = filePath;
    this.#isKnownApp = isKnownApp;
    this._runs = this.#load();
  }

  #load() {
    if (!existsSync(this.#path)) return new Map();
    let raw;
    try {
      raw = readFileSync(this.#path, 'utf8');
    } catch {
      throw new Error(`Cannot read store file: ${this.#path}`);
    }
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new Error(`Store file is corrupt (invalid JSON): ${this.#path}`);
    }
    if (typeof parsed !== 'object' || parsed === null || !Array.isArray(parsed.runs)) {
      throw new Error(`Store file has unexpected shape: ${this.#path}`);
    }
    if (parsed.schemaVersion !== SCHEMA_VERSION) {
      throw new Error(`Unsupported schema version ${parsed.schemaVersion} in ${this.#path} (expected ${SCHEMA_VERSION})`);
    }
    const map = new Map();
    for (const run of parsed.runs) {
      if (!isValidStoredRun(run, this.#isKnownApp) || map.has(run.id)) {
        throw new Error('Store contains an invalid run record');
      }
      map.set(run.id, run);
    }
    return map;
  }

  _persist() {
    mkdirSync(dirname(this.#path), { recursive: true });
    const payload = JSON.stringify({ schemaVersion: SCHEMA_VERSION, runs: [...this._runs.values()] }, null, 2);
    // Atomic replace: write a temp file in the same directory, then rename.
    const tmp = this.#path + '.tmp';
    writeFileSync(tmp, payload, 'utf8');
    renameSync(tmp, this.#path);
  }
}
