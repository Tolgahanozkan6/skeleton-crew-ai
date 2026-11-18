/**
 * Typed errors shared by store, lifecycle and server.
 * They extend the built-in classes earlier code and tests rely on,
 * so `instanceof TypeError` / `instanceof RangeError` keep working.
 * Check order in the server: NotFound → Conflict → Validation.
 */

export class ValidationError extends TypeError {
  constructor(message) { super(message); this.name = 'ValidationError'; }
}

export class NotFoundError extends TypeError {
  constructor(message = 'Not found') { super(message); this.name = 'NotFoundError'; }
}

export class ConflictError extends RangeError {
  constructor(message) { super(message); this.name = 'ConflictError'; }
}

export class PayloadTooLargeError extends Error {
  constructor(message = 'Request body too large') { super(message); this.name = 'PayloadTooLargeError'; }
}
