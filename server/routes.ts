import type { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import Razorpay from 'razorpay';
import {
  db,
  uuid,
  bootstrapSocietyDefaults,
  logAudit,
  sendNotification,
} from './db.ts';
import { getDatabaseHealth } from './mysql.ts';
import {
  hashPassword,
  verifyPassword,
  signJwt,
  verifyJwt,
  extractBearerToken,
  normalizeFlatNumber,
  createRazorpayPaymentSignature,
  verifyRazorpayPaymentSignature,
  getRazorpayKeyId,
  getRazorpayKeySecret,
  maskDocumentNumber,
  checkRateLimit,
  type AuthTokenPayload,
  type StaffPermissionKey,
} from './security.ts';

function resolveRazorpayCredentials(societyId?: string | null): { keyId: string; keySecret: string } {
  if (societyId) {
    const socSettings = db
      .prepare('SELECT razorpay_key_id, razorpay_key_secret_encrypted FROM society_settings WHERE society_id = ?')
      .get(societyId) as { razorpay_key_id?: string | null; razorpay_key_secret_encrypted?: string | null } | undefined;
    if (socSettings?.razorpay_key_id && socSettings?.razorpay_key_secret_encrypted) {
      const secret = String(socSettings.razorpay_key_secret_encrypted).replace(/^enc_/, '');
      return {
        keyId: String(socSettings.razorpay_key_id).trim(),
        keySecret: secret.trim(),
      };
    }
  }
  const platform = db
    .prepare('SELECT razorpay_key_id, razorpay_key_secret_encrypted FROM platform_settings LIMIT 1')
    .get() as { razorpay_key_id?: string | null; razorpay_key_secret_encrypted?: string | null } | undefined;

  const envKeyId = getRazorpayKeyId();
  const envKeySecret = getRazorpayKeySecret();
  const dbSecret = platform?.razorpay_key_secret_encrypted
    ? String(platform.razorpay_key_secret_encrypted).replace(/^enc_/, '').trim()
    : '';
  const rawDbKeyId = platform?.razorpay_key_id
    ? String(platform.razorpay_key_id).replace('rzp_test_platform_demo_key', '').trim()
    : '';

  if (rawDbKeyId && dbSecret) {
    return {
      keyId: rawDbKeyId,
      keySecret: dbSecret,
    };
  }

  return {
    keyId: envKeyId || rawDbKeyId,
    keySecret: envKeySecret || dbSecret,
  };
}

export interface RequestContext {
  req: IncomingMessage;
  res: ServerResponse;
  url: URL;
  method: string;
  body: Record<string, any>;
  auth: AuthTokenPayload | null;
}

export function sendJson(res: ServerResponse, status: number, data: unknown): void {
  const payload = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end(payload);
}

export function getStaffPermissions(userId: string, societyId: string): Record<StaffPermissionKey, boolean> | null {
  const row = db.prepare(`
    SELECT rp.*
    FROM staff s
    JOIN role_permissions rp ON rp.role_id = s.role_id
    WHERE s.user_id = ? AND s.society_id = ? AND s.employment_status = 'ACTIVE'
    LIMIT 1
  `).get(userId, societyId) as Record<string, any> | undefined;

  if (!row) return null;
  return {
    view_members: Boolean(row.view_members),
    manage_members: Boolean(row.manage_members),
    generate_bills: Boolean(row.generate_bills),
    verify_payments: Boolean(row.verify_payments),
    manage_expenses: Boolean(row.manage_expenses),
    view_financial_reports: Boolean(row.view_financial_reports),
    manage_complaints: Boolean(row.manage_complaints),
    manage_events: Boolean(row.manage_events),
    manage_staff: Boolean(row.manage_staff),
    change_society_settings: Boolean(row.change_society_settings),
  };
}

function hasSocietyAccess(
  auth: AuthTokenPayload | null,
  requiredPermission?: StaffPermissionKey
): { ok: boolean; status: number; error?: string; societyId?: string } {
  if (!auth) {
    return { ok: false, status: 401, error: 'Authentication required.' };
  }
  if (auth.role === 'SUPER_ADMIN') {
    return {
      ok: false,
      status: 403,
      error: 'Super Admin panel is strictly separated from society administrator and member portals.',
    };
  }
  if (!auth.societyId) {
    return { ok: false, status: 403, error: 'No society associated with this account.' };
  }

  // Verify society status
  const society = db
    .prepare('SELECT id, account_status, approval_status, subscription_status FROM societies WHERE id = ?')
    .get(auth.societyId) as Record<string, any> | undefined;
  if (!society) {
    return { ok: false, status: 404, error: 'Society not found.' };
  }
  if (society.account_status === 'SUSPENDED' || society.account_status === 'ARCHIVED') {
    return { ok: false, status: 403, error: `Society account is currently ${society.account_status}.` };
  }

  if (auth.role === 'SOCIETY_ADMIN') {
    return { ok: true, status: 200, societyId: auth.societyId };
  }

  if (auth.role === 'STAFF') {
    if (!requiredPermission) {
      return { ok: true, status: 200, societyId: auth.societyId };
    }
    const perms = getStaffPermissions(auth.userId, auth.societyId);
    if (!perms || !perms[requiredPermission]) {
      return {
        ok: false,
        status: 403,
        error: `Access denied: your staff role does not have the '${requiredPermission}' permission.`,
      };
    }
    return { ok: true, status: 200, societyId: auth.societyId };
  }

  return { ok: false, status: 403, error: 'Administrative or authorized staff role required.' };
}

export async function handleApiRequest(ctx: RequestContext): Promise<void> {
  const { res, url, method, body, auth, req } = ctx;
  const pathname = url.pathname;
  const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';

  try {
    // ========================================================================
    // 1. HEALTH & FILE UPLOAD ENDPOINT
    // ========================================================================
    if (pathname === '/api/health' && method === 'GET') {
      return sendJson(res, 200, {
        status: 'ok',
        timestamp: new Date().toISOString(),
        database: getDatabaseHealth(),
      });
    }

    if (pathname === '/api/upload' && method === 'POST') {
      const { fileName, mimeType, base64Data } = body;
      if (!fileName || !base64Data) {
        return sendJson(res, 400, { error: 'fileName and base64Data are required.' });
      }
      const allowedMime = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'application/pdf'];
      const cleanMime = String(mimeType || 'image/png').toLowerCase();
      if (!allowedMime.includes(cleanMime)) {
        return sendJson(res, 400, { error: 'Unsupported file type. Allowed: PNG, JPG, WEBP, PDF.' });
      }
      const rawBase64 = String(base64Data).replace(/^data:[^;]+;base64,/, '');
      const buffer = Buffer.from(rawBase64, 'base64');
      if (buffer.byteLength > 5 * 1024 * 1024) {
        return sendJson(res, 400, { error: 'File exceeds maximum allowed size of 5 MB.' });
      }
      const ext = path.extname(String(fileName)).replace(/[^a-zA-Z0-9.]/g, '') || '.png';
      const safeName = `${Date.now()}-${uuid().slice(0, 8)}${ext}`;
      const uploadDir = path.join(process.cwd(), 'data', 'uploads');
      fs.mkdirSync(uploadDir, { recursive: true });
      fs.writeFileSync(path.join(uploadDir, safeName), buffer);
      return sendJson(res, 201, { url: `/uploads/${safeName}`, fileName: safeName, size: buffer.byteLength });
    }

    // ========================================================================
    // 1B. RAZORPAY STANDARD WEB CHECKOUT ENDPOINTS (/api/create-order & /api/verify-payment)
    // ========================================================================
    if (pathname === '/api/create-order' && method === 'POST') {
      const rawAmount = body.amount;
      const amountPaise = Math.round(Number(rawAmount));
      const currency = String(body.currency || 'INR').trim().toUpperCase();
      const receipt = String(body.receipt || `rcpt_${Date.now()}`).trim().slice(0, 40);

      if (rawAmount === undefined || rawAmount === null || !Number.isFinite(amountPaise) || amountPaise < 100) {
        return sendJson(res, 400, {
          error: 'Invalid amount: minimum order amount is 100 paise (₹1.00).',
        });
      }

      const usePlatformCreds = Boolean(body.isSubscription);
      const { keyId, keySecret } = resolveRazorpayCredentials(usePlatformCreds ? null : auth?.societyId);
      if (!keyId || !keySecret) {
        return sendJson(res, 401, {
          error: 'Razorpay API credentials are not configured.',
        });
      }

      // If this is a society subscription payment from Society Admin Dashboard and no subscriptionPaymentId was passed, create or reuse one
      let resolvedSubPaymentId = body.subscriptionPaymentId ? String(body.subscriptionPaymentId) : '';
      const targetSocietyId = String(body.societyId || auth?.societyId || '').trim();
      if (usePlatformCreds && !resolvedSubPaymentId && targetSocietyId) {
        const existingPending = db
          .prepare("SELECT id FROM subscription_payments WHERE society_id = ? AND status = 'CREATED' ORDER BY created_at DESC LIMIT 1")
          .get(targetSocietyId) as { id: string } | undefined;
        if (existingPending) {
          resolvedSubPaymentId = existingPending.id;
        } else {
          const socRow = db.prepare('SELECT * FROM societies WHERE id = ?').get(targetSocietyId) as Record<string, any> | undefined;
          const targetPlanId = String(body.planId || socRow?.subscription_plan_id || 'plan_growth');
          const planRow = db.prepare('SELECT * FROM subscription_plans WHERE id = ?').get(targetPlanId) as Record<string, any> | undefined;
          if (socRow && planRow) {
            const baseAmt = Number(planRow.price_amount || 0);
            const taxAmt = Number(((baseAmt * Number(planRow.tax_percent || 18)) / 100).toFixed(2));
            const totAmt = Number((baseAmt + taxAmt).toFixed(2));
            resolvedSubPaymentId = uuid();
            const invNo = `SUB-INV-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
            db.prepare(`
              INSERT INTO subscription_payments (
                id, society_id, plan_id, invoice_number, amount, tax_amount, total_amount,
                payment_gateway, gateway_order_id, status
              ) VALUES (?, ?, ?, ?, ?, ?, ?, 'RAZORPAY', ?, 'CREATED')
            `).run(resolvedSubPaymentId, socRow.id, planRow.id, invNo, baseAmt, taxAmt, totAmt, `pending_${resolvedSubPaymentId.slice(0, 8)}`);
          }
        }
      }

      try {
        const razorpay = new Razorpay({
          key_id: keyId,
          key_secret: keySecret,
        });

        const order = await razorpay.orders.create({
          amount: amountPaise,
          currency,
          receipt,
        });

        if (resolvedSubPaymentId) {
          db.prepare('UPDATE subscription_payments SET gateway_order_id = ? WHERE id = ?').run(
            order.id,
            resolvedSubPaymentId
          );
        } else if (body.legacyOrderId) {
          db.prepare('UPDATE subscription_payments SET gateway_order_id = ? WHERE gateway_order_id = ?').run(
            order.id,
            String(body.legacyOrderId)
          );
        }

        return sendJson(res, 200, {
          order_id: order.id,
          amount: order.amount,
          currency: order.currency,
          receipt: order.receipt,
          key_id: keyId,
          subscription_payment_id: resolvedSubPaymentId || undefined,
          sandbox: false,
        });
      } catch (err: any) {
        const platform = db
          .prepare('SELECT razorpay_sandbox_mode FROM platform_settings LIMIT 1')
          .get() as { razorpay_sandbox_mode?: number } | undefined;
        const isSandboxEnabled = Boolean(platform?.razorpay_sandbox_mode ?? 1);

        // If using synthetic/test rzp_test_ keys in sandbox mode, gracefully create a signed sandbox test order
        if (isSandboxEnabled && keyId.startsWith('rzp_test_') && !body.strictAuth) {
          const sandboxOrderId = `order_${uuid().replace(/-/g, '').slice(0, 14)}`;
          if (resolvedSubPaymentId) {
            db.prepare('UPDATE subscription_payments SET gateway_order_id = ? WHERE id = ?').run(
              sandboxOrderId,
              resolvedSubPaymentId
            );
          } else if (body.legacyOrderId) {
            db.prepare('UPDATE subscription_payments SET gateway_order_id = ? WHERE gateway_order_id = ?').run(
              sandboxOrderId,
              String(body.legacyOrderId)
            );
          }
          return sendJson(res, 200, {
            order_id: sandboxOrderId,
            amount: amountPaise,
            currency,
            receipt,
            key_id: keyId,
            subscription_payment_id: resolvedSubPaymentId || undefined,
            sandbox: true,
          });
        }

        const statusCode = Number(err?.statusCode) === 401 ? 401 : 500;
        const rawMsg = String(err?.error?.description || err?.message || '');
        const message = rawMsg.includes("reading 'status'")
          ? 'Unable to reach Razorpay API server (https://api.razorpay.com). Please check network connectivity.'
          : rawMsg || (statusCode === 401 ? 'Razorpay authentication failed.' : 'Failed to create Razorpay order.');
        return sendJson(res, statusCode, { error: message });
      }
    }

    if (pathname === '/api/verify-payment' && method === 'POST') {
      const orderId = String(body.razorpay_order_id || body.order_id || body.orderId || '').trim();
      const paymentId = String(body.razorpay_payment_id || body.payment_id || body.paymentId || '').trim();
      const signature = String(body.razorpay_signature || body.signature || '').trim();

      if (!orderId || !paymentId || !signature) {
        return sendJson(res, 400, {
          error: 'Missing required fields: razorpay_order_id, razorpay_payment_id, and razorpay_signature are required.',
        });
      }

      const { keySecret: primarySecret } = resolveRazorpayCredentials(auth?.societyId);
      const platformSecret = getRazorpayKeySecret();

      const isValidPrimary = primarySecret
        ? verifyRazorpayPaymentSignature(orderId, paymentId, signature, primarySecret)
        : false;
      const isValidPlatform =
        !isValidPrimary && platformSecret
          ? verifyRazorpayPaymentSignature(orderId, paymentId, signature, platformSecret)
          : false;

      if (!isValidPrimary && !isValidPlatform) {
        return sendJson(res, 400, {
          error: 'Invalid payment signature. Signature verification failed.',
        });
      }

      let updatedSociety: Record<string, any> | undefined;
      let receiptRecord: Record<string, any> | null = null;

      // 1. If this order corresponds to a SaaS society subscription payment, mark it PAID & activate subscription
      const lookupOrderId = String(body.subscriptionOrderId || orderId);
      const subPayment = db
        .prepare('SELECT * FROM subscription_payments WHERE gateway_order_id = ? OR id = ?')
        .get(orderId, lookupOrderId) as Record<string, any> | undefined;

      if (subPayment && subPayment.status !== 'PAID') {
        const plan = db.prepare('SELECT * FROM subscription_plans WHERE id = ?').get(subPayment.plan_id) as Record<string, any>;
        const platform = db.prepare('SELECT * FROM platform_settings LIMIT 1').get() as Record<string, any>;
        const autoApprove = Boolean(plan?.auto_approve_after_payment && platform?.auto_approve_paid_societies);
        const nowIso = new Date().toISOString();
        const endsIso = new Date(Date.now() + Number(plan?.duration_days || 30) * 86400_000).toISOString();
        const graceEndsIso = new Date(
          Date.now() + (Number(plan?.duration_days || 30) + Number(plan?.grace_period_days || 7)) * 86400_000
        ).toISOString();

        db.exec('BEGIN IMMEDIATE');
        try {
          db.prepare(`
            UPDATE subscription_payments
            SET gateway_order_id = ?, gateway_payment_id = ?, gateway_signature = ?, verified_by_webhook = 1, status = 'PAID', paid_at = ?
            WHERE id = ?
          `).run(orderId, paymentId, signature, nowIso, subPayment.id);

          db.prepare(`
            INSERT INTO society_subscriptions (id, society_id, plan_id, status, starts_at, ends_at, is_trial)
            VALUES (?, ?, ?, 'ACTIVE', ?, ?, 0)
          `).run(uuid(), subPayment.society_id, subPayment.plan_id, nowIso, endsIso);

          db.prepare(`
            UPDATE societies
            SET subscription_plan_id = ?,
                subscription_status = 'ACTIVE',
                payment_status = 'PAID',
                approval_status = CASE WHEN ? = 1 THEN 'APPROVED' ELSE approval_status END,
                subscription_starts_at = ?,
                subscription_ends_at = ?,
                grace_period_ends_at = ?,
                updated_at = datetime('now')
            WHERE id = ?
          `).run(subPayment.plan_id, autoApprove ? 1 : 0, nowIso, endsIso, graceEndsIso, subPayment.society_id);

          // Mark pending payment due notifications as read once paid
          db.prepare(`
            UPDATE notifications
            SET is_read = 1
            WHERE society_id = ? AND notification_type IN ('SUBSCRIPTION_PAYMENT_DUE', 'SUBSCRIPTION_RENEWAL', 'TRIAL_EXPIRY')
          `).run(subPayment.society_id);

          sendNotification({
            societyId: subPayment.society_id,
            notificationType: 'SUBSCRIPTION_PAYMENT_CONFIRMED',
            title: `Subscription Renewed & Active — ${plan?.name || 'Society Plan'}`,
            message: `Subscription payment of ₹${Number(subPayment.total_amount).toLocaleString('en-IN')} (Ref: ${paymentId}) is verified. Your society subscription is ACTIVE until ${new Date(endsIso).toLocaleDateString('en-IN')}.`,
            channel: 'IN_APP',
          });

          logAudit({
            societyId: subPayment.society_id,
            actorRole: 'RAZORPAY_CHECKOUT',
            action: 'SUBSCRIPTION_PAYMENT_VERIFIED',
            entityType: 'SUBSCRIPTION_PAYMENT',
            entityId: subPayment.id,
            details: { orderId, paymentId, autoApprove },
          });

          db.exec('COMMIT');
          updatedSociety = db.prepare('SELECT * FROM societies WHERE id = ?').get(subPayment.society_id) as Record<string, any>;
        } catch (err) {
          db.exec('ROLLBACK');
          throw err;
        }
      }

      // 2. If this order corresponds to a Resident Member Bill payment, record & settle bills immediately
      if (Array.isArray(body.billIds) && body.billIds.length > 0 && auth?.role === 'MEMBER' && auth?.societyId) {
        const societyId = auth.societyId;
        const member = db.prepare(`
          SELECT sm.*, h.flat_number
          FROM society_members sm
          JOIN households h ON h.id = sm.household_id
          WHERE sm.user_id = ? AND sm.society_id = ?
        `).get(auth.userId, societyId) as Record<string, any> | undefined;

        if (member) {
          const billIds: string[] = body.billIds;
          const targetBills: Record<string, any>[] = [];
          let computedTotal = 0;
          for (const bId of billIds) {
            const bill = db
              .prepare('SELECT * FROM member_bills WHERE id = ? AND society_id = ? AND household_id = ?')
              .get(bId, societyId, member.household_id) as Record<string, any> | undefined;
            if (bill && bill.status !== 'PAID' && Number(bill.balance_amount) > 0) {
              targetBills.push(bill);
              computedTotal += Number(bill.balance_amount);
            }
          }

          const paidRupees = Number(body.amount) > 0 ? Number(body.amount) : computedTotal;
          if (targetBills.length > 0 && paidRupees > 0) {
            const internalPaymentId = uuid();
            const dateStr = new Date().toISOString().slice(0, 10);
            db.exec('BEGIN IMMEDIATE');
            try {
              db.prepare(`
                INSERT INTO payments (
                  id, society_id, household_id, member_id, payment_method, amount, payment_date,
                  reference_number, status, verification_notes, verified_at, ledger_posted
                ) VALUES (?, ?, ?, ?, 'RAZORPAY', ?, ?, ?, 'CONFIRMED', ?, datetime('now'), 1)
              `).run(
                internalPaymentId,
                societyId,
                member.household_id,
                member.id,
                paidRupees,
                dateStr,
                paymentId,
                `Verified via Razorpay Standard Checkout (Order: ${orderId})`
              );

              let remaining = paidRupees;
              for (const bill of targetBills) {
                if (remaining <= 0) break;
                const billBal = Number(bill.balance_amount);
                const allocAmt = Math.min(remaining, billBal);
                if (allocAmt <= 0) continue;

                db.prepare(`
                  INSERT INTO payment_allocations (id, society_id, payment_id, bill_id, allocated_amount)
                  VALUES (?, ?, ?, ?, ?)
                `).run(uuid(), societyId, internalPaymentId, bill.id, allocAmt);

                const newPaid = Number((Number(bill.paid_amount) + allocAmt).toFixed(2));
                const newBal = Math.max(0, Number((Number(bill.total_amount) - newPaid).toFixed(2)));
                const newStatus = newBal === 0 ? 'PAID' : 'PARTIALLY_PAID';
                db.prepare(`
                  UPDATE member_bills
                  SET paid_amount = ?, balance_amount = ?, status = ?, updated_at = datetime('now')
                  WHERE id = ?
                `).run(newPaid, newBal, newStatus, bill.id);

                remaining = Math.max(0, Number((remaining - allocAmt).toFixed(2)));
              }

              const receiptNumber = `RCP-${new Date().getFullYear()}-${internalPaymentId.slice(0, 6).toUpperCase()}`;
              const receiptId = uuid();
              db.prepare(`
                INSERT INTO payment_receipts (
                  id, society_id, payment_id, receipt_number, issued_to_name, flat_number,
                  amount, payment_method, reference_number
                ) VALUES (?, ?, ?, ?, ?, ?, ?, 'RAZORPAY', ?)
              `).run(
                receiptId,
                societyId,
                internalPaymentId,
                receiptNumber,
                member.full_name,
                member.flat_number,
                paidRupees,
                paymentId
              );

              const txnCode = `TXN-RZP-${Date.now()}-${internalPaymentId.slice(0, 4).toUpperCase()}`;
              db.prepare(`
                INSERT INTO ledger_entries (
                  id, society_id, transaction_code, entry_date, entry_type, account_type,
                  category, description, amount, direction, reference_type, reference_id,
                  household_id, flat_number, member_id, payment_method
                ) VALUES (?, ?, ?, ?, 'INCOME', 'BANK', 'Maintenance Collection', ?, ?, 'CREDIT', 'PAYMENT', ?, ?, ?, ?, 'RAZORPAY')
              `).run(
                uuid(),
                societyId,
                txnCode,
                dateStr,
                `Razorpay online payment ${receiptNumber} (Flat ${member.flat_number}, Payment ID: ${paymentId})`,
                paidRupees,
                internalPaymentId,
                member.household_id,
                member.flat_number,
                member.id
              );

              db.exec('COMMIT');
              receiptRecord = {
                id: receiptId,
                receiptNumber,
                amount: paidRupees,
                paymentId,
                orderId,
              };
            } catch (err) {
              db.exec('ROLLBACK');
              throw err;
            }
          }
        }
      }

      return sendJson(res, 200, {
        success: true,
        verified: true,
        order_id: orderId,
        payment_id: paymentId,
        society: updatedSociety,
        receipt: receiptRecord,
        message: 'Payment signature verified successfully!',
      });
    }

    // ========================================================================
    // 2. PUBLIC SAAS LANDING, REGISTRATION, SUBSCRIPTION & ENROLMENT ENDPOINTS
    // ========================================================================
    if (pathname === '/api/public/plans' && method === 'GET') {
      const plans = db.prepare('SELECT * FROM subscription_plans WHERE is_active = 1 ORDER BY price_amount ASC').all();
      const platform = db.prepare(`
        SELECT platform_name, support_email, support_phone, default_trial_enabled,
               default_trial_days, default_grace_period_days, auto_approve_paid_societies,
               auto_approve_trial_societies, razorpay_key_id, razorpay_sandbox_mode
        FROM platform_settings LIMIT 1
      `).get();
      return sendJson(res, 200, { plans, platform });
    }

    if (pathname === '/api/public/register-society' && method === 'POST') {
      if (!checkRateLimit(`reg:${clientIp}`, 30, 60_000)) {
        return sendJson(res, 429, { error: 'Too many registration requests. Please try again shortly.' });
      }
      const {
        adminName,
        email,
        phone,
        password,
        societyName,
        address,
        city = '',
        state = 'Punjab',
        pincode = '',
        registrationNumber = '',
        planId,
        startWithTrial = true,
      } = body;

      if (!adminName || !email || !phone || !password || !societyName || !address || !planId) {
        return sendJson(res, 400, { error: 'All mandatory society and administrator fields are required.' });
      }

      const cleanEmail = String(email).trim().toLowerCase();
      const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(cleanEmail);
      if (existingUser) {
        return sendJson(res, 409, { error: 'An account with this email address already exists.' });
      }

      const plan = db.prepare('SELECT * FROM subscription_plans WHERE id = ? AND is_active = 1').get(planId) as Record<string, any> | undefined;
      if (!plan) {
        return sendJson(res, 404, { error: 'Selected subscription plan is invalid or inactive.' });
      }

      const platform = db.prepare('SELECT * FROM platform_settings LIMIT 1').get() as Record<string, any>;
      const useTrial = Boolean(startWithTrial && plan.trial_enabled && platform.default_trial_enabled);

      const societyId = uuid();
      const adminUserId = uuid();
      const baseSlug = String(societyName)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 40) || 'society';
      const slug = `${baseSlug}-${societyId.slice(0, 6)}`;
      const enrollmentCode = `${baseSlug.slice(0, 4).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

      const trialDays = Number(plan.trial_days || platform.default_trial_days || 14);
      const nowIso = new Date().toISOString();
      const trialEndsIso = new Date(Date.now() + trialDays * 86400_000).toISOString();

      const subscriptionStatus = useTrial ? 'TRIAL' : 'PENDING_PAYMENT';
      const paymentStatus = useTrial ? 'TRIAL' : 'PENDING';
      const approvalStatus = useTrial
        ? (platform.auto_approve_trial_societies ? 'APPROVED' : 'PENDING')
        : 'PENDING';

      db.exec('BEGIN IMMEDIATE');
      try {
        db.prepare(`
          INSERT INTO societies (
            id, name, slug, enrollment_code, address, city, state, pincode,
            contact_email, contact_phone, registration_number, subscription_plan_id,
            subscription_status, approval_status, account_status, payment_status,
            trial_starts_at, trial_ends_at, is_demo
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?, ?, ?, 0)
        `).run(
          societyId,
          String(societyName).trim(),
          slug,
          enrollmentCode,
          String(address).trim(),
          String(city).trim(),
          String(state).trim(),
          String(pincode).trim(),
          cleanEmail,
          String(phone).trim(),
          String(registrationNumber).trim(),
          plan.id,
          subscriptionStatus,
          approvalStatus,
          paymentStatus,
          useTrial ? nowIso : null,
          useTrial ? trialEndsIso : null
        );

        db.prepare(`
          INSERT INTO users (id, email, phone, password_hash, role, society_id, is_active, email_verified)
          VALUES (?, ?, ?, ?, 'SOCIETY_ADMIN', ?, 1, 1)
        `).run(adminUserId, cleanEmail, String(phone).trim(), hashPassword(String(password)), societyId);

        db.prepare(`
          INSERT INTO user_profiles (id, user_id, society_id, full_name, preferred_language, address)
          VALUES (?, ?, ?, ?, 'en', ?)
        `).run(uuid(), adminUserId, societyId, String(adminName).trim(), String(address).trim());

        db.prepare('UPDATE societies SET admin_user_id = ? WHERE id = ?').run(adminUserId, societyId);

        const subscriptionId = uuid();
        db.prepare(`
          INSERT INTO society_subscriptions (id, society_id, plan_id, status, starts_at, ends_at, is_trial)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
          subscriptionId,
          societyId,
          plan.id,
          useTrial ? 'TRIAL' : 'PENDING_PAYMENT',
          nowIso,
          useTrial ? trialEndsIso : new Date(Date.now() + Number(plan.duration_days) * 86400_000).toISOString(),
          useTrial ? 1 : 0
        );

        let paymentOrder: Record<string, any> | null = null;
        if (!useTrial) {
          const amount = Number(plan.price_amount);
          const taxAmount = Number(((amount * Number(plan.tax_percent || 18)) / 100).toFixed(2));
          const totalAmount = Number((amount + taxAmount).toFixed(2));
          const orderId = `order_${uuid().replace(/-/g, '').slice(0, 14)}`;
          const subPayId = uuid();
          const invoiceNumber = `SUB-INV-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

          db.prepare(`
            INSERT INTO subscription_payments (
              id, society_id, subscription_id, plan_id, invoice_number, amount, tax_amount,
              total_amount, payment_gateway, gateway_order_id, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'RAZORPAY', ?, 'CREATED')
          `).run(subPayId, societyId, subscriptionId, plan.id, invoiceNumber, amount, taxAmount, totalAmount, orderId);

          paymentOrder = {
            subscriptionPaymentId: subPayId,
            orderId,
            invoiceNumber,
            amount,
            taxAmount,
            totalAmount,
            currency: 'INR',
            razorpayKeyId: platform.razorpay_key_id,
          };
        }

        bootstrapSocietyDefaults(societyId, String(societyName).trim());

        sendNotification({
          societyId,
          userId: adminUserId,
          notificationType: 'SOCIETY_REGISTERED',
          title: useTrial ? 'Free Trial Activated — Welcome to SocietyOS!' : 'Society Registration Created — Complete Subscription Payment',
          message: useTrial
            ? `Your ${trialDays}-day free trial for ${societyName} is active until ${trialEndsIso.slice(0, 10)}.`
            : `Please complete your subscription payment to activate ${societyName}.`,
          channel: 'EMAIL',
          dedupKey: `soc-reg:${societyId}`,
        });

        logAudit({
          societyId,
          actorUserId: adminUserId,
          actorRole: 'SOCIETY_ADMIN',
          action: 'SOCIETY_REGISTERED',
          entityType: 'SOCIETY',
          entityId: societyId,
          details: { societyName, planCode: plan.code, useTrial },
          ipAddress: clientIp,
        });

        db.exec('COMMIT');

        const token = signJwt({
          userId: adminUserId,
          email: cleanEmail,
          role: 'SOCIETY_ADMIN',
          societyId,
        });

        const createdSociety = db.prepare('SELECT * FROM societies WHERE id = ?').get(societyId);
        return sendJson(res, 201, {
          token,
          society: createdSociety,
          paymentOrder,
          message: useTrial
            ? `Society registered with ${trialDays}-day free trial!`
            : 'Society registered. Complete subscription payment to activate.',
        });
      } catch (err: any) {
        db.exec('ROLLBACK');
        throw err;
      }
    }

    // Create a Razorpay order for society subscription renewal / upgrade
    if (pathname === '/api/public/subscription-payment/create-order' && method === 'POST') {
      const { societyId, planId } = body;
      if (!societyId || !planId) {
        return sendJson(res, 400, { error: 'societyId and planId are required.' });
      }
      const society = db.prepare('SELECT * FROM societies WHERE id = ?').get(societyId) as Record<string, any> | undefined;
      const plan = db.prepare('SELECT * FROM subscription_plans WHERE id = ?').get(planId) as Record<string, any> | undefined;
      if (!society || !plan) {
        return sendJson(res, 404, { error: 'Society or subscription plan not found.' });
      }
      const platform = db.prepare('SELECT * FROM platform_settings LIMIT 1').get() as Record<string, any>;
      const amount = Number(plan.price_amount);
      const taxAmount = Number(((amount * Number(plan.tax_percent || 18)) / 100).toFixed(2));
      const totalAmount = Number((amount + taxAmount).toFixed(2));
      const orderId = `order_${uuid().replace(/-/g, '').slice(0, 14)}`;
      const subPayId = uuid();
      const invoiceNumber = `SUB-INV-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

      db.prepare(`
        INSERT INTO subscription_payments (
          id, society_id, plan_id, invoice_number, amount, tax_amount, total_amount,
          payment_gateway, gateway_order_id, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'RAZORPAY', ?, 'CREATED')
      `).run(subPayId, society.id, plan.id, invoiceNumber, amount, taxAmount, totalAmount, orderId);

      return sendJson(res, 201, {
        subscriptionPaymentId: subPayId,
        orderId,
        invoiceNumber,
        amount,
        taxAmount,
        totalAmount,
        currency: 'INR',
        razorpayKeyId: platform.razorpay_key_id,
      });
    }

    // Sandbox simulator endpoint for Razorpay testing (Acceptance Criterion 16)
    if (pathname === '/api/public/razorpay-sandbox/simulate-settlement' && method === 'POST') {
      const platform = db.prepare('SELECT * FROM platform_settings LIMIT 1').get() as Record<string, any>;
      if (!platform.razorpay_sandbox_mode) {
        return sendJson(res, 403, { error: 'Razorpay Sandbox Mode is disabled.' });
      }
      const { orderId } = body;
      if (!orderId) {
        return sendJson(res, 400, { error: 'orderId is required.' });
      }
      const { keySecret } = resolveRazorpayCredentials(auth?.societyId);
      const paymentId = `pay_${uuid().replace(/-/g, '').slice(0, 14)}`;
      const signature = createRazorpayPaymentSignature(orderId, paymentId, keySecret || undefined);
      return sendJson(res, 200, {
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: signature,
      });
    }

    // Verify subscription payment using trusted cryptographic signature (Section 4)
    if (pathname === '/api/public/subscription-payment/verify' && method === 'POST') {
      const { orderId, paymentId, signature } = body;
      if (!orderId || !paymentId || !signature) {
        return sendJson(res, 400, {
          error: 'Subscription cannot be marked paid based only on a redirect or reference. Trusted gateway orderId, paymentId, and cryptographic signature are required.',
        });
      }

      if (!verifyRazorpayPaymentSignature(String(orderId), String(paymentId), String(signature))) {
        return sendJson(res, 400, {
          error: 'Invalid payment gateway cryptographic signature. Payment verification rejected.',
        });
      }

      const subPayment = db
        .prepare('SELECT * FROM subscription_payments WHERE gateway_order_id = ?')
        .get(String(orderId)) as Record<string, any> | undefined;
      if (!subPayment) {
        return sendJson(res, 404, { error: 'Subscription payment order not found.' });
      }

      if (subPayment.status === 'PAID') {
        const society = db.prepare('SELECT * FROM societies WHERE id = ?').get(subPayment.society_id);
        return sendJson(res, 200, { message: 'Subscription payment already verified.', society });
      }

      const plan = db.prepare('SELECT * FROM subscription_plans WHERE id = ?').get(subPayment.plan_id) as Record<string, any>;
      const platform = db.prepare('SELECT * FROM platform_settings LIMIT 1').get() as Record<string, any>;

      const autoApprove = Boolean(plan.auto_approve_after_payment && platform.auto_approve_paid_societies);
      const nowIso = new Date().toISOString();
      const endsIso = new Date(Date.now() + Number(plan.duration_days || 30) * 86400_000).toISOString();
      const graceEndsIso = new Date(
        Date.now() + (Number(plan.duration_days || 30) + Number(plan.grace_period_days || 7)) * 86400_000
      ).toISOString();

      db.exec('BEGIN IMMEDIATE');
      try {
        db.prepare(`
          UPDATE subscription_payments
          SET gateway_payment_id = ?, gateway_signature = ?, verified_by_webhook = 1, status = 'PAID', paid_at = ?
          WHERE id = ?
        `).run(String(paymentId), String(signature), nowIso, subPayment.id);

        const newSubId = uuid();
        db.prepare(`
          INSERT INTO society_subscriptions (id, society_id, plan_id, status, starts_at, ends_at, is_trial)
          VALUES (?, ?, ?, 'ACTIVE', ?, ?, 0)
        `).run(newSubId, subPayment.society_id, plan.id, nowIso, endsIso);

        db.prepare(`
          UPDATE societies
          SET subscription_plan_id = ?,
              subscription_status = 'ACTIVE',
              payment_status = 'PAID',
              approval_status = CASE WHEN ? = 1 THEN 'APPROVED' ELSE approval_status END,
              subscription_starts_at = ?,
              subscription_ends_at = ?,
              grace_period_ends_at = ?,
              updated_at = datetime('now')
          WHERE id = ?
        `).run(plan.id, autoApprove ? 1 : 0, nowIso, endsIso, graceEndsIso, subPayment.society_id);

        logAudit({
          societyId: subPayment.society_id,
          actorRole: 'SYSTEM_WEBHOOK',
          action: 'SUBSCRIPTION_PAYMENT_VERIFIED',
          entityType: 'SUBSCRIPTION_PAYMENT',
          entityId: subPayment.id,
          details: { orderId, paymentId, autoApprove, planCode: plan.code },
        });

        db.exec('COMMIT');

        const updatedSociety = db.prepare('SELECT * FROM societies WHERE id = ?').get(subPayment.society_id);
        return sendJson(res, 200, {
          verified: true,
          autoApproved: autoApprove,
          society: updatedSociety,
          message: autoApprove
            ? 'Payment verified! Society subscription is now ACTIVE and APPROVED.'
            : 'Payment verified! Society is awaiting manual approval by Super Admin.',
        });
      } catch (err) {
        db.exec('ROLLBACK');
        throw err;
      }
    }

    // Public Enrolment Info by Enrollment Code
    const enrollMatch = pathname.match(/^\/api\/public\/enroll\/([^/]+)$/);
    if (enrollMatch && method === 'GET') {
      const code = decodeURIComponent(enrollMatch[1]);
      const society = db.prepare(`
        SELECT id, name, slug, enrollment_code, logo_url, address, city, state, pincode, contact_email, contact_phone
        FROM societies
        WHERE (enrollment_code = ? OR slug = ?) AND account_status = 'ACTIVE'
      `).get(code, code) as Record<string, any> | undefined;

      if (!society) {
        return sendJson(res, 404, { error: 'Invalid or inactive society enrolment link.' });
      }
      const blocks = db.prepare('SELECT id, name, total_floors FROM apartment_blocks WHERE society_id = ? ORDER BY name ASC').all(society.id);
      const settings = db.prepare('SELECT custom_enrollment_fields, brand_primary_color FROM society_settings WHERE society_id = ?').get(society.id) as Record<string, any> | undefined;
      const households = db.prepare(`
        SELECT id, block_name, floor_number, flat_number, normalized_flat_number
        FROM households
        WHERE society_id = ? AND status != 'ARCHIVED'
        ORDER BY normalized_flat_number ASC
      `).all(society.id);

      return sendJson(res, 200, {
        society,
        blocks,
        households,
        customFields: settings ? JSON.parse(settings.custom_enrollment_fields || '[]') : [],
      });
    }

    // Public Flat Availability Check
    const checkFlatMatch = pathname.match(/^\/api\/public\/enroll\/([^/]+)\/check-flat$/);
    if (checkFlatMatch && method === 'POST') {
      const code = decodeURIComponent(checkFlatMatch[1]);
      const society = db
        .prepare("SELECT id FROM societies WHERE (enrollment_code = ? OR slug = ?) AND account_status = 'ACTIVE'")
        .get(code, code) as { id: string } | undefined;
      if (!society) {
        return sendJson(res, 404, { error: 'Society not found.' });
      }
      const normalized = normalizeFlatNumber(body.flatNumber || '');
      if (!normalized) {
        return sendJson(res, 400, { error: 'Flat/house number is required.' });
      }
      const existing = db.prepare(`
        SELECT id, flat_number, block_name, status
        FROM households
        WHERE society_id = ? AND normalized_flat_number = ? AND status != 'ARCHIVED'
      `).get(society.id, normalized);

      if (existing) {
        return sendJson(res, 200, {
          exists: true,
          normalizedFlatNumber: normalized,
          household: existing,
          message: 'This flat/house number is already registered in this society.',
        });
      }
      return sendJson(res, 200, { exists: false, normalizedFlatNumber: normalized });
    }

    // Public Member Enrolment Submission (with strict duplicate flat prevention)
    if (enrollMatch && method === 'POST') {
      if (!checkRateLimit(`enroll:${clientIp}`, 30, 60_000)) {
        return sendJson(res, 429, { error: 'Too many enrolment requests. Please wait a moment.' });
      }
      const code = decodeURIComponent(enrollMatch[1]);
      const society = db.prepare(`
        SELECT id, name FROM societies
        WHERE (enrollment_code = ? OR slug = ?) AND account_status = 'ACTIVE'
      `).get(code, code) as { id: string; name: string } | undefined;

      if (!society) {
        return sendJson(res, 404, { error: 'Invalid or inactive society enrolment link.' });
      }

      const {
        fullName,
        email,
        phone,
        password = 'Member@123',
        address = '',
        flatNumber,
        floorNumber = '1',
        blockName = 'Block A',
        photoUrl = null,
        ownershipType = 'OWNER',
        emergencyContact = '',
        customFields = {},
        enrolmentMode = 'NEW_HOUSEHOLD', // 'NEW_HOUSEHOLD' or 'FAMILY_MEMBER'
        existingHouseholdId = null,
        relationshipToPrimary = 'PRIMARY',
      } = body;

      if (!fullName || !email || !phone || !flatNumber) {
        return sendJson(res, 400, { error: 'Full name, email, mobile number, and flat/house number are required.' });
      }

      const cleanEmail = String(email).trim().toLowerCase();
      const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(cleanEmail);
      if (existingUser) {
        return sendJson(res, 409, { error: 'A user with this email address is already registered.' });
      }

      const normalizedFlat = normalizeFlatNumber(String(flatNumber));
      if (!normalizedFlat) {
        return sendJson(res, 400, { error: 'Valid flat/house number is required.' });
      }

      db.exec('BEGIN IMMEDIATE');
      try {
        let householdId: string;
        let isPrimary = 1;

        if (enrolmentMode === 'FAMILY_MEMBER') {
          const targetHh = db.prepare(`
            SELECT id FROM households
            WHERE society_id = ? AND (id = ? OR normalized_flat_number = ?) AND status != 'ARCHIVED'
          `).get(society.id, existingHouseholdId, normalizedFlat) as { id: string } | undefined;

          if (!targetHh) {
            db.exec('ROLLBACK');
            return sendJson(res, 404, { error: 'Registered household not found for linking family member.' });
          }
          householdId = targetHh.id;
          isPrimary = 0;
        } else {
          // Check duplicate active flat registration within the same society (Section 5)
          const duplicateFlat = db.prepare(`
            SELECT id FROM households
            WHERE society_id = ? AND normalized_flat_number = ? AND status != 'ARCHIVED'
          `).get(society.id, normalizedFlat);

          if (duplicateFlat) {
            db.exec('ROLLBACK');
            return sendJson(res, 409, {
              error: 'This flat/house number is already registered in this society.',
            });
          }

          householdId = uuid();
          const blockRow = db
            .prepare('SELECT id FROM apartment_blocks WHERE society_id = ? AND name = ?')
            .get(society.id, blockName) as { id: string } | undefined;

          db.prepare(`
            INSERT INTO households (
              id, society_id, block_id, block_name, floor_number, flat_number,
              normalized_flat_number, occupancy_type, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE')
          `).run(
            householdId,
            society.id,
            blockRow?.id ?? null,
            String(blockName).trim(),
            String(floorNumber).trim(),
            String(flatNumber).trim(),
            normalizedFlat,
            ownershipType === 'TENANT' ? 'TENANT' : 'OWNER'
          );
        }

        const userId = uuid();
        const memberId = uuid();

        db.prepare(`
          INSERT INTO users (id, email, phone, password_hash, role, society_id, is_active, email_verified)
          VALUES (?, ?, ?, ?, 'MEMBER', ?, 1, 1)
        `).run(userId, cleanEmail, String(phone).trim(), hashPassword(String(password)), society.id);

        db.prepare(`
          INSERT INTO user_profiles (id, user_id, society_id, full_name, avatar_url, address, emergency_contact_name)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
          uuid(),
          userId,
          society.id,
          String(fullName).trim(),
          photoUrl,
          String(address || `${flatNumber}, ${blockName}`).trim(),
          String(emergencyContact).trim()
        );

        db.prepare(`
          INSERT INTO society_members (
            id, society_id, household_id, user_id, full_name, email, phone, photo_url,
            relationship_to_primary, is_primary_member, ownership_type, emergency_contact,
            custom_fields, approval_status, account_status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', 'ACTIVE')
        `).run(
          memberId,
          society.id,
          householdId,
          userId,
          String(fullName).trim(),
          cleanEmail,
          String(phone).trim(),
          photoUrl,
          isPrimary ? 'PRIMARY' : String(relationshipToPrimary || 'FAMILY'),
          isPrimary,
          isPrimary ? (ownershipType === 'TENANT' ? 'TENANT' : 'OWNER') : 'FAMILY',
          String(emergencyContact).trim(),
          JSON.stringify(customFields || {})
        );

        if (isPrimary) {
          db.prepare('UPDATE households SET primary_member_id = ? WHERE id = ?').run(memberId, householdId);
        }

        sendNotification({
          societyId: society.id,
          userId,
          notificationType: 'NEW_MEMBER_ENROLMENT',
          title: `Enrolment Received — Flat ${normalizedFlat}`,
          message: `${fullName} enrolled for Flat ${normalizedFlat} in ${society.name}.`,
          channel: 'IN_APP',
          dedupKey: `enroll:${memberId}`,
        });

        logAudit({
          societyId: society.id,
          actorUserId: userId,
          actorRole: 'MEMBER',
          action: 'PUBLIC_MEMBER_ENROLLED',
          entityType: 'SOCIETY_MEMBER',
          entityId: memberId,
          details: { flatNumber: normalizedFlat, enrolmentMode },
          ipAddress: clientIp,
        });

        db.exec('COMMIT');

        return sendJson(res, 201, {
          memberId,
          householdId,
          normalizedFlatNumber: normalizedFlat,
          message: 'Enrolment submitted successfully! You can now sign in to your resident portal.',
        });
      } catch (err: any) {
        db.exec('ROLLBACK');
        if (String(err?.message || '').includes('UNIQUE constraint failed')) {
          return sendJson(res, 409, {
            error: 'This flat/house number is already registered in this society.',
          });
        }
        throw err;
      }
    }

    // ========================================================================
    // 3. AUTHENTICATION & USER PROFILE ENDPOINTS
    // ========================================================================
    if (pathname === '/api/auth/login' && method === 'POST') {
      if (!checkRateLimit(`login:${clientIp}`, 40, 60_000)) {
        return sendJson(res, 429, { error: 'Too many login attempts. Please wait a minute.' });
      }
      const { email, password } = body;
      if (!email || !password) {
        return sendJson(res, 400, { error: 'Email and password are required.' });
      }

      const user = db.prepare('SELECT * FROM users WHERE email = ?').get(String(email).trim().toLowerCase()) as Record<string, any> | undefined;
      if (!user || !verifyPassword(String(password), user.password_hash)) {
        return sendJson(res, 401, { error: 'Invalid email or password.' });
      }
      if (!user.is_active) {
        return sendJson(res, 403, { error: 'Your user account has been deactivated or blocked.' });
      }

      let society: Record<string, any> | null = null;
      if (user.society_id) {
        society = (db.prepare('SELECT * FROM societies WHERE id = ?').get(user.society_id) as Record<string, any>) || null;
        if (society && society.account_status === 'SUSPENDED') {
          return sendJson(res, 403, { error: 'This society account is currently suspended by the platform owner.' });
        }
      }

      if (user.role === 'MEMBER') {
        const memberRecord = db
          .prepare('SELECT account_status, approval_status FROM society_members WHERE user_id = ?')
          .get(user.id) as Record<string, any> | undefined;
        if (memberRecord && memberRecord.account_status === 'BLOCKED') {
          return sendJson(res, 403, { error: 'Your member account has been blocked by society management.' });
        }
      }

      db.prepare("UPDATE users SET last_login_at = datetime('now') WHERE id = ?").run(user.id);
      const profile = db.prepare('SELECT * FROM user_profiles WHERE user_id = ?').get(user.id) as Record<string, any> | undefined;
      const permissions = user.role === 'STAFF' && user.society_id
        ? getStaffPermissions(user.id, user.society_id)
        : null;

      const token = signJwt({
        userId: user.id,
        email: user.email,
        role: user.role,
        societyId: user.society_id,
      });

      return sendJson(res, 200, {
        token,
        user: {
          id: user.id,
          email: user.email,
          phone: user.phone,
          role: user.role,
          societyId: user.society_id,
          fullName: profile?.full_name || user.email,
          preferredLanguage: profile?.preferred_language || 'en',
          avatarUrl: profile?.avatar_url || null,
        },
        society,
        permissions,
      });
    }

    if (pathname === '/api/auth/forgot-password' && method === 'POST') {
      const cleanEmail = String(body.email || '').trim().toLowerCase();
      const user = db.prepare('SELECT id, email, society_id FROM users WHERE email = ?').get(cleanEmail) as Record<string, any> | undefined;
      if (!user) {
        return sendJson(res, 200, { message: 'If that email exists, a password reset token has been generated.' });
      }
      const rawToken = `RST-${Math.floor(100000 + Math.random() * 900000)}`;
      const expiresIso = new Date(Date.now() + 30 * 60_000).toISOString();
      db.prepare('UPDATE users SET reset_token_hash = ?, reset_token_expires_at = ? WHERE id = ?').run(
        hashPassword(rawToken),
        expiresIso,
        user.id
      );
      sendNotification({
        societyId: user.society_id,
        userId: user.id,
        notificationType: 'PASSWORD_RESET',
        title: 'Password Reset Requested',
        message: `Your password reset verification code is ${rawToken} (valid for 30 minutes).`,
        channel: 'EMAIL',
      });
      return sendJson(res, 200, {
        message: 'Password reset token generated and sent.',
        resetTokenPreview: rawToken, // Returned in dev mode so user can complete flow without external SMTP server
      });
    }

    if (pathname === '/api/auth/reset-password' && method === 'POST') {
      const { email, resetToken, newPassword } = body;
      if (!email || !resetToken || !newPassword) {
        return sendJson(res, 400, { error: 'email, resetToken, and newPassword are required.' });
      }
      const user = db.prepare('SELECT * FROM users WHERE email = ?').get(String(email).trim().toLowerCase()) as Record<string, any> | undefined;
      if (!user || !user.reset_token_hash || !user.reset_token_expires_at) {
        return sendJson(res, 400, { error: 'Invalid or expired password reset token.' });
      }
      if (new Date(user.reset_token_expires_at).getTime() < Date.now()) {
        return sendJson(res, 400, { error: 'Password reset token has expired.' });
      }
      if (!verifyPassword(String(resetToken), user.reset_token_hash)) {
        return sendJson(res, 400, { error: 'Invalid password reset token.' });
      }
      db.prepare(`
        UPDATE users
        SET password_hash = ?, reset_token_hash = NULL, reset_token_expires_at = NULL, updated_at = datetime('now')
        WHERE id = ?
      `).run(hashPassword(String(newPassword)), user.id);
      return sendJson(res, 200, { message: 'Password has been reset successfully. You can now log in.' });
    }

    if (pathname === '/api/auth/me' && method === 'GET') {
      if (!auth) {
        return sendJson(res, 401, { error: 'Not authenticated.' });
      }
      const user = db.prepare('SELECT * FROM users WHERE id = ?').get(auth.userId) as Record<string, any> | undefined;
      if (!user) {
        return sendJson(res, 401, { error: 'User not found.' });
      }
      const profile = db.prepare('SELECT * FROM user_profiles WHERE user_id = ?').get(user.id) as Record<string, any> | undefined;
      const society = user.society_id
        ? (db.prepare('SELECT * FROM societies WHERE id = ?').get(user.society_id) as Record<string, any>)
        : null;
      const permissions = user.role === 'STAFF' && user.society_id
        ? getStaffPermissions(user.id, user.society_id)
        : null;

      const notifications = db.prepare(`
        SELECT * FROM notifications
        WHERE (user_id = ? OR (society_id = ? AND user_id IS NULL))
        ORDER BY created_at DESC LIMIT 30
      `).all(user.id, user.society_id);

      return sendJson(res, 200, {
        user: {
          id: user.id,
          email: user.email,
          phone: user.phone,
          role: user.role,
          societyId: user.society_id,
          fullName: profile?.full_name || user.email,
          preferredLanguage: profile?.preferred_language || 'en',
          avatarUrl: profile?.avatar_url || null,
          address: profile?.address || '',
          emergencyContactName: profile?.emergency_contact_name || '',
          emergencyContactPhone: profile?.emergency_contact_phone || '',
        },
        society,
        permissions,
        notifications,
      });
    }

    if (pathname === '/api/auth/profile' && method === 'PUT') {
      if (!auth) return sendJson(res, 401, { error: 'Not authenticated.' });
      const { fullName, phone, preferredLanguage, address, emergencyContactName, emergencyContactPhone, avatarUrl } = body;
      if (phone) {
        db.prepare("UPDATE users SET phone = ?, updated_at = datetime('now') WHERE id = ?").run(String(phone).trim(), auth.userId);
      }
      db.prepare(`
        UPDATE user_profiles
        SET full_name = COALESCE(?, full_name),
            preferred_language = COALESCE(?, preferred_language),
            address = COALESCE(?, address),
            emergency_contact_name = COALESCE(?, emergency_contact_name),
            emergency_contact_phone = COALESCE(?, emergency_contact_phone),
            avatar_url = COALESCE(?, avatar_url),
            updated_at = datetime('now')
        WHERE user_id = ?
      `).run(
        fullName ?? null,
        preferredLanguage ?? null,
        address ?? null,
        emergencyContactName ?? null,
        emergencyContactPhone ?? null,
        avatarUrl ?? null,
        auth.userId
      );

      if (auth.role === 'MEMBER') {
        db.prepare(`
          UPDATE society_members
          SET full_name = COALESCE(?, full_name),
              phone = COALESCE(?, phone),
              photo_url = COALESCE(?, photo_url),
              emergency_contact = COALESCE(?, emergency_contact),
              updated_at = datetime('now')
          WHERE user_id = ?
        `).run(
          fullName ?? null,
          phone ?? null,
          avatarUrl ?? null,
          emergencyContactName ? `${emergencyContactName} (${emergencyContactPhone || ''})` : null,
          auth.userId
        );
      }
      return sendJson(res, 200, { message: 'Profile updated successfully.' });
    }

    if (pathname === '/api/notifications/mark-read' && method === 'POST') {
      if (!auth) return sendJson(res, 401, { error: 'Not authenticated.' });
      const targetReadState = body.isRead === false ? 0 : 1;
      if (body.notificationId) {
        db.prepare('UPDATE notifications SET is_read = ? WHERE id = ?').run(targetReadState, body.notificationId);
      } else {
        db.prepare('UPDATE notifications SET is_read = ? WHERE user_id = ? OR society_id = ?').run(
          targetReadState,
          auth.userId,
          auth.societyId
        );
      }
      return sendJson(res, 200, {
        message:
          targetReadState === 1
            ? 'Notification marked as read and moved to the Notifications page.'
            : 'Notification restored as unread.',
      });
    }

    // ========================================================================
    // 4. SUPER ADMIN ENDPOINTS (STRICTLY SEPARATED FROM SOCIETY PORTALS)
    // ========================================================================
    if (pathname.startsWith('/api/super-admin')) {
      if (!auth || auth.role !== 'SUPER_ADMIN') {
        return sendJson(res, 403, {
          error: 'Forbidden: Only the Platform Super Admin can access Super Admin functions.',
        });
      }

      if (pathname === '/api/super-admin/dashboard' && method === 'GET') {
        const search = (url.searchParams.get('search') || '').trim().toLowerCase();
        const statusFilter = url.searchParams.get('status') || '';
        const planFilter = url.searchParams.get('planId') || '';
        const paymentFilter = url.searchParams.get('paymentStatus') || '';

        const rawSocieties = db.prepare(`
          SELECT s.*,
                 u.email as admin_email,
                 u.phone as admin_phone,
                 up.full_name as admin_name,
                 sp.name as plan_name,
                 sp.code as plan_code,
                 sp.price_amount as plan_price,
                 sp.tax_percent as plan_tax_percent,
                 sp.billing_period as plan_billing_period,
                 sp.duration_days as plan_duration_days,
                 (SELECT COUNT(*) FROM households h WHERE h.society_id = s.id AND h.status != 'ARCHIVED') as household_count
          FROM societies s
          LEFT JOIN users u ON u.id = s.admin_user_id
          LEFT JOIN user_profiles up ON up.user_id = s.admin_user_id
          LEFT JOIN subscription_plans sp ON sp.id = s.subscription_plan_id
          ORDER BY s.created_at DESC
        `).all() as Record<string, any>[];

        const allSocieties = rawSocieties.map((s) => {
          const basePrice = Number(s.plan_price || 0);
          const taxPct = Number(s.plan_tax_percent ?? 18);
          const taxAmt = Number(((basePrice * taxPct) / 100).toFixed(2));
          const totalAmountDue = Number((basePrice + taxAmt).toFixed(2));
          const targetEnd = s.subscription_ends_at || s.trial_ends_at;
          const daysRemaining = targetEnd
            ? Math.ceil((new Date(targetEnd).getTime() - Date.now()) / 86400_000)
            : 14;
          return {
            ...s,
            tax_amount: taxAmt,
            total_amount_due: totalAmountDue,
            days_remaining: daysRemaining,
            renewal_due_date: targetEnd,
          };
        });

        const filteredSocieties = allSocieties.filter((s) => {
          if (search) {
            const hay = `${s.name} ${s.admin_name || ''} ${s.contact_email} ${s.contact_phone} ${s.city}`.toLowerCase();
            if (!hay.includes(search)) return false;
          }
          if (statusFilter && s.subscription_status !== statusFilter && s.account_status !== statusFilter && s.approval_status !== statusFilter) {
            return false;
          }
          if (planFilter && s.subscription_plan_id !== planFilter) return false;
          if (paymentFilter && s.payment_status !== paymentFilter) return false;
          return true;
        });

        const confirmedRevenue = (db.prepare("SELECT COALESCE(SUM(total_amount), 0) as total FROM subscription_payments WHERE status = 'PAID'").get() as { total: number }).total;
        const pendingRevenue = (db.prepare("SELECT COALESCE(SUM(total_amount), 0) as total FROM subscription_payments WHERE status = 'CREATED'").get() as { total: number }).total;
        const failedPaymentsCount = (db.prepare("SELECT COUNT(*) as cnt FROM subscription_payments WHERE status = 'FAILED'").get() as { cnt: number }).cnt;
        const monthlyRevenue = (db.prepare("SELECT COALESCE(SUM(total_amount), 0) as total FROM subscription_payments WHERE status = 'PAID' AND paid_at >= datetime('now', '-30 days')").get() as { total: number }).total;
        const annualRevenue = (db.prepare("SELECT COALESCE(SUM(total_amount), 0) as total FROM subscription_payments WHERE status = 'PAID' AND paid_at >= datetime('now', '-365 days')").get() as { total: number }).total;

        const kpis = {
          totalSocieties: allSocieties.length,
          activeSocieties: allSocieties.filter((s) => s.subscription_status === 'ACTIVE' && s.account_status === 'ACTIVE').length,
          trialSocieties: allSocieties.filter((s) => s.subscription_status === 'TRIAL').length,
          pendingApprovals: allSocieties.filter((s) => s.approval_status === 'PENDING').length,
          suspendedSocieties: allSocieties.filter((s) => s.account_status === 'SUSPENDED').length,
          expiredSubscriptions: allSocieties.filter((s) => s.subscription_status === 'EXPIRED').length,
          renewalsDue: allSocieties.filter((s) => {
            const end = s.subscription_ends_at || s.trial_ends_at;
            if (!end) return false;
            const diffDays = (new Date(end).getTime() - Date.now()) / 86400_000;
            return diffDays >= 0 && diffDays <= 15;
          }).length,
          confirmedSubscriptionRevenue: confirmedRevenue,
          pendingSubscriptionPayments: pendingRevenue,
          monthlyRevenueSummary: monthlyRevenue,
          annualRevenueSummary: annualRevenue,
          newRegistrationsThisMonth: allSocieties.length,
          failedSubscriptionPayments: failedPaymentsCount,
        };

        const plans = db.prepare('SELECT * FROM subscription_plans ORDER BY price_amount ASC').all();
        const subscriptionPayments = db.prepare(`
          SELECT sp.*, s.name as society_name, p.name as plan_name
          FROM subscription_payments sp
          JOIN societies s ON s.id = sp.society_id
          JOIN subscription_plans p ON p.id = sp.plan_id
          ORDER BY sp.created_at DESC
        `).all();
        const platformSettings = db.prepare('SELECT * FROM platform_settings LIMIT 1').get() as Record<string, any> | undefined;
        if (platformSettings) {
          platformSettings.has_razorpay_secret = Boolean(platformSettings.razorpay_key_secret_encrypted);
          platformSettings.has_razorpay_webhook_secret = Boolean(platformSettings.razorpay_webhook_secret_encrypted);
          platformSettings.has_paytm_secret = Boolean(platformSettings.paytm_merchant_key_encrypted);
          platformSettings.has_custom_gateway_secret = Boolean(platformSettings.custom_gateway_secret_encrypted);
          delete platformSettings.razorpay_key_secret_encrypted;
          delete platformSettings.razorpay_webhook_secret_encrypted;
          delete platformSettings.paytm_merchant_key_encrypted;
          delete platformSettings.custom_gateway_secret_encrypted;
        }
        const auditLogs = db.prepare('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 100').all();

        return sendJson(res, 200, {
          kpis,
          societies: filteredSocieties,
          plans,
          subscriptionPayments,
          platformSettings,
          auditLogs,
        });
      }

      if (pathname === '/api/super-admin/societies' && method === 'POST') {
        const {
          societyName,
          adminName,
          email,
          phone,
          password = 'Admin@123',
          address,
          city = '',
          state = 'Punjab',
          pincode = '',
          planId,
          subscriptionStatus = 'TRIAL',
          approvalStatus = 'APPROVED',
        } = body;

        if (!societyName || !adminName || !email || !phone || !address || !planId) {
          return sendJson(res, 400, { error: 'Required society fields are missing.' });
        }
        const cleanEmail = String(email).trim().toLowerCase();
        if (db.prepare('SELECT id FROM users WHERE email = ?').get(cleanEmail)) {
          return sendJson(res, 409, { error: 'Administrator email already exists.' });
        }

        const societyId = uuid();
        const adminId = uuid();
        const slug = `${String(societyName).toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${societyId.slice(0, 5)}`;
        const enrollmentCode = `SOC-${Math.floor(1000 + Math.random() * 9000)}`;
        const nowIso = new Date().toISOString();
        const endsIso = new Date(Date.now() + 14 * 86400_000).toISOString();

        db.exec('BEGIN IMMEDIATE');
        try {
          db.prepare(`
            INSERT INTO societies (
              id, name, slug, enrollment_code, address, city, state, pincode,
              contact_email, contact_phone, subscription_plan_id, subscription_status,
              approval_status, account_status, payment_status, trial_starts_at, trial_ends_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?, ?, ?)
          `).run(
            societyId,
            societyName,
            slug,
            enrollmentCode,
            address,
            city,
            state,
            pincode,
            cleanEmail,
            phone,
            planId,
            subscriptionStatus,
            approvalStatus,
            subscriptionStatus === 'ACTIVE' ? 'PAID' : 'TRIAL',
            nowIso,
            endsIso
          );

          db.prepare(`
            INSERT INTO users (id, email, phone, password_hash, role, society_id, is_active, email_verified)
            VALUES (?, ?, ?, ?, 'SOCIETY_ADMIN', ?, 1, 1)
          `).run(adminId, cleanEmail, phone, hashPassword(password), societyId);

          db.prepare(`
            INSERT INTO user_profiles (id, user_id, society_id, full_name, preferred_language)
            VALUES (?, ?, ?, ?, 'en')
          `).run(uuid(), adminId, societyId, adminName);

          db.prepare('UPDATE societies SET admin_user_id = ? WHERE id = ?').run(adminId, societyId);
          bootstrapSocietyDefaults(societyId, societyName);

          logAudit({
            societyId,
            actorUserId: auth.userId,
            actorRole: 'SUPER_ADMIN',
            action: 'SUPER_ADMIN_CREATED_SOCIETY',
            entityType: 'SOCIETY',
            entityId: societyId,
            details: { societyName, email: cleanEmail },
          });
          db.exec('COMMIT');
          return sendJson(res, 201, { societyId, message: 'Society created by Super Admin.' });
        } catch (err) {
          db.exec('ROLLBACK');
          throw err;
        }
      }

      const saSocMatch = pathname.match(/^\/api\/super-admin\/societies\/([^/]+)$/);
      if (saSocMatch && method === 'PUT') {
        const targetSocId = saSocMatch[1];
        const society = db.prepare('SELECT * FROM societies WHERE id = ?').get(targetSocId) as Record<string, any> | undefined;
        if (!society) return sendJson(res, 404, { error: 'Society not found.' });

        const {
          action, // 'APPROVE', 'REJECT', 'SUSPEND', 'REACTIVATE', 'ARCHIVE', 'EXTEND_TRIAL', 'CHANGE_PLAN', 'EDIT'
          name,
          address,
          contactEmail,
          contactPhone,
          planId,
          extendDays,
          reason,
        } = body;

        if (action === 'APPROVE') {
          db.prepare("UPDATE societies SET approval_status = 'APPROVED', updated_at = datetime('now') WHERE id = ?").run(targetSocId);
        } else if (action === 'REJECT') {
          db.prepare("UPDATE societies SET approval_status = 'REJECTED', updated_at = datetime('now') WHERE id = ?").run(targetSocId);
        } else if (action === 'SUSPEND') {
          db.prepare("UPDATE societies SET account_status = 'SUSPENDED', subscription_status = 'SUSPENDED', updated_at = datetime('now') WHERE id = ?").run(targetSocId);
        } else if (action === 'REACTIVATE') {
          db.prepare("UPDATE societies SET account_status = 'ACTIVE', subscription_status = CASE WHEN payment_status = 'PAID' THEN 'ACTIVE' ELSE 'TRIAL' END, updated_at = datetime('now') WHERE id = ?").run(targetSocId);
        } else if (action === 'ARCHIVE') {
          db.prepare("UPDATE societies SET account_status = 'ARCHIVED', updated_at = datetime('now') WHERE id = ?").run(targetSocId);
        } else if (action === 'EXTEND_TRIAL') {
          if (!reason) {
            return sendJson(res, 400, { error: 'A recorded reason is required when extending a society free trial.' });
          }
          const days = Number(extendDays || 7);
          const currentEnd = society.trial_ends_at ? new Date(society.trial_ends_at).getTime() : Date.now();
          const newEndIso = new Date(Math.max(currentEnd, Date.now()) + days * 86400_000).toISOString();
          db.prepare(`
            UPDATE societies
            SET trial_ends_at = ?, subscription_status = 'TRIAL', updated_at = datetime('now')
            WHERE id = ?
          `).run(newEndIso, targetSocId);

          db.prepare(`
            INSERT INTO society_subscriptions (id, society_id, plan_id, status, starts_at, ends_at, is_trial, extended_reason, extended_by)
            VALUES (?, ?, ?, 'TRIAL', datetime('now'), ?, 1, ?, ?)
          `).run(uuid(), targetSocId, society.subscription_plan_id, newEndIso, String(reason), auth.userId);
        } else if (action === 'CHANGE_PLAN' && planId) {
          db.prepare("UPDATE societies SET subscription_plan_id = ?, updated_at = datetime('now') WHERE id = ?").run(planId, targetSocId);
        } else {
          db.prepare(`
            UPDATE societies
            SET name = COALESCE(?, name),
                address = COALESCE(?, address),
                contact_email = COALESCE(?, contact_email),
                contact_phone = COALESCE(?, contact_phone),
                subscription_plan_id = COALESCE(?, subscription_plan_id),
                updated_at = datetime('now')
            WHERE id = ?
          `).run(name ?? null, address ?? null, contactEmail ?? null, contactPhone ?? null, planId ?? null, targetSocId);
        }

        logAudit({
          societyId: targetSocId,
          actorUserId: auth.userId,
          actorRole: 'SUPER_ADMIN',
          action: `SUPER_ADMIN_${action || 'EDIT'}_SOCIETY`,
          entityType: 'SOCIETY',
          entityId: targetSocId,
          details: { action, reason, extendDays, planId },
        });

        const updated = db.prepare('SELECT * FROM societies WHERE id = ?').get(targetSocId);
        return sendJson(res, 200, { society: updated, message: `Society action (${action || 'EDIT'}) completed.` });
      }

      const saNotifyMatch = pathname.match(/^\/api\/super-admin\/societies\/([^/]+)\/notify$/);
      if (saNotifyMatch && method === 'POST') {
        const targetSocId = saNotifyMatch[1];
        const society = db.prepare(`
          SELECT s.*, sp.name as plan_name, sp.price_amount as plan_price, sp.tax_percent as plan_tax_percent
          FROM societies s
          LEFT JOIN subscription_plans sp ON sp.id = s.subscription_plan_id
          WHERE s.id = ?
        `).get(targetSocId) as Record<string, any> | undefined;
        if (!society) return sendJson(res, 404, { error: 'Society not found.' });

        const {
          title,
          message,
          notificationType = 'SUBSCRIPTION_PAYMENT_DUE',
          amountDue,
          daysPending,
          createInvoice = true,
        } = body;
        if (!title || !message) return sendJson(res, 400, { error: 'Title and message are required.' });

        // If this is a payment due / renewal notification, ensure a pending subscription_payments record is ready
        if (notificationType === 'SUBSCRIPTION_PAYMENT_DUE' && createInvoice) {
          const basePrice = Number(society.plan_price || 5499);
          const taxPct = Number(society.plan_tax_percent ?? 18);
          const taxAmt = Number(((basePrice * taxPct) / 100).toFixed(2));
          const computedTotal = Number(amountDue) > 0 ? Number(amountDue) : Number((basePrice + taxAmt).toFixed(2));
          const existingCreated = db
            .prepare("SELECT id FROM subscription_payments WHERE society_id = ? AND status = 'CREATED' ORDER BY created_at DESC LIMIT 1")
            .get(targetSocId) as { id: string } | undefined;

          if (!existingCreated) {
            const subPayId = uuid();
            const invNo = `SUB-INV-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
            db.prepare(`
              INSERT INTO subscription_payments (
                id, society_id, plan_id, invoice_number, amount, tax_amount, total_amount,
                payment_gateway, gateway_order_id, status
              ) VALUES (?, ?, ?, ?, ?, ?, ?, 'RAZORPAY', ?, 'CREATED')
            `).run(
              subPayId,
              targetSocId,
              society.subscription_plan_id || 'plan_growth',
              invNo,
              basePrice,
              taxAmt,
              computedTotal,
              `order_due_${subPayId.slice(0, 8)}`
            );
          }
        }

        sendNotification({
          societyId: targetSocId,
          userId: society.admin_user_id,
          notificationType,
          title,
          message,
          channel: 'IN_APP',
        });

        logAudit({
          societyId: targetSocId,
          actorUserId: auth.userId,
          actorRole: 'SUPER_ADMIN',
          action: 'SUPER_ADMIN_SENT_NOTIFICATION',
          entityType: 'NOTIFICATION',
          entityId: targetSocId,
          details: { title, notificationType, amountDue, daysPending },
        });

        return sendJson(res, 200, { message: 'Subscription payment due & approval notification sent to Society Admin dashboard.' });
      }

      if (pathname === '/api/super-admin/plans' && method === 'POST') {
        const {
          code,
          name,
          description = '',
          billingPeriod = 'MONTHLY',
          durationDays = 30,
          priceAmount,
          taxPercent = 18,
          maxHouseholds = 500,
          trialEnabled = true,
          trialDays = 14,
          gracePeriodDays = 7,
          autoApproveAfterPayment = true,
        } = body;
        if (!code || !name || priceAmount === undefined) {
          return sendJson(res, 400, { error: 'code, name, and priceAmount are required.' });
        }
        const id = uuid();
        db.prepare(`
          INSERT INTO subscription_plans (
            id, code, name, description, billing_period, duration_days, price_amount, tax_percent,
            max_households, trial_enabled, trial_days, grace_period_days, auto_approve_after_payment, is_active
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
        `).run(
          id,
          String(code).toUpperCase().trim(),
          name,
          description,
          billingPeriod,
          Number(durationDays),
          Number(priceAmount),
          Number(taxPercent),
          Number(maxHouseholds),
          trialEnabled ? 1 : 0,
          Number(trialDays),
          Number(gracePeriodDays),
          autoApproveAfterPayment ? 1 : 0
        );
        logAudit({
          actorUserId: auth.userId,
          actorRole: 'SUPER_ADMIN',
          action: 'CREATED_SUBSCRIPTION_PLAN',
          entityType: 'SUBSCRIPTION_PLAN',
          entityId: id,
          details: { code, name, priceAmount },
        });
        return sendJson(res, 201, { id, message: 'Subscription plan created.' });
      }

      const planMatch = pathname.match(/^\/api\/super-admin\/plans\/([^/]+)$/);
      if (planMatch && method === 'PUT') {
        const planId = planMatch[1];
        const {
          name,
          priceAmount,
          taxPercent,
          maxHouseholds,
          trialEnabled,
          trialDays,
          gracePeriodDays,
          autoApproveAfterPayment,
          isActive,
        } = body;
        db.prepare(`
          UPDATE subscription_plans
          SET name = COALESCE(?, name),
              price_amount = COALESCE(?, price_amount),
              tax_percent = COALESCE(?, tax_percent),
              max_households = COALESCE(?, max_households),
              trial_enabled = COALESCE(?, trial_enabled),
              trial_days = COALESCE(?, trial_days),
              grace_period_days = COALESCE(?, grace_period_days),
              auto_approve_after_payment = COALESCE(?, auto_approve_after_payment),
              is_active = COALESCE(?, is_active),
              updated_at = datetime('now')
          WHERE id = ?
        `).run(
          name ?? null,
          priceAmount !== undefined ? Number(priceAmount) : null,
          taxPercent !== undefined ? Number(taxPercent) : null,
          maxHouseholds !== undefined ? Number(maxHouseholds) : null,
          trialEnabled !== undefined ? (trialEnabled ? 1 : 0) : null,
          trialDays !== undefined ? Number(trialDays) : null,
          gracePeriodDays !== undefined ? Number(gracePeriodDays) : null,
          autoApproveAfterPayment !== undefined ? (autoApproveAfterPayment ? 1 : 0) : null,
          isActive !== undefined ? (isActive ? 1 : 0) : null,
          planId
        );
        return sendJson(res, 200, { message: 'Subscription plan updated.' });
      }

      if (pathname === '/api/super-admin/settings' && method === 'PUT') {
        const {
          platformName,
          supportEmail,
          supportPhone,
          defaultTrialEnabled,
          defaultTrialDays,
          defaultGracePeriodDays,
          autoApprovePaidSocieties,
          autoApproveTrialSocieties,
          reminderDaysBeforeExpiry,
          razorpayKeyId,
          razorpayKeySecret,
          razorpayWebhookSecret,
          paytmMerchantId,
          paytmMerchantKey,
          customGatewayName,
          customGatewayApiKey,
          customGatewaySecret,
          upiId,
          upiPayeeName,
          bankName,
          bankAccountNumber,
          bankIfsc,
          razorpaySandboxMode,
          welcomeEmailTemplate,
          invoiceEmailTemplate,
          overdueEmailTemplate,
        } = body;
        db.prepare(`
          UPDATE platform_settings
          SET platform_name = COALESCE(?, platform_name),
              support_email = COALESCE(?, support_email),
              support_phone = COALESCE(?, support_phone),
              default_trial_enabled = COALESCE(?, default_trial_enabled),
              default_trial_days = COALESCE(?, default_trial_days),
              default_grace_period_days = COALESCE(?, default_grace_period_days),
              auto_approve_paid_societies = COALESCE(?, auto_approve_paid_societies),
              auto_approve_trial_societies = COALESCE(?, auto_approve_trial_societies),
              reminder_days_before_expiry = COALESCE(?, reminder_days_before_expiry),
              razorpay_key_id = COALESCE(?, razorpay_key_id),
              razorpay_key_secret_encrypted = COALESCE(?, razorpay_key_secret_encrypted),
              razorpay_webhook_secret_encrypted = COALESCE(?, razorpay_webhook_secret_encrypted),
              paytm_merchant_id = COALESCE(?, paytm_merchant_id),
              paytm_merchant_key_encrypted = COALESCE(?, paytm_merchant_key_encrypted),
              custom_gateway_name = COALESCE(?, custom_gateway_name),
              custom_gateway_api_key = COALESCE(?, custom_gateway_api_key),
              custom_gateway_secret_encrypted = COALESCE(?, custom_gateway_secret_encrypted),
              upi_id = COALESCE(?, upi_id),
              upi_payee_name = COALESCE(?, upi_payee_name),
              bank_name = COALESCE(?, bank_name),
              bank_account_number = COALESCE(?, bank_account_number),
              bank_ifsc = COALESCE(?, bank_ifsc),
              razorpay_sandbox_mode = COALESCE(?, razorpay_sandbox_mode),
              welcome_email_template = COALESCE(?, welcome_email_template),
              invoice_email_template = COALESCE(?, invoice_email_template),
              overdue_email_template = COALESCE(?, overdue_email_template),
              updated_at = datetime('now')
          WHERE id = 'default'
        `).run(
          platformName ?? null,
          supportEmail ?? null,
          supportPhone ?? null,
          defaultTrialEnabled !== undefined ? (defaultTrialEnabled ? 1 : 0) : null,
          defaultTrialDays !== undefined ? Number(defaultTrialDays) : null,
          defaultGracePeriodDays !== undefined ? Number(defaultGracePeriodDays) : null,
          autoApprovePaidSocieties !== undefined ? (autoApprovePaidSocieties ? 1 : 0) : null,
          autoApproveTrialSocieties !== undefined ? (autoApproveTrialSocieties ? 1 : 0) : null,
          reminderDaysBeforeExpiry !== undefined ? Number(reminderDaysBeforeExpiry) : null,
          razorpayKeyId ?? null,
          razorpayKeySecret ? `enc_${razorpayKeySecret}` : null,
          razorpayWebhookSecret ? `enc_${razorpayWebhookSecret}` : null,
          paytmMerchantId ?? null,
          paytmMerchantKey ? `enc_${paytmMerchantKey}` : null,
          customGatewayName ?? null,
          customGatewayApiKey ?? null,
          customGatewaySecret ? `enc_${customGatewaySecret}` : null,
          upiId ?? null,
          upiPayeeName ?? null,
          bankName ?? null,
          bankAccountNumber ?? null,
          bankIfsc ?? null,
          razorpaySandboxMode !== undefined ? (razorpaySandboxMode ? 1 : 0) : null,
          welcomeEmailTemplate ?? null,
          invoiceEmailTemplate ?? null,
          overdueEmailTemplate ?? null
        );
        logAudit({
          actorUserId: auth.userId,
          actorRole: 'SUPER_ADMIN',
          action: 'UPDATED_PLATFORM_SETTINGS',
          entityType: 'PLATFORM_SETTINGS',
          entityId: 'default',
        });
        return sendJson(res, 200, { message: 'Platform settings and payment gateway credentials updated.' });
      }

      const refundMatch = pathname.match(/^\/api\/super-admin\/subscription-payments\/([^/]+)\/refund$/);
      if (refundMatch && method === 'POST') {
        const subPayId = refundMatch[1];
        const { reason = 'Refund approved by Super Admin' } = body;
        const sp = db.prepare('SELECT * FROM subscription_payments WHERE id = ?').get(subPayId) as Record<string, any> | undefined;
        if (!sp) return sendJson(res, 404, { error: 'Subscription payment not found.' });
        db.prepare("UPDATE subscription_payments SET status = 'REFUNDED', refund_reason = ? WHERE id = ?").run(reason, subPayId);
        db.prepare("UPDATE societies SET payment_status = 'REFUNDED', updated_at = datetime('now') WHERE id = ?").run(sp.society_id);
        logAudit({
          societyId: sp.society_id,
          actorUserId: auth.userId,
          actorRole: 'SUPER_ADMIN',
          action: 'SUBSCRIPTION_PAYMENT_REFUNDED',
          entityType: 'SUBSCRIPTION_PAYMENT',
          entityId: subPayId,
          details: { reason },
        });
        return sendJson(res, 200, { message: 'Subscription payment marked as refunded.' });
      }
    }

    // ========================================================================
    // 5. SOCIETY ADMIN & AUTHORIZED STAFF ENDPOINTS (STRICT TENANT ISOLATION)
    // ========================================================================
    if (pathname.startsWith('/api/society')) {
      // Determine required staff permission based on route & method
      let reqPerm: StaffPermissionKey | undefined;
      if (pathname.startsWith('/api/society/members') || pathname.startsWith('/api/society/households') || pathname.startsWith('/api/society/blocks')) {
        reqPerm = method === 'GET' ? 'view_members' : 'manage_members';
      } else if (pathname.startsWith('/api/society/charge-categories') || pathname.startsWith('/api/society/bills')) {
        reqPerm = method === 'GET' ? undefined : 'generate_bills';
      } else if (pathname.startsWith('/api/society/payments')) {
        reqPerm = method === 'GET' ? undefined : 'verify_payments';
      } else if (pathname.startsWith('/api/society/expenses') || pathname.startsWith('/api/society/expense-categories')) {
        reqPerm = method === 'GET' ? 'view_financial_reports' : 'manage_expenses';
      } else if (pathname.startsWith('/api/society/reports')) {
        reqPerm = 'view_financial_reports';
      } else if (pathname.startsWith('/api/society/complaints') || pathname.startsWith('/api/society/suggestions')) {
        reqPerm = method === 'GET' ? undefined : 'manage_complaints';
      } else if (pathname.startsWith('/api/society/events') || pathname.startsWith('/api/society/announcements')) {
        reqPerm = method === 'GET' ? undefined : 'manage_events';
      } else if (pathname.startsWith('/api/society/staff') || pathname.startsWith('/api/society/roles') || pathname.startsWith('/api/society/attendance')) {
        reqPerm = method === 'GET' ? undefined : 'manage_staff';
      } else if (pathname.startsWith('/api/society/settings')) {
        reqPerm = method === 'GET' ? undefined : 'change_society_settings';
      }

      const access = hasSocietyAccess(auth, reqPerm);
      if (!access.ok || !access.societyId) {
        return sendJson(res, access.status, { error: access.error });
      }
      const societyId = access.societyId;

      // 5.1 SOCIETY ADMIN DASHBOARD & ANALYTICS (Section 14)
      if (pathname === '/api/society/dashboard' && method === 'GET') {
        const currentMonth = Number(url.searchParams.get('month') || new Date().getMonth() + 1);
        const currentYear = Number(url.searchParams.get('year') || new Date().getFullYear());

        const totalHouseholds = (db.prepare("SELECT COUNT(*) as c FROM households WHERE society_id = ? AND status != 'ARCHIVED'").get(societyId) as { c: number }).c;
        const activeMembers = (db.prepare("SELECT COUNT(*) as c FROM society_members WHERE society_id = ? AND account_status = 'ACTIVE' AND approval_status = 'APPROVED'").get(societyId) as { c: number }).c;
        const pendingEnrolments = (db.prepare("SELECT COUNT(*) as c FROM society_members WHERE society_id = ? AND approval_status = 'PENDING'").get(societyId) as { c: number }).c;
        const blockedMembers = (db.prepare("SELECT COUNT(*) as c FROM society_members WHERE society_id = ? AND account_status = 'BLOCKED'").get(societyId) as { c: number }).c;

        const billsThisMonth = (db.prepare("SELECT COUNT(*) as c FROM member_bills WHERE society_id = ? AND billing_month = ? AND billing_year = ? AND status != 'CANCELLED'").get(societyId, currentMonth, currentYear) as { c: number }).c;
        const totalBilledAmount = (db.prepare("SELECT COALESCE(SUM(total_amount), 0) as s FROM member_bills WHERE society_id = ? AND status != 'CANCELLED' AND status != 'DRAFT'").get(societyId) as { s: number }).s;
        const totalCollectedAmount = (db.prepare("SELECT COALESCE(SUM(amount), 0) as s FROM payments WHERE society_id = ? AND status = 'CONFIRMED'").get(societyId) as { s: number }).s;
        const pendingVerificationAmount = (db.prepare("SELECT COALESCE(SUM(amount), 0) as s FROM payments WHERE society_id = ? AND status IN ('PENDING_VERIFICATION', 'PAYMENT_SUBMITTED')").get(societyId) as { s: number }).s;
        const rejectedPaymentsAmount = (db.prepare("SELECT COALESCE(SUM(amount), 0) as s FROM payments WHERE society_id = ? AND status = 'REJECTED'").get(societyId) as { s: number }).s;
        const totalOutstandingDues = (db.prepare("SELECT COALESCE(SUM(balance_amount), 0) as s FROM member_bills WHERE society_id = ? AND status NOT IN ('PAID', 'CANCELLED', 'DRAFT')").get(societyId) as { s: number }).s;
        const overdueBillsCount = (db.prepare("SELECT COUNT(*) as c FROM member_bills WHERE society_id = ? AND balance_amount > 0 AND (status = 'OVERDUE' OR due_date < date('now')) AND status NOT IN ('PAID', 'CANCELLED', 'DRAFT')").get(societyId) as { c: number }).c;
        const partialBillsCount = (db.prepare("SELECT COUNT(*) as c FROM member_bills WHERE society_id = ? AND status = 'PARTIALLY_PAID'").get(societyId) as { c: number }).c;

        const monthPrefix = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;
        const monthlyIncome = (db.prepare("SELECT COALESCE(SUM(amount), 0) as s FROM ledger_entries WHERE society_id = ? AND entry_type = 'INCOME' AND entry_date LIKE ?").get(societyId, `${monthPrefix}%`) as { s: number }).s;
        const monthlyExpenses = (db.prepare("SELECT COALESCE(SUM(amount), 0) as s FROM expenses WHERE society_id = ? AND status = 'APPROVED' AND expense_date LIKE ?").get(societyId, `${monthPrefix}%`) as { s: number }).s;

        const cashAcc = db.prepare("SELECT current_balance FROM financial_accounts WHERE society_id = ? AND account_type = 'CASH'").get(societyId) as { current_balance: number } | undefined;
        const bankAcc = db.prepare("SELECT current_balance FROM financial_accounts WHERE society_id = ? AND account_type = 'BANK'").get(societyId) as { current_balance: number } | undefined;

        const openComplaints = (db.prepare("SELECT COUNT(*) as c FROM complaints WHERE society_id = ? AND status IN ('SUBMITTED', 'IN_PROGRESS')").get(societyId) as { c: number }).c;
        const resolvedComplaints = (db.prepare("SELECT COUNT(*) as c FROM complaints WHERE society_id = ? AND status = 'RESOLVED'").get(societyId) as { c: number }).c;
        const onDutyStaffCount = (db.prepare("SELECT COUNT(*) as c FROM staff WHERE society_id = ? AND employment_status = 'ACTIVE' AND is_on_duty = 1").get(societyId) as { c: number }).c;

        const recentPayments = db.prepare(`
          SELECT p.*, sm.full_name as member_name, h.flat_number
          FROM payments p
          JOIN society_members sm ON sm.id = p.member_id
          JOIN households h ON h.id = p.household_id
          WHERE p.society_id = ?
          ORDER BY p.created_at DESC LIMIT 8
        `).all(societyId);

        const recentEnrolments = db.prepare(`
          SELECT sm.*, h.flat_number, h.block_name, h.floor_number
          FROM society_members sm
          JOIN households h ON h.id = sm.household_id
          WHERE sm.society_id = ?
          ORDER BY sm.created_at DESC LIMIT 6
        `).all(societyId);

        const recentComplaints = db.prepare(`
          SELECT c.*, sm.full_name as member_name, st.full_name as assigned_staff_name
          FROM complaints c
          JOIN society_members sm ON sm.id = c.member_id
          LEFT JOIN staff st ON st.id = c.assigned_staff_id
          WHERE c.society_id = ?
          ORDER BY c.created_at DESC LIMIT 6
        `).all(societyId);

        const recentExpenses = db.prepare(`
          SELECT * FROM expenses WHERE society_id = ? ORDER BY expense_date DESC, created_at DESC LIMIT 6
        `).all(societyId);

        const upcomingEvents = db.prepare(`
          SELECT * FROM society_events WHERE society_id = ? AND publication_status = 'PUBLISHED' ORDER BY event_date ASC LIMIT 5
        `).all(societyId);

        const society = db.prepare(`
          SELECT s.*,
                 sp.name as plan_name,
                 sp.code as plan_code,
                 sp.price_amount as plan_price,
                 sp.tax_percent as plan_tax_percent,
                 sp.billing_period as plan_billing_period,
                 sp.duration_days as plan_duration_days
          FROM societies s
          LEFT JOIN subscription_plans sp ON sp.id = s.subscription_plan_id
          WHERE s.id = ?
        `).get(societyId) as Record<string, any> | undefined;

        const baseAmount = Number(society?.plan_price || 5499);
        const taxPercent = Number(society?.plan_tax_percent ?? 18);
        const taxAmount = Number(((baseAmount * taxPercent) / 100).toFixed(2));
        const totalAmountDue = Number((baseAmount + taxAmount).toFixed(2));
        const expiryDate = society?.subscription_ends_at || society?.trial_ends_at || null;
        const daysRemaining = expiryDate
          ? Math.ceil((new Date(expiryDate).getTime() - Date.now()) / 86400_000)
          : 14;

        const pendingInvoice = db
          .prepare("SELECT * FROM subscription_payments WHERE society_id = ? AND status = 'CREATED' ORDER BY created_at DESC LIMIT 1")
          .get(societyId) as Record<string, any> | undefined;

        const superAdminNotifications = db.prepare(`
          SELECT * FROM notifications
          WHERE society_id = ? AND notification_type IN (
            'SUBSCRIPTION_PAYMENT_DUE',
            'PLATFORM_NOTICE',
            'SUBSCRIPTION_RENEWAL',
            'TRIAL_EXPIRY',
            'SUBSCRIPTION_PAYMENT_CONFIRMED'
          )
          ORDER BY created_at DESC LIMIT 50
        `).all(societyId) as Record<string, any>[];

        const allSocietyNotifications = db.prepare(`
          SELECT * FROM notifications
          WHERE society_id = ? OR user_id = ?
          ORDER BY created_at DESC LIMIT 100
        `).all(societyId, auth.userId) as Record<string, any>[];

        const subscriptionSummary = {
          planId: society?.subscription_plan_id || 'plan_growth',
          planName: society?.plan_name || 'Growth Society',
          planCode: society?.plan_code || 'GROWTH_MONTHLY',
          billingPeriod: society?.plan_billing_period || 'MONTHLY',
          durationDays: Number(society?.plan_duration_days || 30),
          baseAmount,
          taxPercent,
          taxAmount,
          totalAmountDue: pendingInvoice ? Number(pendingInvoice.total_amount) : totalAmountDue,
          subscriptionStatus: society?.subscription_status || 'TRIAL',
          approvalStatus: society?.approval_status || 'PENDING',
          paymentStatus: society?.payment_status || 'TRIAL',
          expiryDate,
          daysRemaining,
          pendingInvoice: pendingInvoice || null,
        };

        return sendJson(res, 200, {
          society: society
            ? {
                ...society,
                tax_amount: taxAmount,
                total_amount_due: subscriptionSummary.totalAmountDue,
                days_remaining: daysRemaining,
              }
            : null,
          subscriptionSummary,
          superAdminNotifications,
          allSocietyNotifications,
          kpis: {
            totalRegisteredHouseholds: totalHouseholds,
            activeMembers,
            pendingEnrolmentApprovals: pendingEnrolments,
            blockedMembers,
            billsIssuedThisMonth: billsThisMonth,
            totalBilledAmount,
            totalCollectedAmount,
            pendingPaymentVerification: pendingVerificationAmount,
            rejectedPaymentsAmount,
            totalOutstandingDues,
            overdueBills: overdueBillsCount,
            partialPaymentsCount: partialBillsCount,
            monthlyIncome,
            monthlyExpenses,
            currentCashBalance: cashAcc?.current_balance ?? 0,
            currentBankBalance: bankAcc?.current_balance ?? 0,
            openComplaints,
            resolvedComplaints,
            onDutyStaff: onDutyStaffCount,
          },
          recentPayments,
          recentEnrolments,
          recentComplaints,
          recentExpenses,
          upcomingEvents,
        });
      }

      if (pathname === '/api/society/notifications' && method === 'GET') {
        const notifications = db.prepare(`
          SELECT * FROM notifications
          WHERE society_id = ? OR user_id = ?
          ORDER BY created_at DESC LIMIT 150
        `).all(societyId, auth.userId);
        return sendJson(res, 200, { notifications });
      }

      // 5.2 MEMBERS, HOUSEHOLDS & BLOCKS (Section 5)
      if (pathname === '/api/society/members' && method === 'GET') {
        const search = (url.searchParams.get('search') || '').trim().toLowerCase();
        const status = url.searchParams.get('status') || '';
        const block = url.searchParams.get('block') || '';

        const members = db.prepare(`
          SELECT sm.*, h.flat_number, h.normalized_flat_number, h.block_name, h.floor_number, h.occupancy_type, h.area_sqft
          FROM society_members sm
          JOIN households h ON h.id = sm.household_id
          WHERE sm.society_id = ?
          ORDER BY h.normalized_flat_number ASC, sm.is_primary_member DESC
        `).all(societyId) as Record<string, any>[];

        const filtered = members.filter((m) => {
          if (search) {
            const hay = `${m.full_name} ${m.email} ${m.phone} ${m.flat_number} ${m.block_name}`.toLowerCase();
            if (!hay.includes(search)) return false;
          }
          if (status && m.account_status !== status && m.approval_status !== status) return false;
          if (block && m.block_name !== block) return false;
          return true;
        });

        const households = db.prepare(`
          SELECT * FROM households WHERE society_id = ? AND status != 'ARCHIVED' ORDER BY normalized_flat_number ASC
        `).all(societyId);

        const blocks = db.prepare('SELECT * FROM apartment_blocks WHERE society_id = ? ORDER BY name ASC').all(societyId);

        return sendJson(res, 200, { members: filtered, households, blocks });
      }

      if (pathname === '/api/society/blocks' && method === 'POST') {
        const { name, totalFloors = 10, description = '' } = body;
        if (!name) return sendJson(res, 400, { error: 'Block name is required.' });
        const id = uuid();
        db.prepare(`
          INSERT INTO apartment_blocks (id, society_id, name, total_floors, description)
          VALUES (?, ?, ?, ?, ?)
        `).run(id, societyId, String(name).trim(), Number(totalFloors), description);
        return sendJson(res, 201, { id, message: 'Apartment block added.' });
      }

      if (pathname === '/api/society/members' && method === 'POST') {
        const {
          fullName,
          email,
          phone,
          password = 'Member@123',
          flatNumber,
          blockName = 'Block A',
          floorNumber = '1',
          areaSqft = 1200,
          ownershipType = 'OWNER',
          emergencyContact = '',
          photoUrl = null,
          enrolmentMode = 'NEW_HOUSEHOLD', // 'NEW_HOUSEHOLD' or 'FAMILY_MEMBER'
          existingHouseholdId = null,
          relationshipToPrimary = 'PRIMARY',
        } = body;

        if (!fullName || !email || !phone || !flatNumber) {
          return sendJson(res, 400, { error: 'Full name, email, phone, and flat/house number are required.' });
        }

        const cleanEmail = String(email).trim().toLowerCase();
        if (db.prepare('SELECT id FROM users WHERE email = ?').get(cleanEmail)) {
          return sendJson(res, 409, { error: 'Email address is already registered.' });
        }

        const normalizedFlat = normalizeFlatNumber(String(flatNumber));
        if (!normalizedFlat) {
          return sendJson(res, 400, { error: 'Valid flat/house number is required.' });
        }

        db.exec('BEGIN IMMEDIATE');
        try {
          let householdId: string;
          let isPrimary = 1;

          if (enrolmentMode === 'FAMILY_MEMBER') {
            const targetHh = db.prepare(`
              SELECT id FROM households
              WHERE society_id = ? AND (id = ? OR normalized_flat_number = ?) AND status != 'ARCHIVED'
            `).get(societyId, existingHouseholdId, normalizedFlat) as { id: string } | undefined;
            if (!targetHh) {
              db.exec('ROLLBACK');
              return sendJson(res, 404, { error: 'Household not found to link family member.' });
            }
            householdId = targetHh.id;
            isPrimary = 0;
          } else {
            const existingHh = db.prepare(`
              SELECT id FROM households
              WHERE society_id = ? AND normalized_flat_number = ? AND status != 'ARCHIVED'
            `).get(societyId, normalizedFlat);

            if (existingHh) {
              db.exec('ROLLBACK');
              return sendJson(res, 409, {
                error: 'This flat/house number is already registered in this society.',
              });
            }

            householdId = uuid();
            const blockRow = db
              .prepare('SELECT id FROM apartment_blocks WHERE society_id = ? AND name = ?')
              .get(societyId, blockName) as { id: string } | undefined;

            db.prepare(`
              INSERT INTO households (
                id, society_id, block_id, block_name, floor_number, flat_number,
                normalized_flat_number, occupancy_type, area_sqft, status
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE')
            `).run(
              householdId,
              societyId,
              blockRow?.id ?? null,
              String(blockName).trim(),
              String(floorNumber).trim(),
              String(flatNumber).trim(),
              normalizedFlat,
              ownershipType === 'TENANT' ? 'TENANT' : 'OWNER',
              Number(areaSqft || 1200)
            );
          }

          const userId = uuid();
          const memberId = uuid();

          db.prepare(`
            INSERT INTO users (id, email, phone, password_hash, role, society_id, is_active, email_verified)
            VALUES (?, ?, ?, ?, 'MEMBER', ?, 1, 1)
          `).run(userId, cleanEmail, String(phone).trim(), hashPassword(String(password)), societyId);

          db.prepare(`
            INSERT INTO user_profiles (id, user_id, society_id, full_name, avatar_url, address, emergency_contact_name)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `).run(uuid(), userId, societyId, String(fullName).trim(), photoUrl, `${flatNumber}, ${blockName}`, String(emergencyContact).trim());

          db.prepare(`
            INSERT INTO society_members (
              id, society_id, household_id, user_id, full_name, email, phone, photo_url,
              relationship_to_primary, is_primary_member, ownership_type, emergency_contact,
              approval_status, account_status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'APPROVED', 'ACTIVE')
          `).run(
            memberId,
            societyId,
            householdId,
            userId,
            String(fullName).trim(),
            cleanEmail,
            String(phone).trim(),
            photoUrl,
            isPrimary ? 'PRIMARY' : String(relationshipToPrimary || 'FAMILY'),
            isPrimary,
            isPrimary ? (ownershipType === 'TENANT' ? 'TENANT' : 'OWNER') : 'FAMILY',
            String(emergencyContact).trim()
          );

          if (isPrimary) {
            db.prepare('UPDATE households SET primary_member_id = ? WHERE id = ?').run(memberId, householdId);
          }

          logAudit({
            societyId,
            actorUserId: auth?.userId,
            actorRole: auth?.role || 'SOCIETY_ADMIN',
            action: 'MEMBER_CREATED',
            entityType: 'SOCIETY_MEMBER',
            entityId: memberId,
            details: { flatNumber: normalizedFlat, fullName, enrolmentMode },
          });

          db.exec('COMMIT');
          return sendJson(res, 201, { memberId, householdId, normalizedFlatNumber: normalizedFlat, message: 'Member enrolled successfully.' });
        } catch (err: any) {
          db.exec('ROLLBACK');
          if (String(err?.message || '').includes('UNIQUE constraint failed')) {
            return sendJson(res, 409, { error: 'This flat/house number is already registered in this society.' });
          }
          throw err;
        }
      }

      const memberActionMatch = pathname.match(/^\/api\/society\/members\/([^/]+)$/);
      if (memberActionMatch && method === 'PUT') {
        const memberId = memberActionMatch[1];
        const member = db.prepare('SELECT * FROM society_members WHERE id = ? AND society_id = ?').get(memberId, societyId) as Record<string, any> | undefined;
        if (!member) return sendJson(res, 404, { error: 'Member not found in your society.' });

        const { action, fullName, phone, ownershipType, emergencyContact } = body;
        if (action === 'APPROVE') {
          db.prepare("UPDATE society_members SET approval_status = 'APPROVED', account_status = 'ACTIVE', updated_at = datetime('now') WHERE id = ?").run(memberId);
          sendNotification({
            societyId,
            userId: member.user_id,
            notificationType: 'ENROLMENT_APPROVED',
            title: 'Your Society Enrolment is Approved',
            message: 'Welcome! Your society membership has been approved by the administrator.',
          });
        } else if (action === 'REJECT') {
          db.prepare("UPDATE society_members SET approval_status = 'REJECTED', account_status = 'ARCHIVED', updated_at = datetime('now') WHERE id = ?").run(memberId);
        } else if (action === 'BLOCK') {
          db.prepare("UPDATE society_members SET account_status = 'BLOCKED', updated_at = datetime('now') WHERE id = ?").run(memberId);
          db.prepare('UPDATE users SET is_active = 0 WHERE id = ?').run(member.user_id);
        } else if (action === 'REACTIVATE') {
          db.prepare("UPDATE society_members SET account_status = 'ACTIVE', updated_at = datetime('now') WHERE id = ?").run(memberId);
          db.prepare('UPDATE users SET is_active = 1 WHERE id = ?').run(member.user_id);
        } else if (action === 'ARCHIVE') {
          db.prepare("UPDATE society_members SET account_status = 'ARCHIVED', updated_at = datetime('now') WHERE id = ?").run(memberId);
          db.prepare("UPDATE households SET status = 'ARCHIVED', updated_at = datetime('now') WHERE id = ? AND primary_member_id = ?").run(member.household_id, memberId);
        } else {
          db.prepare(`
            UPDATE society_members
            SET full_name = COALESCE(?, full_name),
                phone = COALESCE(?, phone),
                ownership_type = COALESCE(?, ownership_type),
                emergency_contact = COALESCE(?, emergency_contact),
                updated_at = datetime('now')
            WHERE id = ? AND society_id = ?
          `).run(fullName ?? null, phone ?? null, ownershipType ?? null, emergencyContact ?? null, memberId, societyId);
        }

        logAudit({
          societyId,
          actorUserId: auth?.userId,
          actorRole: auth?.role || 'SOCIETY_ADMIN',
          action: `MEMBER_${action || 'UPDATED'}`,
          entityType: 'SOCIETY_MEMBER',
          entityId: memberId,
        });

        return sendJson(res, 200, { message: 'Member record updated.' });
      }

      // Logged Workflow to Transfer / Correct Flat Number on an Existing Household (Section 5)
      const transferHhMatch = pathname.match(/^\/api\/society\/households\/([^/]+)\/transfer$/);
      if (transferHhMatch && method === 'POST') {
        const hhId = transferHhMatch[1];
        const hh = db.prepare('SELECT * FROM households WHERE id = ? AND society_id = ?').get(hhId, societyId) as Record<string, any> | undefined;
        if (!hh) return sendJson(res, 404, { error: 'Household not found.' });

        const { newFlatNumber, newBlockName, newFloorNumber, reason } = body;
        if (!newFlatNumber || !reason) {
          return sendJson(res, 400, { error: 'newFlatNumber and reason are required for a logged household transfer/correction.' });
        }
        const normalizedNew = normalizeFlatNumber(String(newFlatNumber));
        const conflict = db.prepare(`
          SELECT id FROM households
          WHERE society_id = ? AND normalized_flat_number = ? AND id != ? AND status != 'ARCHIVED'
        `).get(societyId, normalizedNew, hhId);
        if (conflict) {
          return sendJson(res, 409, { error: 'This flat/house number is already registered in this society.' });
        }

        db.prepare(`
          UPDATE households
          SET flat_number = ?, normalized_flat_number = ?,
              block_name = COALESCE(?, block_name),
              floor_number = COALESCE(?, floor_number),
              updated_at = datetime('now')
          WHERE id = ? AND society_id = ?
        `).run(String(newFlatNumber).trim(), normalizedNew, newBlockName ?? null, newFloorNumber ?? null, hhId, societyId);

        logAudit({
          societyId,
          actorUserId: auth?.userId,
          actorRole: auth?.role || 'SOCIETY_ADMIN',
          action: 'HOUSEHOLD_REGISTRATION_TRANSFERRED',
          entityType: 'HOUSEHOLD',
          entityId: hhId,
          details: { previousFlat: hh.normalized_flat_number, newFlat: normalizedNew, reason },
        });
        return sendJson(res, 200, { message: `Household updated to ${normalizedNew} and logged in audit trail.` });
      }

      // 5.3 CHARGE CATEGORIES & MONTHLY BILLING (Section 6)
      if (pathname === '/api/society/charge-categories' && method === 'GET') {
        const categories = db.prepare('SELECT * FROM charge_categories WHERE society_id = ? ORDER BY created_at ASC').all(societyId);
        return sendJson(res, 200, { categories });
      }

      if (pathname === '/api/society/charge-categories' && method === 'POST') {
        const {
          name,
          description = '',
          defaultAmount,
          billingFrequency = 'MONTHLY',
          applicableFlats = 'ALL',
          dueDay = 10,
          isActive = true,
        } = body;
        if (!name || defaultAmount === undefined) {
          return sendJson(res, 400, { error: 'Category name and default amount are required.' });
        }
        const code = String(name).toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_|_$/g, '');
        const existing = db.prepare('SELECT id FROM charge_categories WHERE society_id = ? AND code = ?').get(societyId, code);
        if (existing) {
          return sendJson(res, 409, { error: 'A charge category with this name already exists in your society.' });
        }
        const id = uuid();
        db.prepare(`
          INSERT INTO charge_categories (
            id, society_id, name, code, description, default_amount, billing_frequency,
            applicable_flats, due_day, is_single_charge_per_period, is_active
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
        `).run(
          id,
          societyId,
          String(name).trim(),
          code,
          description,
          Number(defaultAmount),
          billingFrequency,
          applicableFlats || 'ALL',
          Number(dueDay || 10),
          isActive ? 1 : 0
        );
        logAudit({
          societyId,
          actorUserId: auth?.userId,
          actorRole: auth?.role || 'SOCIETY_ADMIN',
          action: 'CHARGE_CATEGORY_CREATED',
          entityType: 'CHARGE_CATEGORY',
          entityId: id,
          details: { name, defaultAmount, billingFrequency },
        });
        return sendJson(res, 201, { id, message: 'Custom charge category added.' });
      }

      const catMatch = pathname.match(/^\/api\/society\/charge-categories\/([^/]+)$/);
      if (catMatch && method === 'PUT') {
        const catId = catMatch[1];
        const { name, description, defaultAmount, billingFrequency, applicableFlats, dueDay, isActive } = body;
        db.prepare(`
          UPDATE charge_categories
          SET name = COALESCE(?, name),
              description = COALESCE(?, description),
              default_amount = COALESCE(?, default_amount),
              billing_frequency = COALESCE(?, billing_frequency),
              applicable_flats = COALESCE(?, applicable_flats),
              due_day = COALESCE(?, due_day),
              is_active = COALESCE(?, is_active),
              updated_at = datetime('now')
          WHERE id = ? AND society_id = ?
        `).run(
          name ?? null,
          description ?? null,
          defaultAmount !== undefined ? Number(defaultAmount) : null,
          billingFrequency ?? null,
          applicableFlats ?? null,
          dueDay !== undefined ? Number(dueDay) : null,
          isActive !== undefined ? (isActive ? 1 : 0) : null,
          catId,
          societyId
        );
        return sendJson(res, 200, { message: 'Charge category updated.' });
      }

      if (pathname === '/api/society/bills' && method === 'GET') {
        const month = url.searchParams.get('month');
        const year = url.searchParams.get('year');
        const status = url.searchParams.get('status');
        const search = (url.searchParams.get('search') || '').trim().toLowerCase();

        const bills = db.prepare(`
          SELECT mb.*, h.flat_number, h.normalized_flat_number, h.block_name, sm.full_name as member_name, sm.email as member_email, sm.phone as member_phone
          FROM member_bills mb
          JOIN households h ON h.id = mb.household_id
          LEFT JOIN society_members sm ON sm.id = mb.member_id
          WHERE mb.society_id = ?
          ORDER BY mb.billing_year DESC, mb.billing_month DESC, h.normalized_flat_number ASC
        `).all(societyId) as Record<string, any>[];

        const items = db.prepare('SELECT * FROM bill_items WHERE society_id = ?').all(societyId) as Record<string, any>[];
        const itemsByBill = new Map<string, Record<string, any>[]>();
        for (const item of items) {
          const list = itemsByBill.get(item.bill_id) || [];
          list.push(item);
          itemsByBill.set(item.bill_id, list);
        }

        const enriched = bills
          .map((b) => ({ ...b, items: itemsByBill.get(b.id) || [] }))
          .filter((b) => {
            if (month && Number(b.billing_month) !== Number(month)) return false;
            if (year && Number(b.billing_year) !== Number(year)) return false;
            if (status && b.status !== status) return false;
            if (search) {
              const hay = `${b.bill_number} ${b.flat_number} ${b.member_name || ''}`.toLowerCase();
              if (!hay.includes(search)) return false;
            }
            return true;
          });

        return sendJson(res, 200, { bills: enriched });
      }

      // Generate Monthly Bills (Bulk or Individual) with Duplicate Bill Prevention (Section 6)
      if (pathname === '/api/society/bills/generate' && method === 'POST') {
        const {
          billingMonth,
          billingYear,
          householdId = null, // null = bulk for all eligible active households
          chargeCategoryIds = [],
          customAmounts = {}, // optional map of categoryId -> amount
          penaltyAmount = 0,
          creditAmount = 0,
          asDraft = false,
          dueDate,
        } = body;

        const m = Number(billingMonth);
        const y = Number(billingYear);
        if (!m || m < 1 || m > 12 || !y || y < 2020) {
          return sendJson(res, 400, { error: 'Valid billingMonth (1-12) and billingYear are required.' });
        }
        if (!Array.isArray(chargeCategoryIds) || chargeCategoryIds.length === 0) {
          return sendJson(res, 400, { error: 'At least one charge category must be selected.' });
        }

        const targetHouseholds = householdId
          ? (db.prepare("SELECT * FROM households WHERE id = ? AND society_id = ? AND status = 'ACTIVE'").all(householdId, societyId) as Record<string, any>[])
          : (db.prepare("SELECT * FROM households WHERE society_id = ? AND status = 'ACTIVE'").all(societyId) as Record<string, any>[]);

        if (targetHouseholds.length === 0) {
          return sendJson(res, 404, { error: 'No active households found for bill generation.' });
        }

        const categories = db.prepare('SELECT * FROM charge_categories WHERE society_id = ? AND is_active = 1').all(societyId) as Record<string, any>[];
        const selectedCategories = categories.filter((c) => chargeCategoryIds.includes(c.id));
        if (selectedCategories.length === 0) {
          return sendJson(res, 400, { error: 'Selected charge categories were not found in your society.' });
        }

        const billDueDate = dueDate || `${y}-${String(m).padStart(2, '0')}-10`;
        const createdBills: string[] = [];
        const skippedDuplicates: string[] = [];

        db.exec('BEGIN IMMEDIATE');
        try {
          for (const hh of targetHouseholds) {
            // Filter categories applicable to this flat
            const applicableCats = selectedCategories.filter((cat) => {
              if (!cat.applicable_flats || cat.applicable_flats === 'ALL') return true;
              const allowed = String(cat.applicable_flats)
                .split(',')
                .map((f) => normalizeFlatNumber(f));
              return allowed.includes(hh.normalized_flat_number);
            });
            if (applicableCats.length === 0) continue;

            // Check duplicate regular bill or duplicate charge items for this flat + period
            const existingRegular = db.prepare(`
              SELECT id FROM member_bills
              WHERE society_id = ? AND household_id = ? AND billing_month = ? AND billing_year = ?
                AND bill_type = 'REGULAR' AND status != 'CANCELLED'
            `).get(societyId, hh.id, m, y);

            const duplicateCatCheck = db.prepare(`
              SELECT id, category_name FROM bill_items
              WHERE society_id = ? AND household_id = ? AND billing_month = ? AND billing_year = ?
                AND charge_category_id = ? AND is_adjustment = 0
            `);

            let hasDuplicateCharge = false;
            for (const cat of applicableCats) {
              const dup = duplicateCatCheck.get(societyId, hh.id, m, y, cat.id);
              if (dup) {
                hasDuplicateCharge = true;
                break;
              }
            }

            if (existingRegular || hasDuplicateCharge) {
              skippedDuplicates.push(hh.normalized_flat_number);
              if (householdId) {
                // Individual generation explicitly fails with 409 so duplicate prevention is crystal clear
                db.exec('ROLLBACK');
                return sendJson(res, 409, {
                  error: `Duplicate bill prevented: A regular bill or charge for Flat ${hh.normalized_flat_number} in ${m}/${y} already exists. Issue an adjustment or supplementary bill instead.`,
                });
              }
              continue;
            }

            // Calculate previous unpaid balance for this household
            const prevRow = db.prepare(`
              SELECT COALESCE(SUM(balance_amount), 0) as prev
              FROM member_bills
              WHERE society_id = ? AND household_id = ? AND status NOT IN ('PAID', 'CANCELLED', 'DRAFT')
                AND (billing_year < ? OR (billing_year = ? AND billing_month < ?))
            `).get(societyId, hh.id, y, y, m) as { prev: number };

            const subtotal = applicableCats.reduce((sum, cat) => {
              const amt = customAmounts[cat.id] !== undefined ? Number(customAmounts[cat.id]) : Number(cat.default_amount);
              return sum + amt;
            }, 0);

            const previousBalance = Number(prevRow?.prev || 0);
            const pen = Number(penaltyAmount || 0);
            const cred = Number(creditAmount || 0);
            const totalAmount = Math.max(0, Number((subtotal + previousBalance + pen - cred).toFixed(2)));

            const billId = uuid();
            const billNumber = `BILL-${y}${String(m).padStart(2, '0')}-${hh.normalized_flat_number.replace(/[^A-Z0-9]/g, '')}-${billId.slice(0, 4).toUpperCase()}`;

            db.prepare(`
              INSERT INTO member_bills (
                id, society_id, household_id, member_id, bill_number, billing_month, billing_year,
                bill_type, status, subtotal_amount, previous_balance, penalty_amount, credit_amount,
                total_amount, paid_amount, balance_amount, due_date, issued_at, created_by
              ) VALUES (?, ?, ?, ?, ?, ?, ?, 'REGULAR', ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?)
            `).run(
              billId,
              societyId,
              hh.id,
              hh.primary_member_id,
              billNumber,
              m,
              y,
              asDraft ? 'DRAFT' : 'UNPAID',
              subtotal,
              previousBalance,
              pen,
              cred,
              totalAmount,
              totalAmount,
              billDueDate,
              asDraft ? null : new Date().toISOString(),
              auth?.userId ?? null
            );

            for (const cat of applicableCats) {
              const amt = customAmounts[cat.id] !== undefined ? Number(customAmounts[cat.id]) : Number(cat.default_amount);
              db.prepare(`
                INSERT INTO bill_items (
                  id, society_id, bill_id, household_id, charge_category_id, category_name,
                  billing_month, billing_year, description, amount, is_adjustment
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
              `).run(uuid(), societyId, billId, hh.id, cat.id, cat.name, m, y, `${cat.name} (${m}/${y})`, amt);
            }

            if (!asDraft && hh.primary_member_id) {
              const memUser = db.prepare('SELECT user_id FROM society_members WHERE id = ?').get(hh.primary_member_id) as { user_id: string } | undefined;
              sendNotification({
                societyId,
                userId: memUser?.user_id,
                notificationType: 'NEW_MONTHLY_BILL',
                title: `New Monthly Bill Issued: ${billNumber}`,
                message: `Your society bill for ${m}/${y} of ₹${totalAmount} is due by ${billDueDate}.`,
                channel: 'EMAIL',
                dedupKey: `bill-issued:${billId}`,
              });
            }

            createdBills.push(billId);
          }

          if (createdBills.length === 0 && skippedDuplicates.length > 0) {
            db.exec('ROLLBACK');
            return sendJson(res, 409, {
              error: `Duplicate bills prevented: All target flats (${skippedDuplicates.join(', ')}) already have bills generated for ${m}/${y}.`,
            });
          }

          logAudit({
            societyId,
            actorUserId: auth?.userId,
            actorRole: auth?.role || 'SOCIETY_ADMIN',
            action: 'BILLS_GENERATED',
            entityType: 'MEMBER_BILL',
            details: { billingMonth: m, billingYear: y, createdCount: createdBills.length, skippedDuplicates },
          });

          db.exec('COMMIT');
          return sendJson(res, 201, {
            createdCount: createdBills.length,
            createdBillIds: createdBills,
            skippedDuplicates,
            message: `Generated ${createdBills.length} bill(s) for ${m}/${y}.${skippedDuplicates.length ? ` Skipped ${skippedDuplicates.length} already-billed flat(s).` : ''}`,
          });
        } catch (err: any) {
          db.exec('ROLLBACK');
          if (String(err?.message || '').includes('UNIQUE constraint failed')) {
            return sendJson(res, 409, {
              error: 'Duplicate bill prevented by database constraint for the same flat, period, and charge category.',
            });
          }
          throw err;
        }
      }

      // Publish Draft Bill
      const publishBillMatch = pathname.match(/^\/api\/society\/bills\/([^/]+)\/publish$/);
      if (publishBillMatch && method === 'POST') {
        const billId = publishBillMatch[1];
        const bill = db.prepare('SELECT * FROM member_bills WHERE id = ? AND society_id = ?').get(billId, societyId) as Record<string, any> | undefined;
        if (!bill) return sendJson(res, 404, { error: 'Bill not found.' });
        db.prepare("UPDATE member_bills SET status = 'UNPAID', issued_at = datetime('now'), updated_at = datetime('now') WHERE id = ?").run(billId);
        return sendJson(res, 200, { message: 'Draft bill published and issued to member.' });
      }

      // Issue Supplementary / Adjustment Bill with Mandatory Audit Reason (Section 6)
      if (pathname === '/api/society/bills/adjustment' && method === 'POST') {
        const { householdId, billingMonth, billingYear, chargeCategoryId, amount, reason, dueDate } = body;
        if (!householdId || !billingMonth || !billingYear || !chargeCategoryId || !amount || !reason) {
          return sendJson(res, 400, {
            error: 'householdId, billingMonth, billingYear, chargeCategoryId, amount, and reason are required for an adjustment/supplementary bill.',
          });
        }

        const hh = db.prepare('SELECT * FROM households WHERE id = ? AND society_id = ?').get(householdId, societyId) as Record<string, any> | undefined;
        const cat = db.prepare('SELECT * FROM charge_categories WHERE id = ? AND society_id = ?').get(chargeCategoryId, societyId) as Record<string, any> | undefined;
        if (!hh || !cat) return sendJson(res, 404, { error: 'Household or charge category not found.' });

        const billId = uuid();
        const m = Number(billingMonth);
        const y = Number(billingYear);
        const amt = Number(amount);
        const billNumber = `SUPP-${y}${String(m).padStart(2, '0')}-${hh.normalized_flat_number.replace(/[^A-Z0-9]/g, '')}-${billId.slice(0, 4).toUpperCase()}`;

        db.exec('BEGIN IMMEDIATE');
        try {
          db.prepare(`
            INSERT INTO member_bills (
              id, society_id, household_id, member_id, bill_number, billing_month, billing_year,
              bill_type, adjustment_reason, status, subtotal_amount, total_amount, paid_amount, balance_amount,
              due_date, issued_at, created_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 'SUPPLEMENTARY', ?, 'UNPAID', ?, ?, 0, ?, ?, datetime('now'), ?)
          `).run(
            billId,
            societyId,
            hh.id,
            hh.primary_member_id,
            billNumber,
            m,
            y,
            String(reason).trim(),
            amt,
            amt,
            amt,
            dueDate || `${y}-${String(m).padStart(2, '0')}-20`,
            auth?.userId ?? null
          );

          db.prepare(`
            INSERT INTO bill_items (
              id, society_id, bill_id, household_id, charge_category_id, category_name,
              billing_month, billing_year, description, amount, is_adjustment
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
          `).run(uuid(), societyId, billId, hh.id, cat.id, cat.name, m, y, `Supplementary: ${reason}`, amt);

          db.prepare(`
            INSERT INTO bill_adjustments (id, society_id, bill_id, adjustment_type, amount, reason, created_by)
            VALUES (?, ?, ?, 'SUPPLEMENTARY', ?, ?, ?)
          `).run(uuid(), societyId, billId, amt, String(reason).trim(), auth?.userId ?? '');

          logAudit({
            societyId,
            actorUserId: auth?.userId,
            actorRole: auth?.role || 'SOCIETY_ADMIN',
            action: 'SUPPLEMENTARY_BILL_ISSUED',
            entityType: 'MEMBER_BILL',
            entityId: billId,
            details: { flatNumber: hh.normalized_flat_number, amount: amt, reason },
          });

          db.exec('COMMIT');
          return sendJson(res, 201, { billId, billNumber, message: 'Supplementary/Adjustment bill issued with audit trail.' });
        } catch (err) {
          db.exec('ROLLBACK');
          throw err;
        }
      }

      // 5.4 PAYMENT VERIFICATION & RECEIPT GENERATION (Section 7 — Idempotent Ledger Posting)
      if (pathname === '/api/society/payments' && method === 'GET') {
        const status = url.searchParams.get('status') || '';
        const search = (url.searchParams.get('search') || '').trim().toLowerCase();
        const includeManualContext = url.searchParams.get('includeManualContext') === '1';

        const payments = db.prepare(`
          SELECT p.*, sm.full_name as member_name, h.flat_number, h.block_name,
                 pr.receipt_number
          FROM payments p
          JOIN society_members sm ON sm.id = p.member_id
          JOIN households h ON h.id = p.household_id
          LEFT JOIN payment_receipts pr ON pr.payment_id = p.id
          WHERE p.society_id = ?
          ORDER BY p.created_at DESC
        `).all(societyId) as Record<string, any>[];

        const allocations = db.prepare(`
          SELECT pa.*, mb.bill_number, mb.billing_month, mb.billing_year
          FROM payment_allocations pa
          JOIN member_bills mb ON mb.id = pa.bill_id
          WHERE pa.society_id = ?
        `).all(societyId) as Record<string, any>[];

        const allocByPayment = new Map<string, Record<string, any>[]>();
        for (const al of allocations) {
          const arr = allocByPayment.get(al.payment_id) || [];
          arr.push(al);
          allocByPayment.set(al.payment_id, arr);
        }

        const filtered = payments
          .map((p) => ({ ...p, allocations: allocByPayment.get(p.id) || [] }))
          .filter((p) => {
            if (status && p.status !== status) return false;
            if (search) {
              const hay = `${p.reference_number} ${p.member_name} ${p.flat_number} ${p.receipt_number || ''}`.toLowerCase();
              if (!hay.includes(search)) return false;
            }
            return true;
          });

        if (includeManualContext) {
          const households = db.prepare(`
            SELECT h.*, sm.full_name as primary_member_name, sm.phone as primary_member_phone, sm.email as primary_member_email
            FROM households h
            LEFT JOIN society_members sm ON sm.id = h.primary_member_id
            WHERE h.society_id = ? AND h.status != 'ARCHIVED'
            ORDER BY h.normalized_flat_number ASC
          `).all(societyId);

          const members = db.prepare(`
            SELECT sm.id, sm.household_id, sm.full_name, sm.phone, sm.email, sm.is_primary_member, h.flat_number, h.normalized_flat_number, h.block_name
            FROM society_members sm
            JOIN households h ON h.id = sm.household_id
            WHERE sm.society_id = ? AND sm.account_status = 'ACTIVE'
            ORDER BY h.normalized_flat_number ASC, sm.is_primary_member DESC
          `).all(societyId);

          const unpaidBills = db.prepare(`
            SELECT mb.*, h.flat_number, h.block_name, sm.full_name as member_name
            FROM member_bills mb
            JOIN households h ON h.id = mb.household_id
            LEFT JOIN society_members sm ON sm.id = mb.member_id
            WHERE mb.society_id = ? AND mb.status NOT IN ('PAID', 'CANCELLED', 'DRAFT') AND mb.balance_amount > 0
            ORDER BY mb.due_date ASC, mb.billing_year ASC, mb.billing_month ASC
          `).all(societyId);

          return sendJson(res, 200, { payments: filtered, households, members, unpaidBills });
        }

        return sendJson(res, 200, { payments: filtered });
      }

      // Manual Payment Received at Society Office Desk (Cash / Cheque / UPI / Bank Transfer)
      if (pathname === '/api/society/payments/manual' && method === 'POST') {
        const {
          householdId,
          memberId,
          billIds = [],
          amount,
          paymentDate,
          paymentMethod = 'CASH',
          referenceNumber,
          notes = '',
          proofUrl = null,
          autoConfirm = true,
        } = body;

        if (!householdId || !amount || Number(amount) <= 0) {
          return sendJson(res, 400, {
            error: 'Household/Flat selection and a positive payment amount are required.',
          });
        }

        const household = db.prepare(`
          SELECT * FROM households WHERE id = ? AND society_id = ? AND status != 'ARCHIVED'
        `).get(householdId, societyId) as Record<string, any> | undefined;

        if (!household) {
          return sendJson(res, 404, { error: 'Selected flat/household was not found in this society.' });
        }

        let member = memberId
          ? (db.prepare('SELECT * FROM society_members WHERE id = ? AND society_id = ? AND household_id = ?').get(memberId, societyId, householdId) as Record<string, any> | undefined)
          : undefined;
        if (!member && household.primary_member_id) {
          member = db.prepare('SELECT * FROM society_members WHERE id = ? AND society_id = ?').get(household.primary_member_id, societyId) as Record<string, any> | undefined;
        }
        if (!member) {
          member = db.prepare('SELECT * FROM society_members WHERE household_id = ? AND society_id = ? ORDER BY is_primary_member DESC LIMIT 1').get(householdId, societyId) as Record<string, any> | undefined;
        }
        if (!member) {
          return sendJson(res, 400, { error: 'No active resident member is linked to this flat.' });
        }

        const paymentId = uuid();
        const totalPaidInput = Number(Number(amount).toFixed(2));
        const dateStr = paymentDate || new Date().toISOString().slice(0, 10);
        const cleanRef = String(referenceNumber || '').trim() || `${paymentMethod}-${dateStr.replace(/-/g, '')}-${paymentId.slice(0, 4).toUpperCase()}`;
        const verificationNote = String(notes || '').trim() || `Manual payment received at society office (${paymentMethod})`;

        // Determine target bills (explicitly selected bills or oldest unpaid bills for this household)
        let targetBills: Record<string, any>[] = [];
        if (Array.isArray(billIds) && billIds.length > 0) {
          for (const bId of billIds) {
            const b = db.prepare('SELECT * FROM member_bills WHERE id = ? AND society_id = ? AND household_id = ?').get(bId, societyId, householdId) as Record<string, any> | undefined;
            if (b) targetBills.push(b);
          }
        } else {
          targetBills = db.prepare(`
            SELECT * FROM member_bills
            WHERE society_id = ? AND household_id = ? AND status NOT IN ('PAID', 'CANCELLED', 'DRAFT') AND balance_amount > 0
            ORDER BY due_date ASC, billing_year ASC, billing_month ASC
          `).all(societyId, householdId) as Record<string, any>[];
        }

        db.exec('BEGIN IMMEDIATE');
        try {
          const initialStatus = autoConfirm ? 'CONFIRMED' : 'PENDING_VERIFICATION';
          const ledgerPosted = autoConfirm ? 1 : 0;

          db.prepare(`
            INSERT INTO payments (
              id, society_id, household_id, member_id, payment_method, amount, payment_date,
              reference_number, proof_url, status, verification_notes, verified_by, verified_at, ledger_posted
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ${autoConfirm ? "datetime('now')" : 'NULL'}, ?)
          `).run(
            paymentId,
            societyId,
            householdId,
            member.id,
            paymentMethod,
            totalPaidInput,
            dateStr,
            cleanRef,
            proofUrl,
            initialStatus,
            verificationNote,
            autoConfirm ? (auth?.userId ?? null) : null,
            ledgerPosted
          );

          let remainingToAllocate = totalPaidInput;
          for (const bill of targetBills) {
            if (remainingToAllocate <= 0) break;
            const billBalance = Number(bill.balance_amount ?? bill.total_amount);
            const allocAmt = Math.min(remainingToAllocate, billBalance > 0 ? billBalance : remainingToAllocate);
            if (allocAmt <= 0) continue;

            db.prepare(`
              INSERT INTO payment_allocations (id, society_id, payment_id, bill_id, allocated_amount)
              VALUES (?, ?, ?, ?, ?)
            `).run(uuid(), societyId, paymentId, bill.id, allocAmt);

            if (autoConfirm) {
              const newPaid = Number((Number(bill.paid_amount) + allocAmt).toFixed(2));
              const newBalance = Math.max(0, Number((Number(bill.total_amount) - newPaid).toFixed(2)));
              const newBillStatus = newBalance === 0 ? 'PAID' : 'PARTIALLY_PAID';
              db.prepare(`
                UPDATE member_bills
                SET paid_amount = ?, balance_amount = ?, status = ?, updated_at = datetime('now')
                WHERE id = ?
              `).run(newPaid, newBalance, newBillStatus, bill.id);
            } else if (bill.status === 'UNPAID' || bill.status === 'OVERDUE') {
              db.prepare("UPDATE member_bills SET status = 'PENDING_VERIFICATION', updated_at = datetime('now') WHERE id = ?").run(bill.id);
            }

            remainingToAllocate = Math.max(0, Number((remainingToAllocate - allocAmt).toFixed(2)));
          }

          let receiptRecord: Record<string, any> | null = null;

          if (autoConfirm) {
            const receiptNumber = `RCP-${new Date().getFullYear()}-${paymentId.slice(0, 6).toUpperCase()}`;
            const receiptId = uuid();
            db.prepare(`
              INSERT INTO payment_receipts (
                id, society_id, payment_id, receipt_number, issued_to_name, flat_number,
                amount, payment_method, reference_number, issued_by
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).run(
              receiptId,
              societyId,
              paymentId,
              receiptNumber,
              member.full_name,
              household.flat_number,
              totalPaidInput,
              paymentMethod,
              cleanRef,
              auth?.userId ?? null
            );

            const accountType = paymentMethod === 'CASH' ? 'CASH' : 'BANK';
            const txnCode = `TXN-INC-${Date.now()}-${paymentId.slice(0, 4).toUpperCase()}`;
            db.prepare(`
              INSERT INTO ledger_entries (
                id, society_id, transaction_code, entry_date, entry_type, account_type,
                category, description, amount, direction, reference_type, reference_id,
                household_id, flat_number, member_id, payment_method, created_by
              ) VALUES (?, ?, ?, ?, 'INCOME', ?, 'Maintenance Collection', ?, ?, 'CREDIT', 'PAYMENT', ?, ?, ?, ?, ?, ?)
            `).run(
              uuid(),
              societyId,
              txnCode,
              dateStr,
              accountType,
              `Manual payment received ${receiptNumber} (Flat ${household.flat_number}, Ref: ${cleanRef})`,
              totalPaidInput,
              paymentId,
              householdId,
              household.flat_number,
              member.id,
              paymentMethod,
              auth?.userId ?? null
            );

            db.prepare(`
              UPDATE financial_accounts
              SET current_balance = current_balance + ?, updated_at = datetime('now')
              WHERE society_id = ? AND account_type = ?
            `).run(totalPaidInput, societyId, accountType);

            sendNotification({
              societyId,
              userId: member.user_id,
              notificationType: 'PAYMENT_CONFIRMED',
              title: `Payment Received — Receipt ${receiptNumber}`,
              message: `Your payment of ₹${totalPaidInput} (${paymentMethod}, Ref: ${cleanRef}) has been recorded by society management. Receipt #${receiptNumber} is ready.`,
              channel: 'EMAIL',
              dedupKey: `pay-man-conf:${paymentId}`,
            });

            receiptRecord = {
              id: paymentId,
              receipt_id: receiptId,
              receipt_number: receiptNumber,
              flat_number: household.flat_number,
              member_name: member.full_name,
              amount: totalPaidInput,
              payment_date: dateStr,
              payment_method: paymentMethod,
              reference_number: cleanRef,
            };
          }

          logAudit({
            societyId,
            actorUserId: auth?.userId,
            actorRole: auth?.role || 'SOCIETY_ADMIN',
            action: autoConfirm ? 'MANUAL_PAYMENT_RECEIVED_CONFIRMED' : 'MANUAL_PAYMENT_RECORDED_PENDING',
            entityType: 'PAYMENT',
            entityId: paymentId,
            details: {
              flatNumber: household.flat_number,
              memberName: member.full_name,
              amount: totalPaidInput,
              paymentMethod,
              referenceNumber: cleanRef,
              autoConfirm,
              receiptNumber: receiptRecord?.receipt_number || null,
            },
          });

          db.exec('COMMIT');
          return sendJson(res, 201, {
            id: paymentId,
            status: initialStatus,
            receipt: receiptRecord,
            message: autoConfirm
              ? `Manual payment of ₹${totalPaidInput} recorded & confirmed! Receipt ${receiptRecord?.receipt_number} generated.`
              : `Manual payment of ₹${totalPaidInput} recorded as Pending Verification.`,
          });
        } catch (err) {
          db.exec('ROLLBACK');
          throw err;
        }
      }

      const verifyPaymentMatch = pathname.match(/^\/api\/society\/payments\/([^/]+)\/verify$/);
      if (verifyPaymentMatch && method === 'POST') {
        const paymentId = verifyPaymentMatch[1];
        const { decision, notes = '' } = body; // 'CONFIRM' or 'REJECT'
        if (decision !== 'CONFIRM' && decision !== 'REJECT') {
          return sendJson(res, 400, { error: "decision must be 'CONFIRM' or 'REJECT'." });
        }

        const payment = db.prepare(`
          SELECT p.*, sm.full_name as member_name, sm.user_id as member_user_id, h.flat_number
          FROM payments p
          JOIN society_members sm ON sm.id = p.member_id
          JOIN households h ON h.id = p.household_id
          WHERE p.id = ? AND p.society_id = ?
        `).get(paymentId, societyId) as Record<string, any> | undefined;

        if (!payment) {
          return sendJson(res, 404, { error: 'Payment record not found in your society.' });
        }

        // CRITICAL IDEMPOTENCY REQUIREMENT (Section 7 & Acceptance Criterion 8):
        // Prevent duplicate accounting entries if confirmation action is repeated.
        if (decision === 'CONFIRM' && (payment.status === 'CONFIRMED' || payment.ledger_posted === 1)) {
          const existingReceipt = db.prepare('SELECT * FROM payment_receipts WHERE payment_id = ?').get(paymentId);
          return sendJson(res, 200, {
            alreadyConfirmed: true,
            receipt: existingReceipt,
            message: 'Payment was already confirmed. Duplicate ledger entry prevented.',
          });
        }

        db.exec('BEGIN IMMEDIATE');
        try {
          if (decision === 'REJECT') {
            db.prepare(`
              UPDATE payments
              SET status = 'REJECTED', verification_notes = ?, verified_by = ?, verified_at = datetime('now'), updated_at = datetime('now')
              WHERE id = ? AND society_id = ?
            `).run(String(notes || 'Payment reference could not be verified'), auth?.userId ?? null, paymentId, societyId);

            // Reset linked bills from PENDING_VERIFICATION back to UNPAID/PARTIALLY_PAID
            const allocs = db.prepare('SELECT * FROM payment_allocations WHERE payment_id = ?').all(paymentId) as Record<string, any>[];
            for (const al of allocs) {
              const b = db.prepare('SELECT * FROM member_bills WHERE id = ?').get(al.bill_id) as Record<string, any> | undefined;
              if (b && b.status === 'PENDING_VERIFICATION') {
                const revertedStatus = Number(b.paid_amount) > 0 ? 'PARTIALLY_PAID' : 'UNPAID';
                db.prepare("UPDATE member_bills SET status = ?, updated_at = datetime('now') WHERE id = ?").run(revertedStatus, b.id);
              }
            }

            sendNotification({
              societyId,
              userId: payment.member_user_id,
              notificationType: 'PAYMENT_REJECTED',
              title: 'Payment Verification Rejected',
              message: `Your payment of ₹${payment.amount} (Ref: ${payment.reference_number}) was rejected. Reason: ${notes || 'Reference mismatch'}.`,
              channel: 'EMAIL',
              dedupKey: `pay-rej:${paymentId}`,
            });

            logAudit({
              societyId,
              actorUserId: auth?.userId,
              actorRole: auth?.role || 'SOCIETY_ADMIN',
              action: 'PAYMENT_REJECTED',
              entityType: 'PAYMENT',
              entityId: paymentId,
              details: { notes, referenceNumber: payment.reference_number },
            });

            db.exec('COMMIT');
            return sendJson(res, 200, { status: 'REJECTED', message: 'Payment rejected and member notified.' });
          }

          // CONFIRM PAYMENT:
          // 1. Mark payment as CONFIRMED and ledger_posted = 1
          db.prepare(`
            UPDATE payments
            SET status = 'CONFIRMED', verification_notes = ?, verified_by = ?, verified_at = datetime('now'),
                ledger_posted = 1, updated_at = datetime('now')
            WHERE id = ? AND society_id = ?
          `).run(String(notes || 'Verified and confirmed'), auth?.userId ?? null, paymentId, societyId);

          // 2. Allocate payment to bills & update balances
          const allocs = db.prepare('SELECT * FROM payment_allocations WHERE payment_id = ?').all(paymentId) as Record<string, any>[];
          let remainingToAllocate = Number(payment.amount);

          for (const al of allocs) {
            const bill = db.prepare('SELECT * FROM member_bills WHERE id = ? AND society_id = ?').get(al.bill_id, societyId) as Record<string, any> | undefined;
            if (!bill) continue;
            const allocAmt = Math.min(remainingToAllocate, Number(al.allocated_amount));
            const newPaid = Number((Number(bill.paid_amount) + allocAmt).toFixed(2));
            const newBalance = Math.max(0, Number((Number(bill.total_amount) - newPaid).toFixed(2)));
            const newBillStatus = newBalance === 0 ? 'PAID' : 'PARTIALLY_PAID';

            db.prepare(`
              UPDATE member_bills
              SET paid_amount = ?, balance_amount = ?, status = ?, updated_at = datetime('now')
              WHERE id = ?
            `).run(newPaid, newBalance, newBillStatus, bill.id);
            remainingToAllocate = Math.max(0, Number((remainingToAllocate - allocAmt).toFixed(2)));
          }

          // 3. Generate unique receipt
          const receiptNumber = `RCP-${new Date().getFullYear()}-${paymentId.slice(0, 6).toUpperCase()}`;
          const receiptId = uuid();
          db.prepare(`
            INSERT INTO payment_receipts (
              id, society_id, payment_id, receipt_number, issued_to_name, flat_number,
              amount, payment_method, reference_number, issued_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            receiptId,
            societyId,
            paymentId,
            receiptNumber,
            payment.member_name,
            payment.flat_number,
            Number(payment.amount),
            payment.payment_method,
            payment.reference_number,
            auth?.userId ?? null
          );

          // 4. Record in Financial Ledger (Protected by UNIQUE(society_id, reference_type, reference_id, entry_type))
          const accountType = payment.payment_method === 'CASH' ? 'CASH' : 'BANK';
          const txnCode = `TXN-INC-${Date.now()}-${paymentId.slice(0, 4).toUpperCase()}`;
          db.prepare(`
            INSERT INTO ledger_entries (
              id, society_id, transaction_code, entry_date, entry_type, account_type,
              category, description, amount, direction, reference_type, reference_id,
              household_id, flat_number, member_id, payment_method, created_by
            ) VALUES (?, ?, ?, ?, 'INCOME', ?, 'Maintenance Collection', ?, ?, 'CREDIT', 'PAYMENT', ?, ?, ?, ?, ?, ?)
          `).run(
            uuid(),
            societyId,
            txnCode,
            payment.payment_date,
            accountType,
            `Confirmed payment ${receiptNumber} (Flat ${payment.flat_number}, Ref: ${payment.reference_number})`,
            Number(payment.amount),
            paymentId,
            payment.household_id,
            payment.flat_number,
            payment.member_id,
            payment.payment_method,
            auth?.userId ?? null
          );

          // 5. Update society's CASH or BANK account balance
          db.prepare(`
            UPDATE financial_accounts
            SET current_balance = current_balance + ?, updated_at = datetime('now')
            WHERE society_id = ? AND account_type = ?
          `).run(Number(payment.amount), societyId, accountType);

          // 6. Notify Member
          sendNotification({
            societyId,
            userId: payment.member_user_id,
            notificationType: 'PAYMENT_CONFIRMED',
            title: `Payment Confirmed — Receipt ${receiptNumber}`,
            message: `Your payment of ₹${payment.amount} has been verified and confirmed. Receipt #${receiptNumber} is now available for download.`,
            channel: 'EMAIL',
            dedupKey: `pay-conf:${paymentId}`,
          });

          logAudit({
            societyId,
            actorUserId: auth?.userId,
            actorRole: auth?.role || 'SOCIETY_ADMIN',
            action: 'PAYMENT_CONFIRMED',
            entityType: 'PAYMENT',
            entityId: paymentId,
            details: { receiptNumber, amount: payment.amount, accountType },
          });

          db.exec('COMMIT');
          const receipt = db.prepare('SELECT * FROM payment_receipts WHERE id = ?').get(receiptId);
          return sendJson(res, 200, { status: 'CONFIRMED', receipt, message: `Payment confirmed and Receipt ${receiptNumber} generated.` });
        } catch (err) {
          db.exec('ROLLBACK');
          throw err;
        }
      }

      // 5.5 STAFF, OFFICE BEARERS, ROLES, PERMISSIONS, DUTY & ATTENDANCE (Sections 9 & 13)
      if (pathname === '/api/society/roles' && method === 'GET') {
        const roles = db.prepare(`
          SELECT sr.*,
                 rp.view_members, rp.manage_members, rp.generate_bills, rp.verify_payments,
                 rp.manage_expenses, rp.view_financial_reports, rp.manage_complaints,
                 rp.manage_events, rp.manage_staff, rp.change_society_settings
          FROM staff_roles sr
          LEFT JOIN role_permissions rp ON rp.role_id = sr.id
          WHERE sr.society_id = ?
          ORDER BY sr.is_office_bearer DESC, sr.name ASC
        `).all(societyId);
        return sendJson(res, 200, { roles });
      }

      if (pathname === '/api/society/roles' && method === 'POST') {
        const { name, isOfficeBearer = false, permissions = {} } = body;
        if (!name) return sendJson(res, 400, { error: 'Role name is required.' });
        const roleId = uuid();
        db.exec('BEGIN IMMEDIATE');
        try {
          db.prepare(`
            INSERT INTO staff_roles (id, society_id, name, is_office_bearer, is_system_default)
            VALUES (?, ?, ?, ?, 0)
          `).run(roleId, societyId, String(name).trim(), isOfficeBearer ? 1 : 0);

          db.prepare(`
            INSERT INTO role_permissions (
              id, society_id, role_id, view_members, manage_members, generate_bills, verify_payments,
              manage_expenses, view_financial_reports, manage_complaints, manage_events, manage_staff, change_society_settings
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            uuid(),
            societyId,
            roleId,
            permissions.view_members ? 1 : 0,
            permissions.manage_members ? 1 : 0,
            permissions.generate_bills ? 1 : 0,
            permissions.verify_payments ? 1 : 0,
            permissions.manage_expenses ? 1 : 0,
            permissions.view_financial_reports ? 1 : 0,
            permissions.manage_complaints ? 1 : 0,
            permissions.manage_events ? 1 : 0,
            permissions.manage_staff ? 1 : 0,
            permissions.change_society_settings ? 1 : 0
          );
          db.exec('COMMIT');
          return sendJson(res, 201, { roleId, message: 'Custom staff/office-bearer role created.' });
        } catch (err: any) {
          db.exec('ROLLBACK');
          if (String(err?.message || '').includes('UNIQUE')) {
            return sendJson(res, 409, { error: 'A role with this name already exists in your society.' });
          }
          throw err;
        }
      }

      const rolePermMatch = pathname.match(/^\/api\/society\/roles\/([^/]+)\/permissions$/);
      if (rolePermMatch && method === 'PUT') {
        const roleId = rolePermMatch[1];
        const p = body.permissions || body;
        db.prepare(`
          UPDATE role_permissions
          SET view_members = ?, manage_members = ?, generate_bills = ?, verify_payments = ?,
              manage_expenses = ?, view_financial_reports = ?, manage_complaints = ?,
              manage_events = ?, manage_staff = ?, change_society_settings = ?,
              updated_at = datetime('now')
          WHERE role_id = ? AND society_id = ?
        `).run(
          p.view_members ? 1 : 0,
          p.manage_members ? 1 : 0,
          p.generate_bills ? 1 : 0,
          p.verify_payments ? 1 : 0,
          p.manage_expenses ? 1 : 0,
          p.view_financial_reports ? 1 : 0,
          p.manage_complaints ? 1 : 0,
          p.manage_events ? 1 : 0,
          p.manage_staff ? 1 : 0,
          p.change_society_settings ? 1 : 0,
          roleId,
          societyId
        );
        return sendJson(res, 200, { message: 'Role permissions updated.' });
      }

      if (pathname === '/api/society/staff' && method === 'GET') {
        const staffList = db.prepare(`
          SELECT st.*, sr.name as role_name, sr.is_office_bearer
          FROM staff st
          JOIN staff_roles sr ON sr.id = st.role_id
          WHERE st.society_id = ?
          ORDER BY st.is_on_duty DESC, st.full_name ASC
        `).all(societyId) as Record<string, any>[];

        const docs = db.prepare(`
          SELECT id, staff_id, document_type, masked_document_number, document_url, created_at
          FROM staff_documents
          WHERE society_id = ?
        `).all(societyId) as Record<string, any>[];

        const docsByStaff = new Map<string, Record<string, any>[]>();
        for (const d of docs) {
          const arr = docsByStaff.get(d.staff_id) || [];
          arr.push(d);
          docsByStaff.set(d.staff_id, arr);
        }

        const attendance = db.prepare(`
          SELECT ar.*, st.full_name as staff_name
          FROM attendance_records ar
          JOIN staff st ON st.id = ar.staff_id
          WHERE ar.society_id = ?
          ORDER BY ar.attendance_date DESC LIMIT 100
        `).all(societyId);

        return sendJson(res, 200, {
          staff: staffList.map((s) => ({ ...s, documents: docsByStaff.get(s.id) || [] })),
          attendance,
        });
      }

      if (pathname === '/api/society/staff' && method === 'POST') {
        const {
          fullName,
          phone,
          email = null,
          password = null,
          address = '',
          roleId,
          designation,
          joiningDate,
          wageType = 'MONTHLY',
          salaryAmount = 0,
          dutySchedule = '',
          assignedDuties = '',
          isOnDuty = true,
          showContactToMembers = true,
          photoUrl = null,
          documentType = null,
          documentNumber = null,
          documentUrl = null,
        } = body;

        if (!fullName || !phone || !roleId || !designation) {
          return sendJson(res, 400, { error: 'fullName, phone, roleId, and designation are required.' });
        }

        const staffId = uuid();
        let staffUserId: string | null = null;

        db.exec('BEGIN IMMEDIATE');
        try {
          if (email && password) {
            const cleanEmail = String(email).trim().toLowerCase();
            if (db.prepare('SELECT id FROM users WHERE email = ?').get(cleanEmail)) {
              db.exec('ROLLBACK');
              return sendJson(res, 409, { error: 'Email already in use by another user.' });
            }
            staffUserId = uuid();
            db.prepare(`
              INSERT INTO users (id, email, phone, password_hash, role, society_id, is_active, email_verified)
              VALUES (?, ?, ?, ?, 'STAFF', ?, 1, 1)
            `).run(staffUserId, cleanEmail, String(phone).trim(), hashPassword(String(password)), societyId);

            db.prepare(`
              INSERT INTO user_profiles (id, user_id, society_id, full_name, avatar_url, preferred_language)
              VALUES (?, ?, ?, ?, ?, 'en')
            `).run(uuid(), staffUserId, societyId, String(fullName).trim(), photoUrl);
          }

          db.prepare(`
            INSERT INTO staff (
              id, society_id, user_id, role_id, full_name, photo_url, phone, email, address,
              designation, joining_date, wage_type, salary_amount, employment_status,
              is_on_duty, duty_schedule, assigned_duties, show_contact_to_members
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?, ?, ?, ?)
          `).run(
            staffId,
            societyId,
            staffUserId,
            roleId,
            String(fullName).trim(),
            photoUrl,
            String(phone).trim(),
            email ? String(email).trim().toLowerCase() : null,
            address,
            String(designation).trim(),
            joiningDate || new Date().toISOString().slice(0, 10),
            wageType,
            Number(salaryAmount || 0),
            isOnDuty ? 1 : 0,
            dutySchedule,
            assignedDuties,
            showContactToMembers ? 1 : 0
          );

          if (documentType && documentNumber) {
            const masked = maskDocumentNumber(String(documentType), String(documentNumber));
            db.prepare(`
              INSERT INTO staff_documents (id, society_id, staff_id, document_type, masked_document_number, document_url, uploaded_by)
              VALUES (?, ?, ?, ?, ?, ?, ?)
            `).run(uuid(), societyId, staffId, String(documentType), masked, documentUrl || '/uploads/id-document-placeholder.pdf', auth?.userId ?? '');
          }

          db.prepare(`
            INSERT INTO staff_duty_records (id, society_id, staff_id, duty_status, shift_notes, changed_by)
            VALUES (?, ?, ?, ?, 'Initial staff creation', ?)
          `).run(uuid(), societyId, staffId, isOnDuty ? 'ON_DUTY' : 'OFF_DUTY', auth?.userId ?? null);

          logAudit({
            societyId,
            actorUserId: auth?.userId,
            actorRole: auth?.role || 'SOCIETY_ADMIN',
            action: 'STAFF_CREATED',
            entityType: 'STAFF',
            entityId: staffId,
            details: { fullName, designation, isOnDuty },
          });

          db.exec('COMMIT');
          return sendJson(res, 201, { staffId, message: 'Staff profile created successfully.' });
        } catch (err) {
          db.exec('ROLLBACK');
          throw err;
        }
      }

      const staffDutyMatch = pathname.match(/^\/api\/society\/staff\/([^/]+)\/duty$/);
      if (staffDutyMatch && method === 'PUT') {
        const staffId = staffDutyMatch[1];
        const staffMember = db.prepare('SELECT * FROM staff WHERE id = ? AND society_id = ?').get(staffId, societyId) as Record<string, any> | undefined;
        if (!staffMember) return sendJson(res, 404, { error: 'Staff member not found.' });

        const { isOnDuty, shiftNotes = '' } = body;
        const nextDuty = isOnDuty ? 1 : 0;
        db.prepare("UPDATE staff SET is_on_duty = ?, updated_at = datetime('now') WHERE id = ? AND society_id = ?").run(nextDuty, staffId, societyId);
        db.prepare(`
          INSERT INTO staff_duty_records (id, society_id, staff_id, duty_status, shift_notes, changed_by)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(uuid(), societyId, staffId, nextDuty ? 'ON_DUTY' : 'OFF_DUTY', shiftNotes, auth?.userId ?? null);

        logAudit({
          societyId,
          actorUserId: auth?.userId,
          actorRole: auth?.role || 'SOCIETY_ADMIN',
          action: 'STAFF_DUTY_STATUS_CHANGED',
          entityType: 'STAFF',
          entityId: staffId,
          details: { fullName: staffMember.full_name, isOnDuty: Boolean(nextDuty) },
        });

        return sendJson(res, 200, {
          staffId,
          isOnDuty: Boolean(nextDuty),
          message: `${staffMember.full_name} marked as ${nextDuty ? 'On Duty' : 'Off Duty'}.`,
        });
      }

      const staffUpdateMatch = pathname.match(/^\/api\/society\/staff\/([^/]+)$/);
      if (staffUpdateMatch && method === 'PUT') {
        const staffId = staffUpdateMatch[1];
        const { fullName, phone, designation, roleId, wageType, salaryAmount, employmentStatus, dutySchedule, assignedDuties, showContactToMembers } = body;
        db.prepare(`
          UPDATE staff
          SET full_name = COALESCE(?, full_name),
              phone = COALESCE(?, phone),
              designation = COALESCE(?, designation),
              role_id = COALESCE(?, role_id),
              wage_type = COALESCE(?, wage_type),
              salary_amount = COALESCE(?, salary_amount),
              employment_status = COALESCE(?, employment_status),
              duty_schedule = COALESCE(?, duty_schedule),
              assigned_duties = COALESCE(?, assigned_duties),
              show_contact_to_members = COALESCE(?, show_contact_to_members),
              is_on_duty = CASE WHEN ? IN ('INACTIVE', 'TERMINATED') THEN 0 ELSE is_on_duty END,
              updated_at = datetime('now')
          WHERE id = ? AND society_id = ?
        `).run(
          fullName ?? null,
          phone ?? null,
          designation ?? null,
          roleId ?? null,
          wageType ?? null,
          salaryAmount !== undefined ? Number(salaryAmount) : null,
          employmentStatus ?? null,
          dutySchedule ?? null,
          assignedDuties ?? null,
          showContactToMembers !== undefined ? (showContactToMembers ? 1 : 0) : null,
          employmentStatus ?? null,
          staffId,
          societyId
        );
        return sendJson(res, 200, { message: 'Staff profile updated.' });
      }

      if (pathname === '/api/society/attendance' && method === 'POST') {
        const { staffId, attendanceDate, status = 'PRESENT', checkInTime = '09:00', checkOutTime = '18:00', salaryPaid = 0, notes = '' } = body;
        if (!staffId || !attendanceDate) return sendJson(res, 400, { error: 'staffId and attendanceDate are required.' });
        const id = uuid();
        db.prepare(`
          INSERT INTO attendance_records (id, society_id, staff_id, attendance_date, status, check_in_time, check_out_time, salary_paid, notes, recorded_by)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT (society_id, staff_id, attendance_date)
          DO UPDATE SET status = excluded.status, check_in_time = excluded.check_in_time, check_out_time = excluded.check_out_time, salary_paid = excluded.salary_paid, notes = excluded.notes
        `).run(id, societyId, staffId, attendanceDate, status, checkInTime, checkOutTime, Number(salaryPaid || 0), notes, auth?.userId ?? null);
        return sendJson(res, 201, { message: 'Attendance and wage record saved.' });
      }

      // 5.6 COMPLAINTS & SUGGESTIONS (Section 10)
      if (pathname === '/api/society/complaints' && method === 'GET') {
        const status = url.searchParams.get('status') || '';
        const category = url.searchParams.get('category') || '';
        const priority = url.searchParams.get('priority') || '';

        const complaints = db.prepare(`
          SELECT c.*, sm.full_name as member_name, sm.phone as member_phone, st.full_name as assigned_staff_name
          FROM complaints c
          JOIN society_members sm ON sm.id = c.member_id
          LEFT JOIN staff st ON st.id = c.assigned_staff_id
          WHERE c.society_id = ?
          ORDER BY c.created_at DESC
        `).all(societyId) as Record<string, any>[];

        const attachments = db.prepare('SELECT * FROM complaint_attachments WHERE society_id = ?').all(societyId) as Record<string, any>[];
        const comments = db.prepare('SELECT * FROM complaint_comments WHERE society_id = ? ORDER BY created_at ASC').all(societyId) as Record<string, any>[];

        const filtered = complaints
          .map((c) => ({
            ...c,
            attachments: attachments.filter((a) => a.complaint_id === c.id),
            comments: comments.filter((cm) => cm.complaint_id === c.id),
          }))
          .filter((c) => {
            if (status && c.status !== status) return false;
            if (category && c.category !== category) return false;
            if (priority && c.priority !== priority) return false;
            return true;
          });

        const suggestions = db.prepare(`
          SELECT sg.*, sm.full_name as member_name
          FROM suggestions sg
          JOIN society_members sm ON sm.id = sg.member_id
          WHERE sg.society_id = ?
          ORDER BY sg.created_at DESC
        `).all(societyId);

        return sendJson(res, 200, { complaints: filtered, suggestions });
      }

      const compUpdateMatch = pathname.match(/^\/api\/society\/complaints\/([^/]+)$/);
      if (compUpdateMatch && method === 'PUT') {
        const compId = compUpdateMatch[1];
        const comp = db.prepare(`
          SELECT c.*, sm.user_id as member_user_id
          FROM complaints c
          JOIN society_members sm ON sm.id = c.member_id
          WHERE c.id = ? AND c.society_id = ?
        `).get(compId, societyId) as Record<string, any> | undefined;
        if (!comp) return sendJson(res, 404, { error: 'Complaint not found.' });

        const { status, priority, assignedStaffId, resolutionNotes, resolutionImageUrl, commentText, isInternal = false } = body;

        db.prepare(`
          UPDATE complaints
          SET status = COALESCE(?, status),
              priority = COALESCE(?, priority),
              assigned_staff_id = COALESCE(?, assigned_staff_id),
              resolution_notes = COALESCE(?, resolution_notes),
              resolution_image_url = COALESCE(?, resolution_image_url),
              resolved_at = CASE WHEN ? = 'RESOLVED' THEN datetime('now') ELSE resolved_at END,
              updated_at = datetime('now')
          WHERE id = ? AND society_id = ?
        `).run(
          status ?? null,
          priority ?? null,
          assignedStaffId ?? null,
          resolutionNotes ?? null,
          resolutionImageUrl ?? null,
          status ?? null,
          compId,
          societyId
        );

        if (commentText) {
          const profile = db.prepare('SELECT full_name FROM user_profiles WHERE user_id = ?').get(auth?.userId ?? '') as { full_name: string } | undefined;
          db.prepare(`
            INSERT INTO complaint_comments (id, society_id, complaint_id, author_user_id, author_name, comment_text, is_internal)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `).run(
            uuid(),
            societyId,
            compId,
            auth?.userId ?? '',
            profile?.full_name || 'Society Management',
            String(commentText).trim(),
            isInternal ? 1 : 0
          );
        }

        if (status && status !== comp.status) {
          sendNotification({
            societyId,
            userId: comp.member_user_id,
            notificationType: 'COMPLAINT_STATUS_CHANGED',
            title: `Complaint ${comp.complaint_number} Status: ${status}`,
            message: `Your complaint "${comp.title}" has been updated to ${status}.`,
            channel: 'IN_APP',
          });
        }

        return sendJson(res, 200, { message: 'Complaint updated.' });
      }

      const suggUpdateMatch = pathname.match(/^\/api\/society\/suggestions\/([^/]+)$/);
      if (suggUpdateMatch && method === 'PUT') {
        const suggId = suggUpdateMatch[1];
        const { status = 'ACKNOWLEDGED', adminResponse } = body;
        db.prepare(`
          UPDATE suggestions
          SET status = ?, admin_response = ?, responded_by = ?, responded_at = datetime('now')
          WHERE id = ? AND society_id = ?
        `).run(status, adminResponse ?? null, auth?.userId ?? null, suggId, societyId);
        return sendJson(res, 200, { message: 'Response saved for resident suggestion.' });
      }

      // 5.7 EVENTS, NOTICES & ANNOUNCEMENTS (Section 11)
      if (pathname === '/api/society/events' && method === 'GET') {
        const events = db.prepare('SELECT * FROM society_events WHERE society_id = ? ORDER BY event_date DESC').all(societyId);
        const announcements = db.prepare('SELECT * FROM announcements WHERE society_id = ? ORDER BY created_at DESC').all(societyId);
        return sendJson(res, 200, { events, announcements });
      }

      if (pathname === '/api/society/events' && method === 'POST') {
        const { eventType = 'GENERAL', title, description, eventDate, eventTime, venue, imageUrl = null, publicationStatus = 'PUBLISHED' } = body;
        if (!title || !description || !eventDate || !eventTime || !venue) {
          return sendJson(res, 400, { error: 'Title, description, date, time, and venue are required.' });
        }
        const id = uuid();
        db.prepare(`
          INSERT INTO society_events (id, society_id, event_type, title, description, event_date, event_time, venue, image_url, publication_status, created_by)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(id, societyId, eventType, title, description, eventDate, eventTime, venue, imageUrl, publicationStatus, auth?.userId ?? null);
        return sendJson(res, 201, { id, message: 'Society event created.' });
      }

      if (pathname === '/api/society/announcements' && method === 'POST') {
        const { category = 'GENERAL', title, content, imageUrl = null, publicationStatus = 'PUBLISHED', sendEmail = true } = body;
        if (!title || !content) return sendJson(res, 400, { error: 'Title and content are required.' });
        const id = uuid();
        db.prepare(`
          INSERT INTO announcements (id, society_id, category, title, content, image_url, publication_status, send_email, created_by)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(id, societyId, category, title, content, imageUrl, publicationStatus, sendEmail ? 1 : 0, auth?.userId ?? null);

        if (publicationStatus === 'PUBLISHED') {
          sendNotification({
            societyId,
            userId: null,
            notificationType: 'SOCIETY_ANNOUNCEMENT',
            title: `[${category}] ${title}`,
            message: content,
            channel: sendEmail ? 'EMAIL' : 'IN_APP',
            dedupKey: `ann:${id}`,
          });
        }
        return sendJson(res, 201, { id, message: 'Announcement published.' });
      }

      // 5.8 ACCOUNTING, EXPENSES & FINANCIAL REPORTS (Section 12)
      if (pathname === '/api/society/expense-categories' && method === 'GET') {
        const categories = db.prepare('SELECT * FROM expense_categories WHERE society_id = ? ORDER BY name ASC').all(societyId);
        return sendJson(res, 200, { categories });
      }

      if (pathname === '/api/society/expense-categories' && method === 'POST') {
        const { name, description = '' } = body;
        if (!name) return sendJson(res, 400, { error: 'Expense category name is required.' });
        const id = uuid();
        try {
          db.prepare(`
            INSERT INTO expense_categories (id, society_id, name, description, is_active)
            VALUES (?, ?, ?, ?, 1)
          `).run(id, societyId, String(name).trim(), description);
          return sendJson(res, 201, { id, message: 'Expense category created.' });
        } catch {
          return sendJson(res, 409, { error: 'An expense category with this name already exists.' });
        }
      }

      if (pathname === '/api/society/expenses' && method === 'GET') {
        const expenses = db.prepare('SELECT * FROM expenses WHERE society_id = ? ORDER BY expense_date DESC, created_at DESC').all(societyId);
        const categories = db.prepare('SELECT * FROM expense_categories WHERE society_id = ? ORDER BY name ASC').all(societyId);
        const accounts = db.prepare('SELECT * FROM financial_accounts WHERE society_id = ?').all(societyId);
        return sendJson(res, 200, { expenses, categories, accounts });
      }

      if (pathname === '/api/society/expenses' && method === 'POST') {
        const {
          expenseCategoryId,
          description,
          amount,
          expenseDate,
          paymentMethod = 'BANK_TRANSFER',
          accountType = 'BANK',
          vendorName,
          invoiceUrl = null,
        } = body;

        if (!expenseCategoryId || !description || !amount || Number(amount) <= 0 || !vendorName) {
          return sendJson(res, 400, { error: 'Category, description, positive amount, and vendor/payee name are required.' });
        }

        const cat = db.prepare('SELECT * FROM expense_categories WHERE id = ? AND society_id = ?').get(expenseCategoryId, societyId) as Record<string, any> | undefined;
        if (!cat) return sendJson(res, 404, { error: 'Expense category not found.' });

        const expId = uuid();
        const amt = Number(amount);
        const accType = accountType === 'CASH' ? 'CASH' : 'BANK';
        const dateStr = expenseDate || new Date().toISOString().slice(0, 10);
        const txnCode = `TXN-EXP-${Date.now()}-${expId.slice(0, 4).toUpperCase()}`;

        db.exec('BEGIN IMMEDIATE');
        try {
          db.prepare(`
            INSERT INTO expenses (
              id, society_id, expense_category_id, category_name, description, amount,
              expense_date, payment_method, account_type, vendor_name, invoice_url, status, entered_by, approved_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'APPROVED', ?, ?)
          `).run(
            expId,
            societyId,
            cat.id,
            cat.name,
            String(description).trim(),
            amt,
            dateStr,
            paymentMethod,
            accType,
            String(vendorName).trim(),
            invoiceUrl,
            auth?.userId ?? '',
            auth?.userId ?? ''
          );

          db.prepare(`
            INSERT INTO ledger_entries (
              id, society_id, transaction_code, entry_date, entry_type, account_type,
              category, description, amount, direction, reference_type, reference_id, payment_method, created_by
            ) VALUES (?, ?, ?, ?, 'EXPENSE', ?, ?, ?, ?, 'DEBIT', 'EXPENSE', ?, ?, ?)
          `).run(
            uuid(),
            societyId,
            txnCode,
            dateStr,
            accType,
            cat.name,
            `${description} (Paid to ${vendorName})`,
            amt,
            expId,
            paymentMethod,
            auth?.userId ?? null
          );

          db.prepare(`
            UPDATE financial_accounts
            SET current_balance = current_balance - ?, updated_at = datetime('now')
            WHERE society_id = ? AND account_type = ?
          `).run(amt, societyId, accType);

          logAudit({
            societyId,
            actorUserId: auth?.userId,
            actorRole: auth?.role || 'SOCIETY_ADMIN',
            action: 'EXPENSE_RECORDED',
            entityType: 'EXPENSE',
            entityId: expId,
            details: { category: cat.name, amount: amt, vendorName, accountType: accType },
          });

          db.exec('COMMIT');
          return sendJson(res, 201, { expenseId: expId, transactionCode: txnCode, message: 'Expense recorded and posted to financial ledger.' });
        } catch (err) {
          db.exec('ROLLBACK');
          throw err;
        }
      }

      // Reverse an expense without erasing financial transaction history (Section 12)
      const revExpMatch = pathname.match(/^\/api\/society\/expenses\/([^/]+)\/reverse$/);
      if (revExpMatch && method === 'POST') {
        const expId = revExpMatch[1];
        const { reason = 'Reversal entry authorized by administrator' } = body;
        const exp = db.prepare('SELECT * FROM expenses WHERE id = ? AND society_id = ?').get(expId, societyId) as Record<string, any> | undefined;
        if (!exp) return sendJson(res, 404, { error: 'Expense not found.' });
        if (exp.status === 'REVERSED') return sendJson(res, 400, { error: 'Expense is already reversed.' });

        const origLedger = db.prepare("SELECT * FROM ledger_entries WHERE society_id = ? AND reference_type = 'EXPENSE' AND reference_id = ?").get(societyId, expId) as Record<string, any> | undefined;
        const txnCode = `TXN-REV-${Date.now()}-${expId.slice(0, 4).toUpperCase()}`;

        db.exec('BEGIN IMMEDIATE');
        try {
          db.prepare("UPDATE expenses SET status = 'REVERSED' WHERE id = ?").run(expId);
          db.prepare(`
            INSERT INTO ledger_entries (
              id, society_id, transaction_code, entry_date, entry_type, account_type,
              category, description, amount, direction, reference_type, reference_id,
              reversal_of_entry_id, created_by
            ) VALUES (?, ?, ?, date('now'), 'REVERSAL', ?, ?, ?, ?, 'CREDIT', 'REVERSAL', ?, ?, ?)
          `).run(
            uuid(),
            societyId,
            txnCode,
            exp.account_type,
            exp.category_name,
            `Reversal of ${origLedger?.transaction_code || expId}: ${reason}`,
            Number(exp.amount),
            expId,
            origLedger?.id ?? null,
            auth?.userId ?? null
          );

          db.prepare(`
            UPDATE financial_accounts
            SET current_balance = current_balance + ?, updated_at = datetime('now')
            WHERE society_id = ? AND account_type = ?
          `).run(Number(exp.amount), societyId, exp.account_type);

          db.exec('COMMIT');
          return sendJson(res, 200, { message: 'Expense reversed via immutable reversal ledger entry.' });
        } catch (err) {
          db.exec('ROLLBACK');
          throw err;
        }
      }

      // Comprehensive Financial Reports & Statements (Section 12)
      if (pathname === '/api/society/reports' && method === 'GET') {
        const dateFrom = url.searchParams.get('dateFrom') || '';
        const dateTo = url.searchParams.get('dateTo') || '';
        const flatFilter = normalizeFlatNumber(url.searchParams.get('flatNumber') || '');
        const categoryFilter = url.searchParams.get('category') || '';

        const ledger = db.prepare(`
          SELECT * FROM ledger_entries
          WHERE society_id = ?
          ORDER BY entry_date DESC, created_at DESC
        `).all(societyId) as Record<string, any>[];

        const filteredLedger = ledger.filter((l) => {
          if (dateFrom && l.entry_date < dateFrom) return false;
          if (dateTo && l.entry_date > dateTo) return false;
          if (flatFilter && normalizeFlatNumber(l.flat_number || '') !== flatFilter) return false;
          if (categoryFilter && l.category !== categoryFilter && l.entry_type !== categoryFilter) return false;
          return true;
        });

        // Realized Income vs Approved Expenses (Surplus/Deficit MUST NOT treat uncollected bills as cash!)
        const realizedIncome = (db.prepare("SELECT COALESCE(SUM(amount), 0) as s FROM ledger_entries WHERE society_id = ? AND entry_type = 'INCOME'").get(societyId) as { s: number }).s;
        const approvedExpenses = (db.prepare("SELECT COALESCE(SUM(amount), 0) as s FROM expenses WHERE society_id = ? AND status = 'APPROVED'").get(societyId) as { s: number }).s;
        const totalBilledReceivables = (db.prepare("SELECT COALESCE(SUM(total_amount), 0) as s FROM member_bills WHERE society_id = ? AND status NOT IN ('CANCELLED', 'DRAFT')").get(societyId) as { s: number }).s;
        const outstandingReceivables = (db.prepare("SELECT COALESCE(SUM(balance_amount), 0) as s FROM member_bills WHERE society_id = ? AND status NOT IN ('PAID', 'CANCELLED', 'DRAFT')").get(societyId) as { s: number }).s;

        const accounts = db.prepare('SELECT * FROM financial_accounts WHERE society_id = ?').all(societyId) as Record<string, any>[];
        const cashBalance = accounts.find((a) => a.account_type === 'CASH')?.current_balance ?? 0;
        const bankBalance = accounts.find((a) => a.account_type === 'BANK')?.current_balance ?? 0;

        // Flat-wise & Member-wise Account Statements
        const flatStatements = db.prepare(`
          SELECT h.id as household_id, h.flat_number, h.normalized_flat_number, h.block_name,
                 sm.full_name as primary_member_name, sm.phone,
                 COALESCE((SELECT SUM(total_amount) FROM member_bills mb WHERE mb.household_id = h.id AND mb.status NOT IN ('CANCELLED', 'DRAFT')), 0) as total_billed,
                 COALESCE((SELECT SUM(amount) FROM payments p WHERE p.household_id = h.id AND p.status = 'CONFIRMED'), 0) as total_paid,
                 COALESCE((SELECT SUM(balance_amount) FROM member_bills mb WHERE mb.household_id = h.id AND mb.status NOT IN ('PAID', 'CANCELLED', 'DRAFT')), 0) as outstanding_dues
          FROM households h
          LEFT JOIN society_members sm ON sm.id = h.primary_member_id
          WHERE h.society_id = ? AND h.status != 'ARCHIVED'
          ORDER BY h.normalized_flat_number ASC
        `).all(societyId);

        // Expense Category Breakdown
        const expenseBreakdown = db.prepare(`
          SELECT category_name, COUNT(*) as count, COALESCE(SUM(amount), 0) as total_amount
          FROM expenses
          WHERE society_id = ? AND status = 'APPROVED'
          GROUP BY category_name
          ORDER BY total_amount DESC
        `).all(societyId);

        return sendJson(res, 200, {
          summary: {
            realizedIncome,
            approvedExpenses,
            netSurplusOrDeficit: Number((realizedIncome - approvedExpenses).toFixed(2)),
            totalBilledReceivables,
            outstandingReceivables,
            cashBalance,
            bankBalance,
          },
          ledger: filteredLedger,
          flatStatements,
          expenseBreakdown,
        });
      }

      // 5.9 SOCIETY SETTINGS & PAYMENT CONFIGURATION (Section 7)
      if (pathname === '/api/society/settings' && method === 'GET') {
        const society = db.prepare('SELECT * FROM societies WHERE id = ?').get(societyId);
        const settings = db.prepare('SELECT * FROM society_settings WHERE society_id = ?').get(societyId) as Record<string, any> | undefined;
        return sendJson(res, 200, {
          society,
          settings: settings
            ? {
                ...settings,
                has_razorpay_secret: Boolean(settings.razorpay_key_secret_encrypted),
                has_razorpay_webhook_secret: Boolean(settings.razorpay_webhook_secret_encrypted),
                has_paytm_secret: Boolean(settings.paytm_merchant_key_encrypted),
                has_custom_gateway_secret: Boolean(settings.custom_gateway_secret_encrypted),
                razorpay_key_secret_encrypted: undefined,
                razorpay_webhook_secret_encrypted: undefined,
                paytm_merchant_key_encrypted: undefined,
                custom_gateway_secret_encrypted: undefined,
              }
            : null,
        });
      }

      if (pathname === '/api/society/settings' && method === 'PUT') {
        const {
          name,
          logoUrl,
          address,
          city,
          state,
          pincode,
          contactEmail,
          contactPhone,
          upiEnabled,
          gpayUpiEnabled,
          paytmEnabled,
          razorpayEnabled,
          bankTransferEnabled,
          upiId,
          upiPayeeName,
          upiQrUrl,
          bankName,
          bankAccountNumber,
          bankIfsc,
          razorpayKeyId,
          razorpayKeySecret,
          razorpayWebhookSecret,
          paytmMerchantId,
          paytmMerchantKey,
          customGatewayName,
          customGatewayApiKey,
          customGatewaySecret,
          billDueDay,
          lateFeeAmount,
          allowMemberStaffContacts,
          emailNotificationsEnabled,
          smsNotificationsEnabled,
          whatsappNotificationsEnabled,
          brandPrimaryColor,
          customEnrollmentFields,
        } = body;

        db.prepare(`
          UPDATE societies
          SET name = COALESCE(?, name),
              logo_url = COALESCE(?, logo_url),
              address = COALESCE(?, address),
              city = COALESCE(?, city),
              state = COALESCE(?, state),
              pincode = COALESCE(?, pincode),
              contact_email = COALESCE(?, contact_email),
              contact_phone = COALESCE(?, contact_phone),
              updated_at = datetime('now')
          WHERE id = ?
        `).run(name ?? null, logoUrl ?? null, address ?? null, city ?? null, state ?? null, pincode ?? null, contactEmail ?? null, contactPhone ?? null, societyId);

        db.prepare(`
          UPDATE society_settings
          SET upi_enabled = COALESCE(?, upi_enabled),
              gpay_upi_enabled = COALESCE(?, gpay_upi_enabled),
              paytm_enabled = COALESCE(?, paytm_enabled),
              razorpay_enabled = COALESCE(?, razorpay_enabled),
              bank_transfer_enabled = COALESCE(?, bank_transfer_enabled),
              upi_id = COALESCE(?, upi_id),
              upi_payee_name = COALESCE(?, upi_payee_name),
              upi_qr_url = COALESCE(?, upi_qr_url),
              bank_name = COALESCE(?, bank_name),
              bank_account_number = COALESCE(?, bank_account_number),
              bank_ifsc = COALESCE(?, bank_ifsc),
              razorpay_key_id = COALESCE(?, razorpay_key_id),
              razorpay_key_secret_encrypted = COALESCE(?, razorpay_key_secret_encrypted),
              razorpay_webhook_secret_encrypted = COALESCE(?, razorpay_webhook_secret_encrypted),
              paytm_merchant_id = COALESCE(?, paytm_merchant_id),
              paytm_merchant_key_encrypted = COALESCE(?, paytm_merchant_key_encrypted),
              custom_gateway_name = COALESCE(?, custom_gateway_name),
              custom_gateway_api_key = COALESCE(?, custom_gateway_api_key),
              custom_gateway_secret_encrypted = COALESCE(?, custom_gateway_secret_encrypted),
              bill_due_day = COALESCE(?, bill_due_day),
              late_fee_amount = COALESCE(?, late_fee_amount),
              allow_member_staff_contacts = COALESCE(?, allow_member_staff_contacts),
              email_notifications_enabled = COALESCE(?, email_notifications_enabled),
              sms_notifications_enabled = COALESCE(?, sms_notifications_enabled),
              whatsapp_notifications_enabled = COALESCE(?, whatsapp_notifications_enabled),
              brand_primary_color = COALESCE(?, brand_primary_color),
              custom_enrollment_fields = COALESCE(?, custom_enrollment_fields),
              updated_at = datetime('now')
          WHERE society_id = ?
        `).run(
          upiEnabled !== undefined ? (upiEnabled ? 1 : 0) : null,
          gpayUpiEnabled !== undefined ? (gpayUpiEnabled ? 1 : 0) : null,
          paytmEnabled !== undefined ? (paytmEnabled ? 1 : 0) : null,
          razorpayEnabled !== undefined ? (razorpayEnabled ? 1 : 0) : null,
          bankTransferEnabled !== undefined ? (bankTransferEnabled ? 1 : 0) : null,
          upiId ?? null,
          upiPayeeName ?? null,
          upiQrUrl ?? null,
          bankName ?? null,
          bankAccountNumber ?? null,
          bankIfsc ?? null,
          razorpayKeyId ?? null,
          razorpayKeySecret ? String(razorpayKeySecret).trim() : null,
          razorpayWebhookSecret ? String(razorpayWebhookSecret).trim() : null,
          paytmMerchantId ?? null,
          paytmMerchantKey ? String(paytmMerchantKey).trim() : null,
          customGatewayName ?? null,
          customGatewayApiKey ?? null,
          customGatewaySecret ? String(customGatewaySecret).trim() : null,
          billDueDay !== undefined ? Number(billDueDay) : null,
          lateFeeAmount !== undefined ? Number(lateFeeAmount) : null,
          allowMemberStaffContacts !== undefined ? (allowMemberStaffContacts ? 1 : 0) : null,
          emailNotificationsEnabled !== undefined ? (emailNotificationsEnabled ? 1 : 0) : null,
          smsNotificationsEnabled !== undefined ? (smsNotificationsEnabled ? 1 : 0) : null,
          whatsappNotificationsEnabled !== undefined ? (whatsappNotificationsEnabled ? 1 : 0) : null,
          brandPrimaryColor ?? null,
          customEnrollmentFields ? JSON.stringify(customEnrollmentFields) : null,
          societyId
        );

        logAudit({
          societyId,
          actorUserId: auth?.userId,
          actorRole: auth?.role || 'SOCIETY_ADMIN',
          action: 'SOCIETY_SETTINGS_UPDATED',
          entityType: 'SOCIETY_SETTINGS',
          entityId: societyId,
          details: {
            razorpayKeyId: razorpayKeyId || null,
            paytmMerchantId: paytmMerchantId || null,
            customGatewayName: customGatewayName || null,
          },
        });

        return sendJson(res, 200, { message: 'Society settings and custom payment gateway keys saved.' });
      }
    }

    // ========================================================================
    // 6. MEMBER / RESIDENT PORTAL ENDPOINTS (STRICT PERSONAL & HOUSEHOLD ISOLATION)
    // ========================================================================
    if (pathname.startsWith('/api/member')) {
      if (!auth || auth.role !== 'MEMBER' || !auth.societyId) {
        return sendJson(res, 403, { error: 'Forbidden: Resident Member account required.' });
      }
      const societyId = auth.societyId;
      const member = db.prepare(`
        SELECT sm.*, h.flat_number, h.normalized_flat_number, h.block_name, h.floor_number, h.occupancy_type, h.area_sqft
        FROM society_members sm
        JOIN households h ON h.id = sm.household_id
        WHERE sm.user_id = ? AND sm.society_id = ?
      `).get(auth.userId, societyId) as Record<string, any> | undefined;

      if (!member) {
        return sendJson(res, 404, { error: 'Resident member profile not found.' });
      }

      if (pathname === '/api/member/dashboard' && method === 'GET') {
        const society = db.prepare(`
          SELECT id, name, logo_url, address, city, state, pincode, contact_email, contact_phone
          FROM societies WHERE id = ?
        `).get(societyId);

        const settings = db.prepare(`
          SELECT upi_enabled, gpay_upi_enabled, paytm_enabled, razorpay_enabled, bank_transfer_enabled,
                 upi_id, upi_payee_name, upi_qr_url, bank_name, bank_account_number, bank_ifsc,
                 allow_member_staff_contacts, brand_primary_color
          FROM society_settings WHERE society_id = ?
        `).get(societyId) as Record<string, any> | undefined;

        const bills = db.prepare(`
          SELECT * FROM member_bills
          WHERE society_id = ? AND household_id = ? AND status NOT IN ('DRAFT', 'CANCELLED')
          ORDER BY billing_year DESC, billing_month DESC, created_at DESC
        `).all(societyId, member.household_id) as Record<string, any>[];

        const billItems = db.prepare(`
          SELECT * FROM bill_items WHERE society_id = ? AND household_id = ?
        `).all(societyId, member.household_id) as Record<string, any>[];

        const enrichedBills = bills.map((b) => ({
          ...b,
          items: billItems.filter((i) => i.bill_id === b.id),
        }));

        const payments = db.prepare(`
          SELECT p.*, pr.receipt_number, pr.issued_at as receipt_issued_at
          FROM payments p
          LEFT JOIN payment_receipts pr ON pr.payment_id = p.id
          WHERE p.society_id = ? AND p.household_id = ?
          ORDER BY p.created_at DESC
        `).all(societyId, member.household_id);

        const receipts = db.prepare(`
          SELECT pr.*
          FROM payment_receipts pr
          JOIN payments p ON p.id = pr.payment_id
          WHERE pr.society_id = ? AND p.household_id = ?
          ORDER BY pr.issued_at DESC
        `).all(societyId, member.household_id);

        // Only return member-visible comments (is_internal = 0)
        const complaints = db.prepare(`
          SELECT c.*, st.full_name as assigned_staff_name
          FROM complaints c
          LEFT JOIN staff st ON st.id = c.assigned_staff_id
          WHERE c.society_id = ? AND c.household_id = ?
          ORDER BY c.created_at DESC
        `).all(societyId, member.household_id) as Record<string, any>[];

        const attachments = db.prepare('SELECT * FROM complaint_attachments WHERE society_id = ?').all(societyId) as Record<string, any>[];
        const publicComments = db.prepare('SELECT * FROM complaint_comments WHERE society_id = ? AND is_internal = 0 ORDER BY created_at ASC').all(societyId) as Record<string, any>[];

        const enrichedComplaints = complaints.map((c) => ({
          ...c,
          attachments: attachments.filter((a) => a.complaint_id === c.id),
          comments: publicComments.filter((cm) => cm.complaint_id === c.id),
        }));

        const suggestions = db.prepare(`
          SELECT * FROM suggestions WHERE society_id = ? AND household_id = ? ORDER BY created_at DESC
        `).all(societyId, member.household_id);

        const announcements = db.prepare(`
          SELECT * FROM announcements WHERE society_id = ? AND publication_status = 'PUBLISHED' ORDER BY created_at DESC LIMIT 15
        `).all(societyId);

        const events = db.prepare(`
          SELECT * FROM society_events WHERE society_id = ? AND publication_status = 'PUBLISHED' ORDER BY event_date ASC LIMIT 15
        `).all(societyId);

        // Currently On-Duty Staff (Only active & on-duty, and contact numbers shown only when permitted)
        const onDutyStaff = db.prepare(`
          SELECT id, full_name, designation, duty_schedule, assigned_duties,
                 CASE WHEN show_contact_to_members = 1 AND ? = 1 THEN phone ELSE 'Contact via RWA Desk' END as phone
          FROM staff
          WHERE society_id = ? AND employment_status = 'ACTIVE' AND is_on_duty = 1
          ORDER BY full_name ASC
        `).all(settings?.allow_member_staff_contacts ?? 1, societyId);

        const householdMembers = db.prepare(`
          SELECT id, full_name, email, phone, relationship_to_primary, is_primary_member, ownership_type
          FROM society_members
          WHERE society_id = ? AND household_id = ? AND account_status = 'ACTIVE'
        `).all(societyId, member.household_id);

        const totalOutstanding = enrichedBills
          .filter((b) => b.status !== 'PAID')
          .reduce((sum, b) => sum + Number(b.balance_amount || 0), 0);

        return sendJson(res, 200, {
          member,
          householdMembers,
          society,
          settings,
          totalOutstanding,
          bills: enrichedBills,
          payments,
          receipts,
          complaints: enrichedComplaints,
          suggestions,
          announcements,
          events,
          onDutyStaff,
        });
      }

      // Member Payment Submission (Against single or multiple bills)
      if (pathname === '/api/member/payments' && method === 'POST') {
        const {
          billIds = [],
          amount,
          paymentDate,
          paymentMethod = 'UPI',
          referenceNumber,
          proofUrl = null,
        } = body;

        if (!Array.isArray(billIds) || billIds.length === 0 || !amount || Number(amount) <= 0 || !referenceNumber) {
          return sendJson(res, 400, {
            error: 'At least one bill, a positive payment amount, and a transaction reference number are required.',
          });
        }

        // Prevent duplicate payment submission while a payment for any of these bills is already under verification
        for (const bId of billIds) {
          const billCheck = db.prepare(`
            SELECT * FROM member_bills WHERE id = ? AND society_id = ? AND household_id = ?
          `).get(bId, societyId, member.household_id) as Record<string, any> | undefined;

          if (!billCheck) {
            return sendJson(res, 404, { error: 'Selected bill not found for your household.' });
          }

          const existingPendingPayment = db.prepare(`
            SELECT p.id, p.reference_number
            FROM payments p
            JOIN payment_allocations pa ON pa.payment_id = p.id
            WHERE pa.bill_id = ? AND p.society_id = ? AND p.status = 'PENDING_VERIFICATION'
            LIMIT 1
          `).get(bId, societyId) as Record<string, any> | undefined;

          if (billCheck.status === 'PENDING_VERIFICATION' || existingPendingPayment) {
            return sendJson(res, 409, {
              error: 'Already payment made under verification, cannot make another payment till payment status is paid or unpaid.',
            });
          }

          if (billCheck.status === 'PAID' || Number(billCheck.balance_amount) <= 0) {
            return sendJson(res, 409, {
              error: `Bill ${billCheck.bill_number} is already paid.`,
            });
          }
        }

        const paymentId = uuid();
        const totalPaidInput = Number(amount);
        let remaining = totalPaidInput;

        db.exec('BEGIN IMMEDIATE');
        try {
          // Manual/UPI submissions MUST remain PENDING_VERIFICATION until verified by admin/cashier
          db.prepare(`
            INSERT INTO payments (
              id, society_id, household_id, member_id, payment_method, amount, payment_date,
              reference_number, proof_url, status, ledger_posted
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING_VERIFICATION', 0)
          `).run(
            paymentId,
            societyId,
            member.household_id,
            member.id,
            paymentMethod,
            totalPaidInput,
            paymentDate || new Date().toISOString().slice(0, 10),
            String(referenceNumber).trim(),
            proofUrl
          );

          for (const bId of billIds) {
            const bill = db.prepare(`
              SELECT * FROM member_bills WHERE id = ? AND society_id = ? AND household_id = ?
            `).get(bId, societyId, member.household_id) as Record<string, any> | undefined;
            if (!bill) continue;
            const allocAmt = remaining > 0 ? Math.min(remaining, Number(bill.balance_amount || bill.total_amount)) : Number(bill.balance_amount || totalPaidInput);
            const finalAlloc = allocAmt > 0 ? allocAmt : totalPaidInput;

            db.prepare(`
              INSERT INTO payment_allocations (id, society_id, payment_id, bill_id, allocated_amount)
              VALUES (?, ?, ?, ?, ?)
            `).run(uuid(), societyId, paymentId, bill.id, finalAlloc);

            if (bill.status === 'UNPAID' || bill.status === 'OVERDUE' || bill.status === 'PARTIALLY_PAID') {
              db.prepare("UPDATE member_bills SET status = 'PENDING_VERIFICATION', updated_at = datetime('now') WHERE id = ?").run(bill.id);
            }
            remaining = Math.max(0, Number((remaining - finalAlloc).toFixed(2)));
          }

          sendNotification({
            societyId,
            userId: null,
            notificationType: 'PAYMENT_SUBMITTED',
            title: `Payment Submitted — Flat ${member.flat_number}`,
            message: `${member.full_name} (${member.flat_number}) submitted ₹${totalPaidInput} via ${paymentMethod} (Ref: ${referenceNumber}) for verification.`,
            channel: 'IN_APP',
            dedupKey: `pay-sub:${paymentId}`,
          });

          logAudit({
            societyId,
            actorUserId: auth.userId,
            actorRole: 'MEMBER',
            action: 'MEMBER_SUBMITTED_PAYMENT',
            entityType: 'PAYMENT',
            entityId: paymentId,
            details: { amount: totalPaidInput, paymentMethod, referenceNumber, billIds },
          });

          db.exec('COMMIT');
          return sendJson(res, 201, {
            paymentId,
            status: 'PENDING_VERIFICATION',
            message: 'Payment reference submitted! It is now pending verification by society administration.',
          });
        } catch (err) {
          db.exec('ROLLBACK');
          throw err;
        }
      }

      // Member Complaint Submission (with optional image attachments)
      if (pathname === '/api/member/complaints' && method === 'POST') {
        const { title, category = 'Maintenance', description, priority = 'MEDIUM', attachmentUrls = [] } = body;
        if (!title || !description) {
          return sendJson(res, 400, { error: 'Complaint title and description are required.' });
        }

        const complaintId = uuid();
        const complaintNumber = `CMP-${Math.floor(10000 + Math.random() * 90000)}`;

        db.exec('BEGIN IMMEDIATE');
        try {
          db.prepare(`
            INSERT INTO complaints (
              id, society_id, complaint_number, household_id, member_id, flat_number,
              title, category, description, priority, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'SUBMITTED')
          `).run(
            complaintId,
            societyId,
            complaintNumber,
            member.household_id,
            member.id,
            member.flat_number,
            String(title).trim(),
            category,
            String(description).trim(),
            priority
          );

          if (Array.isArray(attachmentUrls)) {
            for (const urlStr of attachmentUrls) {
              if (!urlStr) continue;
              db.prepare(`
                INSERT INTO complaint_attachments (id, society_id, complaint_id, file_url, uploaded_by)
                VALUES (?, ?, ?, ?, ?)
              `).run(uuid(), societyId, complaintId, String(urlStr), auth.userId);
            }
          }

          sendNotification({
            societyId,
            userId: null,
            notificationType: 'NEW_COMPLAINT',
            title: `New Complaint ${complaintNumber} (${member.flat_number})`,
            message: `${member.full_name} reported [${category}]: ${title}`,
            channel: 'IN_APP',
            dedupKey: `cmp:${complaintId}`,
          });

          db.exec('COMMIT');
          return sendJson(res, 201, { complaintId, complaintNumber, message: `Complaint ${complaintNumber} submitted.` });
        } catch (err) {
          db.exec('ROLLBACK');
          throw err;
        }
      }

      // Member Suggestion Submission
      if (pathname === '/api/member/suggestions' && method === 'POST') {
        const { title, description } = body;
        if (!title || !description) {
          return sendJson(res, 400, { error: 'Suggestion title and description are required.' });
        }
        const id = uuid();
        db.prepare(`
          INSERT INTO suggestions (id, society_id, household_id, member_id, flat_number, title, description, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, 'SUBMITTED')
        `).run(id, societyId, member.household_id, member.id, member.flat_number, String(title).trim(), String(description).trim());
        return sendJson(res, 201, { id, message: 'Suggestion submitted to society management.' });
      }
    }

    return sendJson(res, 404, { error: `API route not found: ${method} ${pathname}` });
  } catch (err: any) {
    console.error('[API Error]', err);
    return sendJson(res, 500, { error: err?.message || 'Internal server error' });
  }
}
