import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

process.chdir(fileURLToPath(new URL('../', import.meta.url)));
const bundled = resolve('../ollama-runtime/ollama');
const useBundled = existsSync(bundled) && !process.env.OLLAMA_BIN;
const binary = process.env.OLLAMA_BIN || (useBundled ? bundled : 'ollama');
let daemon;
try { await fetch('http://127.0.0.1:11434/api/tags', { signal: AbortSignal.timeout(5000) }); }
catch {
  daemon = spawn(binary, ['serve'], { env: { ...process.env, ...(useBundled ? { OLLAMA_MODELS: resolve('../ollama-models') } : {}), OLLAMA_HOST: '127.0.0.1:11434', OLLAMA_NO_CLOUD: '1' }, stdio: 'ignore' });
  daemon.on('error', () => { console.error('Ollama not installed. See README free local AI setup.'); process.exit(1); });
}
let ready = false;
for (let i = 0; i < 60; i++) {
  try {
    const result = await (await fetch('http://127.0.0.1:11434/api/tags', { signal: AbortSignal.timeout(5000) })).json();
    if (!result.models?.some(x => x.name === 'qwen3:1.7b')) {
      console.error('Model missing. Install qwen3:1.7b in Ollama first.');
      process.exitCode = 1;
      break;
    }
    ready = true; break;
  } catch { await new Promise(r => setTimeout(r, 500)); }
}
if (ready) {
  process.env.CREW_MODE = 'live';
  process.env.CREW_PROVIDER = 'ollama';
  process.env.CREW_MODEL = 'qwen3:1.7b';
  await import('../src/web.js');
} else {
  daemon?.kill();
  process.exitCode = 1;
}
