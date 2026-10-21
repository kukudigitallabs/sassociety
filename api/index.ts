import path from 'node:path';

// On Vercel, ensure SQLite uses /tmp
if (!process.env.SQLITE_DB_PATH && (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME)) {
  process.env.SQLITE_DB_PATH = path.join('/tmp', 'society_saas.db');
}

let serverModule: any = null;
let initError: any = null;

async function loadServer() {
  if (serverModule) return serverModule;
  if (initError) throw initError;
  try {
    const routes = await import('../server/routes.ts');
    const db = await import('../server/db.ts');
    const security = await import('../server/security.ts');
    const mysql = await import('../server/mysql.ts');

    db.initDatabase();
    db.seedInitialDataIfEmpty();

    serverModule = {
      handleApiRequest: routes.handleApiRequest,
      sendJson: routes.sendJson,
      extractBearerToken: security.extractBearerToken,
      verifyJwt: security.verifyJwt,
      syncToMysqlAfterWrite: mysql.syncToMysqlAfterWrite,
    };
    return serverModule;
  } catch (err: any) {
    initError = err;
    console.error('[Vercel Serverless Initialization Error]:', err);
    throw err;
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

  const remoteBackend = (process.env.BACKEND_API_URL || process.env.VITE_API_URL || '').trim().replace(/\/+$/, '');
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
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: `Failed to proxy to backend at ${remoteBackend}: ${proxyErr.message}` }));
      return;
    }
  }

  // 2. Otherwise run full SocietyOS server routes locally within Vercel Serverless Function
  try {
    const srv = await loadServer();
    const url = new URL(reqUrl, `${proto}://${host}`);
    const method = (req.method || 'GET').toUpperCase();
    const token = srv.extractBearerToken(req);
    const auth = token ? srv.verifyJwt(token) : null;
    const body = ['GET', 'HEAD'].includes(method)
      ? {}
      : (typeof req.body === 'object' && req.body !== null ? req.body : (req.body ? JSON.parse(String(req.body)) : {}));

    await srv.handleApiRequest({
      req,
      res,
      url,
      method,
      body,
      auth,
    });

    if (method !== 'GET' && method !== 'HEAD') {
      srv.syncToMysqlAfterWrite();
    }
  } catch (err: any) {
    console.error('[API Execution Error]:', err);
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        error: err?.message || 'Internal Server Error',
        nodeVersion: process.version,
        detail: String(err?.stack || err),
      }));
    }
  }
}
