import test from 'node:test';
import assert from 'node:assert/strict';
import { OllamaAdapter } from '../src/ollama-provider.js';

test('local adapter uses loopback only, JSON schema, no key, three-call budget', async () => {
  const original = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async (url, options) => {
    assert.equal(url, 'http://127.0.0.1:11434/api/chat');
    assert.equal(options.headers.Authorization, undefined);
    const body = JSON.parse(options.body);
    assert.equal(body.stream, false);
    assert.equal(body.think, false);
    assert.equal(body.format.properties.output.properties.bookingConfirmed.const, false);
    calls++;
    return { ok: true, json: async () => ({ message: { content: '{"output":{"bookingConfirmed":false}}' } }) };
  };
  try {
    const adapter = new OllamaAdapter();
    for (let i = 0; i < 3; i++) await adapter.generate({ role: 'planner', input: 'test', context: { schema: { bookingConfirmed: false } } });
    await assert.rejects(adapter.generate({ role: 'planner', context: {} }), /budget/);
    assert.equal(calls, 3);
  } finally { globalThis.fetch = original; }
});
test('local adapter rejects invalid JSON and unavailable model', async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async () => ({ ok: true, json: async () => ({ message: { content: 'bad' } }) });
    await assert.rejects(new OllamaAdapter().generate({ role: 'reply', input: 'x', context: { schema: {} } }));
    globalThis.fetch = async () => ({ ok: false });
    await assert.rejects(new OllamaAdapter().generate({ role: 'reply', input: 'x', context: { schema: {} } }), /unavailable/);
  } finally { globalThis.fetch = original; }
});
