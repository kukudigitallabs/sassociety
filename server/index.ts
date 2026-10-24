import http, { type IncomingMessage, type ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { initDatabase, seedInitialDataIfEmpty, db, sendNotification } from './db.ts';
import { initMysqlBackend, syncToMysqlAfterWrite } from './mysql.ts';
import { extractBearerToken, verifyJwt } from './security.ts';
import { handleApiRequest, sendJson } from './routes.ts';

initDatabase();
seedInitialDataIfEmpty();

/**
 * Scheduled server-side job for recurring reminders (Section 16):
 * - Upcoming bill due dates
 * - Overdue payment reminders
 * - Trial expiry & subscription renewal alerts
 * Deduplicated via `dedup_key` so repeated notifications are never sent unintentionally.
 */
export function runScheduledRemindersJob(): void {
  try {
    // 1. Overdue bills check
    const overdueBills = db.prepare(`
      SELECT mb.id, mb.bill_number, mb.society_id, mb.balance_amount, mb.due_date, sm.user_id
      FROM member_bills mb
      LEFT JOIN society_members sm ON sm.id = mb.member_id
      WHERE mb.balance_amount > 0
        AND mb.due_date < date('now')
        AND mb.status IN ('UNPAID', 'PARTIALLY_PAID')
    `).all() as Record<string, any>[];

    for (const b of overdueBills) {
      db.prepare("UPDATE member_bills SET status = 'OVERDUE' WHERE id = ? AND status = 'UNPAID'").run(b.id);
      if (b.user_id) {
        sendNotification({
          societyId: b.society_id,
          userId: b.user_id,
          notificationType: 'OVERDUE_PAYMENT',
          title: `Overdue Bill Reminder: ${b.bill_number}`,
          message: `Your society bill ${b.bill_number} of ₹${b.balance_amount} was due on ${b.due_date}. Please submit payment to avoid late fees.`,
          channel: 'EMAIL',
          dedupKey: `overdue:${b.id}:${new Date().toISOString().slice(0, 10)}`,
        });
      }
    }

    // 2. Trial & Subscription expiry reminders
    const expiringSocieties = db.prepare(`
      SELECT id, name, admin_user_id, subscription_status, trial_ends_at, subscription_ends_at
      FROM societies
      WHERE account_status = 'ACTIVE'
    `).all() as Record<string, any>[];

    for (const s of expiringSocieties) {
      const targetDate = s.subscription_status === 'TRIAL' ? s.trial_ends_at : s.subscription_ends_at;
      if (!targetDate || !s.admin_user_id) continue;
      const daysLeft = Math.ceil((new Date(targetDate).getTime() - Date.now()) / 86400_000);
      if (daysLeft >= 0 && daysLeft <= 30) {
        sendNotification({
          societyId: s.id,
          userId: s.admin_user_id,
          notificationType: s.subscription_status === 'TRIAL' ? 'TRIAL_EXPIRY' : 'SUBSCRIPTION_RENEWAL',
          title: `${s.subscription_status === 'TRIAL' ? 'Free Trial' : 'Subscription'} Expiring in ${daysLeft} Day(s)`,
          message: `Your ${s.name} plan expires on ${String(targetDate).slice(0, 10)}. Renew now for uninterrupted access.`,
          channel: 'EMAIL',
          dedupKey: `sub-exp:${s.id}:${String(targetDate).slice(0, 10)}`,
        });
      }
    }
    syncToMysqlAfterWrite();
  } catch (err) {
    console.error('[Reminder Job Error]', err);
  }
}

async function parseJsonBody(req: IncomingMessage): Promise<Record<string, any>> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let totalBytes = 0;
    req.on('data', (chunk: Buffer) => {
      totalBytes += chunk.byteLength;
      if (totalBytes > 10 * 1024 * 1024) {
        reject(new Error('Request payload too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      if (chunks.length === 0) {
        resolve({});
        return;
      }
      try {
        const raw = Buffer.concat(chunks).toString('utf8');
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        resolve({});
      }
    });
    req.on('error', reject);
  });
}

function getStaticMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.html':
      return 'text/html; charset=utf-8';
    case '.js':
    case '.mjs':
      return 'text/javascript; charset=utf-8';
    case '.css':
      return 'text/css; charset=utf-8';
    case '.json':
      return 'application/json; charset=utf-8';
    case '.svg':
      return 'image/svg+xml';
    case '.png':
      return 'image/png';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.webp':
      return 'image/webp';
    case '.ico':
      return 'image/x-icon';
    case '.woff':
      return 'font/woff';
    case '.woff2':
      return 'font/woff2';
    case '.ttf':
      return 'font/ttf';
    case '.pdf':
      return 'application/pdf';
    default:
      return 'application/octet-stream';
  }
}

export async function createServer(options: { withVite?: boolean } = { withVite: true }) {
  await initMysqlBackend();

  let vite: any = null;
  const isProd = process.env.NODE_ENV === 'production';
  if (options.withVite && !isProd && process.env.NODE_ENV !== 'test') {
    const { createServer: createViteServer } = await import('vite');
    vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
  }

  const server = http.createServer(async (req: IncomingMessage, res: ServerResponse) => {
    const host = req.headers.host || 'localhost:4000';
    const url = new URL(req.url || '/', `http://${host}`);
    const method = (req.method || 'GET').toUpperCase();

    // CORS headers for mobile/tablet/web clients
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    // Serve uploaded files securely from /uploads/*
    if (url.pathname.startsWith('/uploads/')) {
      const safeFile = path.basename(url.pathname);
      const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
      const uploadDir = isServerless ? path.join('/tmp', 'uploads') : path.join(process.cwd(), 'data', 'uploads');
      const filePath = path.join(uploadDir, safeFile);
      if (fs.existsSync(filePath)) {
        res.writeHead(200, { 'Content-Type': getStaticMimeType(safeFile) });
        fs.createReadStream(filePath).pipe(res);
        return;
      }
      res.writeHead(404);
      res.end('File not found');
      return;
    }

    // API Requests
    if (url.pathname.startsWith('/api/')) {
      try {
        const body = method === 'GET' || method === 'HEAD' ? {} : await parseJsonBody(req);
        const token = extractBearerToken(req);
        const auth = token ? verifyJwt(token) : null;
        await handleApiRequest({ req, res, url, method, body, auth });
        if (method !== 'GET' && method !== 'HEAD') {
          syncToMysqlAfterWrite();
        }
      } catch (err: any) {
        sendJson(res, 400, { error: err?.message || 'Bad request' });
      }
      return;
    }

    // Frontend SPA via Vite or static dist
    if (vite) {
      vite.middlewares(req, res, async () => {
        try {
          const indexHtmlPath = path.join(process.cwd(), 'index.html');
          let template = fs.readFileSync(indexHtmlPath, 'utf8');
          template = await vite.transformIndexHtml(url.pathname, template);
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(template);
        } catch (e: any) {
          vite.ssrFixStacktrace(e);
          res.writeHead(500);
          res.end(e.message);
        }
      });
      return;
    }

    // Look for static assets in ./dist first, then in current working directory root
    const assetCandidates = [
      path.join(process.cwd(), 'dist', url.pathname === '/' ? 'index.html' : url.pathname),
      path.join(process.cwd(), url.pathname === '/' ? 'index.html' : url.pathname),
    ];
    for (const candidate of assetCandidates) {
      if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
        res.writeHead(200, { 'Content-Type': getStaticMimeType(candidate) });
        fs.createReadStream(candidate).pipe(res);
        return;
      }
    }

    // Fallback to index.html for client-side SPA routing (dist/index.html or ./index.html)
    const fallbackCandidates = [
      path.join(process.cwd(), 'dist', 'index.html'),
      path.join(process.cwd(), 'index.html'),
    ];
    for (const fallback of fallbackCandidates) {
      if (fs.existsSync(fallback) && fs.statSync(fallback).isFile()) {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        fs.createReadStream(fallback).pipe(res);
        return;
      }
    }

    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('SocietyOS SaaS API Server Running.');
  });

  return server;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const port = Number(process.env.PORT || 4000);
  const isProd = process.env.NODE_ENV === 'production';

  createServer({ withVite: !isProd }).then((server) => {
    runScheduledRemindersJob();
    setInterval(runScheduledRemindersJob, 5 * 60_000).unref();

    server.listen(port, '0.0.0.0', () => {
      console.log(`SocietyOS Multi-Tenant SaaS Platform running at http://localhost:${port}`);
    });
  });
}
