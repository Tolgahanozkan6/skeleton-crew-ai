import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';

test('MCP server: initialize, list tools, run a workflow, validate output', async () => {
  const child = spawn(process.execPath, ['scripts/mcp-server.mjs'], { stdio: ['pipe', 'pipe', 'inherit'] });
  const lines = createInterface({ input: child.stdout });
  const waiting = new Map();
  lines.on('line', (l) => { const m = JSON.parse(l); waiting.get(m.id)?.(m); });
  let n = 0;
  const rpc = (method, params) => new Promise((resolve) => {
    const id = ++n;
    waiting.set(id, resolve);
    child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n');
  });
  try {
    const init = await rpc('initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'test', version: '0' } });
    assert.equal(init.result.serverInfo.name, 'skeleton-crew');
    child.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n');

    const list = await rpc('tools/list', {});
    assert.deepEqual(list.result.tools.map((t) => t.name).sort(), ['list_apps', 'run_workflow', 'scaffold_app', 'validate_output']);

    const run = await rpc('tools/call', { name: 'run_workflow', arguments: { appId: 'job-planner', request: 'Acil tamir: dükkan kapısı bozuldu.' } });
    assert.equal(run.result.isError, false);
    const data = JSON.parse(run.result.content[0].text);
    assert.equal(data.status, 'awaiting_human_review');
    assert.equal(data.outputs.planner.bookingConfirmed, false);

    const bad = await rpc('tools/call', { name: 'validate_output', arguments: { appId: 'job-planner', step: 'planner', output: { tasks: [], bookingConfirmed: true, missingFactsCarried: [] } } });
    assert.equal(JSON.parse(bad.result.content[0].text).valid, false);

    const unknown = await rpc('tools/call', { name: 'run_workflow', arguments: { appId: 'nope', request: 'x' } });
    assert.equal(unknown.result.isError, true);

    const missing = await rpc('no/such/method', {});
    assert.equal(missing.error.code, -32601);
  } finally {
    child.kill();
  }
});
