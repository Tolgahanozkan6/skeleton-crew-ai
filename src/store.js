/**
 * Run store and review service (T3).
 *
 * Two adapters share the same interface:
 *   createRun(appId, mode, outputs, trace)  → run object
 *   getRun(id)                              → run | undefined
 *   listRuns()                              → run[]
 *   saveReview(id, { decision, editedDraft, expectedVersion }) → run
 *
 * Status lifecycle: running → awaiting_human_review | failed
 *                   awaiting_human_review → approved | rejected
 * Invalid transitions throw RangeError.  Duplicate decisions throw RangeError.
 * Stale version (expectedVersion mismatch) throws RangeError.
 * Unknown run id throws TypeError.
 */

import { randomUUID } from 'node:crypto';

export const SCHEMA_VERSION = 1;

// ── pure helpers ─────────────────────────────────────────────────────────────

function makeRun(appId, mode, outputs, trace, status) {
  return {
    schemaVersion: SCHEMA_VERSION,
    id: randomUUID(),
    appId,
    mode,
    status,
    version: 1,
    outputs,
    trace,
    error: status === 'failed' ? (trace.at(-1)?.error ?? null) : null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    review: null,
  };
}

function applyReview(run, decision, editedDraft, expectedVersion) {
  if (!run) throw new TypeError('Run not found');
  if (run.version !== expectedVersion) {
    throw new RangeError(
      `Stale version: expected ${run.version}, got ${expectedVersion}`
    );
  }
  if (run.status !== 'awaiting_human_review') {
    throw new RangeError(
      `Cannot review a run with status "${run.status}"`
    );
  }
  if (!['approved', 'rejected'].includes(decision)) {
    throw new TypeError(`Unknown decision "${decision}"`);
  }
  const updated = {
    ...run,
    status: decision,
    version: run.version + 1,
    updatedAt: new Date().toISOString(),
    review: {
      decision,
      editedDraft: editedDraft ?? null,
      createdAt: new Date().toISOString(),
      version: run.version + 1,
    },
  };
  return updated;
}

// ── in-memory store ──────────────────────────────────────────────────────────

export class MemoryStore {
  #runs = new Map();

  createRun(appId, mode, outputs, trace) {
    const status =
      trace.some((t) => t.status === 'failed')
        ? 'failed'
        : 'awaiting_human_review';
    const run = makeRun(appId, mode, outputs, trace, status);
    this.#runs.set(run.id, run);
    return run;
  }

  getRun(id) {
    return this.#runs.get(id);
  }

  listRuns() {
    return [...this.#runs.values()];
  }

  saveReview(id, { decision, editedDraft = null, expectedVersion }) {
    const run = this.#runs.get(id);
    if (!run) throw new TypeError(`Run not found: ${id}`);
    const updated = applyReview(run, decision, editedDraft, expectedVersion);
    this.#runs.set(id, updated);
    return updated;
  }
}

// ── JSON file adapter ────────────────────────────────────────────────────────

import { readFileSync, writeFileSync, mkdirSync, renameSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';

export class JsonStore {
  #path;
  #runs;   // Map<id, run>

  constructor(filePath) {
    this.#path = filePath;
    this.#runs = this.#load();
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
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      !Array.isArray(parsed.runs)
    ) {
      throw new Error(`Store file has unexpected shape: ${this.#path}`);
    }
    if (parsed.schemaVersion !== SCHEMA_VERSION) {
      throw new Error(
        `Unsupported schema version ${parsed.schemaVersion} in ${this.#path} (expected ${SCHEMA_VERSION})`
      );
    }
    const map = new Map();
    for (const run of parsed.runs) map.set(run.id, run);
    return map;
  }

  #save() {
    const dir = dirname(this.#path);
    mkdirSync(dir, { recursive: true });
    const payload = JSON.stringify(
      { schemaVersion: SCHEMA_VERSION, runs: [...this.#runs.values()] },
      null,
      2
    );
    // Atomic write: write to temp then rename
    const tmp = this.#path + '.tmp';
    writeFileSync(tmp, payload, 'utf8');
    renameSync(tmp, this.#path);
  }

  createRun(appId, mode, outputs, trace) {
    const status =
      trace.some((t) => t.status === 'failed')
        ? 'failed'
        : 'awaiting_human_review';
    const run = makeRun(appId, mode, outputs, trace, status);
    this.#runs.set(run.id, run);
    this.#save();
    return run;
  }

  getRun(id) {
    return this.#runs.get(id);
  }

  listRuns() {
    return [...this.#runs.values()];
  }

  saveReview(id, { decision, editedDraft = null, expectedVersion }) {
    const run = this.#runs.get(id);
    if (!run) throw new TypeError(`Run not found: ${id}`);
    const updated = applyReview(run, decision, editedDraft, expectedVersion);
    this.#runs.set(id, updated);
    this.#save();
    return updated;
  }
}
