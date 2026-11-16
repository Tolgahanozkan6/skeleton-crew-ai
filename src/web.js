// Load optional local configuration without overriding exported environment values.
import { existsSync } from 'node:fs';
if (existsSync('.env')) process.loadEnvFile('.env');
const { startServer } = await import('./server.js');
const port = Number(process.env.PORT || 3000);
startServer(port);
