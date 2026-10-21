import path from 'node:path';
import fs from 'node:fs';
import { handleApiRequest, sendJson } from '../server/routes.ts';
import { initDatabase, seedInitialDataIfEmpty } from '../server/db.ts';
import { extractBearerToken, verifyJwt } from '../server/security.ts';
import { syncToMysqlAfterWrite } from '../server/mysql.ts';

// On Vercel, use /tmp for SQLite database if not explicitly set
if (!process.env.SQLITE_DB_PATH && (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME)) {
  process.env.SQLITE_DB_PATH = path.join('/tmp', 'society_saas.db');
}

const remoteBackend = (process.env.BACKEND_API_URL || process.env.VITE_API_URL || '').trim().replace(/\/+$/, '');

let dbReady = false;
function ensureInit() {
  if (!dbReady && !remoteBackend) {
    try {
      initDatabase();
      seedInitialDataIfEmpty();
    } catch (e) {
      console.error('[Vercel Serverless DB Init Error]', e);
    }
    dbReady = true;
  }
}

export default async function handler(req: any, res: any) {
  // Global CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const host = req.headers['host'] || 'localhost';
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const reqUrl = req.url || '/';

  // 1. If an external production backend is configured (e.g. Hostinger VPS / subdomain), proxy to it
  if (remoteBackend) {
    try {
      const targetUrl = `${remoteBackend}${reqUrl.startsWith('/') ? reqUrl : `/${reqUrl}`}`;
      const forwardHeaders: Record<string, string> = {};
      for (const [k, v] of Object.entries(req.headers)) {
        if (k.toLowerCase() === 'host') continue;
        if (typeof v === 'string') forwardHeaders[k] = v;
      }

      const bodyData = ['GET', 'HEAD'].includes(req.method)
        ? undefined
        : (typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {}));

      const upstreamRes = await fetch(targetUrl, {
        method: req.method,
        headers: forwardHeaders,
        body: bodyData,
      });

      res.writeHead(upstreamRes.status, Object.fromEntries(upstreamRes.headers.entries()));
      const upstreamBody = await upstreamRes.arrayBuffer();
      res.end(Buffer.from(upstreamBody));
      return;
    } catch (proxyErr: any) {
      sendJson(res, 502, { error: `Failed to connect to remote backend at ${remoteBackend}: ${proxyErr.message}` });
      return;
    }
  }

  // 2. Otherwise run full SocietyOS server routes locally within Vercel Serverless Function
  ensureInit();

  try {
    const url = new URL(reqUrl, `${proto}://${host}`);
    const method = (req.method || 'GET').toUpperCase();
    const token = extractBearerToken(req);
    const auth = token ? verifyJwt(token) : null;
    const body = ['GET', 'HEAD'].includes(method)
      ? {}
      : (typeof req.body === 'object' && req.body !== null ? req.body : (req.body ? JSON.parse(String(req.body)) : {}));

    await handleApiRequest({
      req,
      res,
      url,
      method,
      body,
      auth,
    });

    if (method !== 'GET' && method !== 'HEAD') {
      syncToMysqlAfterWrite();
    }
  } catch (err: any) {
    if (!res.headersSent) {
      sendJson(res, 500, { error: err?.message || 'Internal Server Error' });
    }
  }
}
