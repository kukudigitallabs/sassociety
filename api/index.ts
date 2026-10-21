import path from 'node:path';
import fs from 'node:fs';
import { handleApiRequest, sendJson } from '../server/routes.ts';
import { initDatabase, seedInitialDataIfEmpty } from '../server/db.ts';
import { extractBearerToken, verifyJwt } from '../server/security.ts';
import { syncToMysqlAfterWrite } from '../server/mysql.ts';

const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

let dbInitialized = false;
function ensureDb() {
  if (!dbInitialized) {
    try {
      initDatabase();
      seedInitialDataIfEmpty();
      dbInitialized = true;
    } catch (err) {
      console.error('[Database Init Warning]:', err);
    }
  }
}

function getStaticMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.png': return 'image/png';
    case '.jpg':
    case '.jpeg': return 'image/jpeg';
    case '.webp': return 'image/webp';
    case '.pdf': return 'application/pdf';
    default: return 'application/octet-stream';
  }
}

async function readRawBody(req: any): Promise<Buffer | null> {
  if (req.method === 'GET' || req.method === 'HEAD') return null;
  if (typeof req.body === 'string') return Buffer.from(req.body);
  if (Buffer.isBuffer(req.body)) return req.body;
  if (typeof req.body === 'object' && req.body !== null) return Buffer.from(JSON.stringify(req.body));
  return new Promise((resolve) => {
    const chunks: Buffer[] = [];
    if (!req.on) {
      resolve(null);
      return;
    }
    req.on('data', (c: Buffer) => chunks.push(c));
    req.on('end', () => resolve(chunks.length > 0 ? Buffer.concat(chunks) : null));
    req.on('error', () => resolve(null));
  });
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

  const configuredBackend = (process.env.BACKEND_API_URL || process.env.VITE_API_URL || '').trim().replace(/\/+$/, '');
  const isExternalBackend = /^https?:\/\//i.test(configuredBackend);
  const host = req.headers['host'] || 'localhost';
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const reqUrl = req.url || '/';

  // 1. If an external production backend is configured (e.g. Hostinger VPS / subdomain), proxy to it
  if (isExternalBackend) {
    try {
      const targetUrl = `${configuredBackend}${reqUrl.startsWith('/') ? reqUrl : `/${reqUrl}`}`;
      const forwardHeaders: Record<string, string> = {};
      for (const [k, v] of Object.entries(req.headers)) {
        if (k.toLowerCase() === 'host') continue;
        if (typeof v === 'string') forwardHeaders[k] = v;
      }

      const rawBody = await readRawBody(req);

      const upstreamRes = await fetch(targetUrl, {
        method: req.method,
        headers: forwardHeaders,
        body: rawBody || undefined,
      });

      res.writeHead(upstreamRes.status, Object.fromEntries(upstreamRes.headers.entries()));
      const upstreamBody = await upstreamRes.arrayBuffer();
      res.end(Buffer.from(upstreamBody));
      return;
    } catch (proxyErr: any) {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: `Failed to proxy to backend at ${configuredBackend}: ${proxyErr.message}` }));
      return;
    }
  }

  // 2. Otherwise run full SocietyOS server routes locally within Vercel Serverless Function
  try {
    ensureDb();

    const url = new URL(reqUrl, `${proto}://${host}`);
    const method = (req.method || 'GET').toUpperCase();

    // Serve uploaded files securely if stored in uploads directory
    if (url.pathname.startsWith('/uploads/')) {
      const safeFile = path.basename(url.pathname);
      const uploadsDir = isServerless ? path.join('/tmp', 'uploads') : path.join(process.cwd(), 'data', 'uploads');
      const filePath = path.join(uploadsDir, safeFile);
      if (fs.existsSync(filePath)) {
        res.writeHead(200, { 'Content-Type': getStaticMimeType(safeFile) });
        fs.createReadStream(filePath).pipe(res);
        return;
      }
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'File not found' }));
      return;
    }

    const token = extractBearerToken(req);
    const auth = token ? verifyJwt(token) : null;

    let body: Record<string, any> = {};
    if (method !== 'GET' && method !== 'HEAD') {
      const raw = await readRawBody(req);
      if (raw && raw.length > 0) {
        try {
          body = JSON.parse(raw.toString('utf-8'));
        } catch {
          body = {};
        }
      }
    }

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
