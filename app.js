/**
 * Hostinger Node.js Production Startup Entry Point (app.js)
 * ---------------------------------------------------------
 * Set Application Startup File in Hostinger hPanel -> Node.js to: app.js
 * Automatically loads .env, connects to Hostinger MySQL when MYSQL_* variables
 * are configured, serves the built React SPA from ./dist, and handles /api/* routes.
 */
import fs from 'node:fs';
import path from 'node:path';

// Load .env or hostinger.env if present
const envCandidate = path.join(process.cwd(), '.env');
const hostingerEnvCandidate = path.join(process.cwd(), 'hostinger.env');
const envPath = fs.existsSync(envCandidate) ? envCandidate : (fs.existsSync(hostingerEnvCandidate) ? hostingerEnvCandidate : null);
if (envPath) {
  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^['"]|['"]$/g, '');
    if (!process.env[key]) {
      process.env[key] = val;
    }
  }
}

// Default to production mode when dist/index.html or index.html exists
const distIndex = path.join(process.cwd(), 'dist', 'index.html');
const rootIndex = path.join(process.cwd(), 'index.html');
if (!process.env.NODE_ENV && (fs.existsSync(distIndex) || fs.existsSync(rootIndex))) {
  process.env.NODE_ENV = 'production';
}

// Prefer pre-compiled pure JavaScript server (dist-server/server.js) for Hostinger production compatibility
let serverModule;
const compiledServerPath = path.join(process.cwd(), 'dist-server', 'server.js');
if (fs.existsSync(compiledServerPath)) {
  serverModule = await import('./dist-server/server.js');
} else {
  serverModule = await import('./server/index.ts');
}

const { createServer, runScheduledRemindersJob } = serverModule;

const port = Number(process.env.PORT || 4000);
const isProd = process.env.NODE_ENV === 'production';

const server = await createServer({ withVite: !isProd });
if (typeof runScheduledRemindersJob === 'function') {
  runScheduledRemindersJob();
  setInterval(runScheduledRemindersJob, 5 * 60_000).unref();
}

server.listen(port, '0.0.0.0', () => {
  console.log(`[SocietyOS] Server running in ${isProd ? 'PRODUCTION' : 'DEVELOPMENT'} mode on port ${port}`);
});
