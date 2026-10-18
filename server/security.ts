import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type { IncomingMessage } from 'node:http';

// Load .env file if present without overriding existing process.env variables
try {
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^['"]|['"]$/g, '');
      if (key && process.env[key] === undefined) {
        process.env[key] = val;
      }
    }
  }
} catch {
  // Ignore .env load errors
}

const JWT_SECRET = process.env.JWT_SECRET || 'society-saas-super-secret-jwt-key-2026-production-grade';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';
const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || '';

export function getRazorpayKeyId(): string {
  return process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || '';
}

export function getRazorpayKeySecret(): string {
  return process.env.RAZORPAY_KEY_SECRET || '';
}

export type UserRole = 'SUPER_ADMIN' | 'SOCIETY_ADMIN' | 'STAFF' | 'MEMBER';

export type StaffPermissionKey =
  | 'view_members'
  | 'manage_members'
  | 'generate_bills'
  | 'verify_payments'
  | 'manage_expenses'
  | 'view_financial_reports'
  | 'manage_complaints'
  | 'manage_events'
  | 'manage_staff'
  | 'change_society_settings';

export interface AuthTokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  societyId: string | null;
  exp: number;
}

/**
 * Normalizes flat/house numbers consistently across frontend & backend.
 * Trims whitespace, uppercases, and normalizes spacing around hyphens.
 * Example: " a - 101 " -> "A-101", "b 204" -> "B 204"
 */
export function normalizeFlatNumber(flatNumber: string): string {
  return String(flatNumber || '')
    .trim()
    .toUpperCase()
    .replace(/\s*-\s*/g, '-')
    .replace(/\s+/g, ' ');
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, key] = (storedHash || '').split(':');
  if (!salt || !key) return false;
  const derived = crypto.scryptSync(password, salt, 64);
  const keyBuf = Buffer.from(key, 'hex');
  if (derived.length !== keyBuf.length) return false;
  return crypto.timingSafeEqual(derived, keyBuf);
}

export function signJwt(payload: Omit<AuthTokenPayload, 'exp'>, ttlSeconds = 86400): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const fullPayload: AuthTokenPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
  };
  const body = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${header}.${body}`)
    .digest('base64url');
  return `${header}.${body}.${signature}`;
}

export function verifyJwt(token: string): AuthTokenPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, body, sig] = parts;
    const expectedSig = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${header}.${body}`)
      .digest('base64url');
    const sigBuf = Buffer.from(sig);
    const expectedBuf = Buffer.from(expectedSig);
    if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
      return null;
    }
    const decoded = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as AuthTokenPayload;
    if (!decoded.exp || decoded.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}

export function extractBearerToken(req: IncomingMessage): string | null {
  const authHeader = req.headers['authorization'];
  if (!authHeader || typeof authHeader !== 'string') return null;
  if (!authHeader.startsWith('Bearer ')) return null;
  return authHeader.slice(7).trim();
}

/**
 * Generates a cryptographic Razorpay signature for order_id|payment_id
 * (Used by sandbox simulator and verified on backend)
 */
export function createRazorpayPaymentSignature(orderId: string, paymentId: string, secret = RAZORPAY_KEY_SECRET): string {
  return crypto
    .createHmac('sha256', secret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
}

export function verifyRazorpayPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string,
  secret = RAZORPAY_KEY_SECRET
): boolean {
  if (!orderId || !paymentId || !signature) return false;
  const expected = createRazorpayPaymentSignature(orderId, paymentId, secret);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function createRazorpayWebhookSignature(rawBody: string, secret = RAZORPAY_WEBHOOK_SECRET): string {
  return crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
}

export function verifyRazorpayWebhookSignature(rawBody: string, signature: string, secret = RAZORPAY_WEBHOOK_SECRET): boolean {
  if (!rawBody || !signature) return false;
  const expected = createRazorpayWebhookSignature(rawBody, secret);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/**
 * Masks sensitive Aadhaar or identity document numbers so full numbers are never exposed publicly.
 * Example: "1234 5678 9012" -> "XXXX-XXXX-9012"
 */
export function maskDocumentNumber(docType: string, rawNumber: string): string {
  const cleaned = String(rawNumber || '').replace(/\s+/g, '');
  if (cleaned.length <= 4) return 'XXXX';
  const last4 = cleaned.slice(-4);
  if (docType.toUpperCase().includes('AADHAAR')) {
    return `XXXX-XXXX-${last4}`;
  }
  return `${'X'.repeat(Math.max(4, cleaned.length - 4))}${last4}`;
}

// Simple in-memory rate limiter for auth & public enrolment endpoints
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(key: string, maxRequests = 60, windowMs = 60_000): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(key);
  if (!entry || entry.resetAt < now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= maxRequests) {
    return false;
  }
  entry.count += 1;
  return true;
}
