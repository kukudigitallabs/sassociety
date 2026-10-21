import { DatabaseSync } from 'node:sqlite';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { hashPassword, normalizeFlatNumber } from './security.ts';

const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const defaultDbPath = isServerless ? path.join('/tmp', 'society_saas.db') : path.join(process.cwd(), 'data', 'society_saas.db');
const DB_PATH = process.env.SQLITE_DB_PATH || defaultDbPath;
try {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
} catch {
  // Ignore mkdir error if directory already exists or is read-only
}

const defaultUploadsDir = isServerless ? path.join('/tmp', 'uploads') : path.join(process.cwd(), 'data', 'uploads');
try {
  fs.mkdirSync(defaultUploadsDir, { recursive: true });
} catch {
  // Ignore mkdir error
}

export const db = new DatabaseSync(DB_PATH);

db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

export function uuid(): string {
  return crypto.randomUUID();
}

export function initDatabase(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS platform_settings (
      id TEXT PRIMARY KEY,
      platform_name TEXT NOT NULL DEFAULT 'SocietyOS Enterprise SaaS',
      support_email TEXT NOT NULL DEFAULT 'owner@societyos.com',
      support_phone TEXT NOT NULL DEFAULT '+91-98765-00001',
      default_trial_enabled INTEGER NOT NULL DEFAULT 1,
      default_trial_days INTEGER NOT NULL DEFAULT 14,
      default_grace_period_days INTEGER NOT NULL DEFAULT 7,
      auto_approve_paid_societies INTEGER NOT NULL DEFAULT 1,
      auto_approve_trial_societies INTEGER NOT NULL DEFAULT 1,
      reminder_days_before_expiry INTEGER NOT NULL DEFAULT 5,
      razorpay_key_id TEXT NOT NULL DEFAULT 'rzp_test_platform_demo_key',
      razorpay_sandbox_mode INTEGER NOT NULL DEFAULT 1,
      welcome_email_template TEXT NOT NULL DEFAULT 'Welcome to SocietyOS! Your society account is ready.',
      invoice_email_template TEXT NOT NULL DEFAULT 'A new society bill has been generated for your household.',
      overdue_email_template TEXT NOT NULL DEFAULT 'Reminder: Your society maintenance payment is overdue.',
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      phone TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('SUPER_ADMIN', 'SOCIETY_ADMIN', 'STAFF', 'MEMBER')),
      society_id TEXT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      email_verified INTEGER NOT NULL DEFAULT 1,
      reset_token_hash TEXT NULL,
      reset_token_expires_at TEXT NULL,
      last_login_at TEXT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS user_profiles (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      society_id TEXT NULL,
      full_name TEXT NOT NULL,
      avatar_url TEXT NULL,
      preferred_language TEXT NOT NULL DEFAULT 'en',
      address TEXT NULL,
      emergency_contact_name TEXT NULL,
      emergency_contact_phone TEXT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS subscription_plans (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      description TEXT NULL,
      billing_period TEXT NOT NULL CHECK (billing_period IN ('MONTHLY', 'QUARTERLY', 'ANNUAL', 'CUSTOM')),
      duration_days INTEGER NOT NULL,
      price_amount REAL NOT NULL,
      tax_percent REAL NOT NULL DEFAULT 18.0,
      max_households INTEGER NOT NULL DEFAULT 500,
      trial_enabled INTEGER NOT NULL DEFAULT 1,
      trial_days INTEGER NOT NULL DEFAULT 14,
      grace_period_days INTEGER NOT NULL DEFAULT 7,
      auto_approve_after_payment INTEGER NOT NULL DEFAULT 1,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS societies (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      enrollment_code TEXT NOT NULL UNIQUE,
      logo_url TEXT NULL,
      address TEXT NOT NULL,
      city TEXT NOT NULL DEFAULT '',
      state TEXT NOT NULL DEFAULT 'Punjab',
      pincode TEXT NOT NULL DEFAULT '',
      contact_email TEXT NOT NULL,
      contact_phone TEXT NOT NULL,
      registration_number TEXT NULL,
      admin_user_id TEXT NULL REFERENCES users(id) ON DELETE SET NULL,
      subscription_plan_id TEXT NULL REFERENCES subscription_plans(id),
      subscription_status TEXT NOT NULL DEFAULT 'TRIAL'
        CHECK (subscription_status IN ('TRIAL', 'ACTIVE', 'GRACE_PERIOD', 'EXPIRED', 'PENDING_PAYMENT', 'SUSPENDED')),
      approval_status TEXT NOT NULL DEFAULT 'APPROVED'
        CHECK (approval_status IN ('PENDING', 'APPROVED', 'REJECTED')),
      account_status TEXT NOT NULL DEFAULT 'ACTIVE'
        CHECK (account_status IN ('ACTIVE', 'SUSPENDED', 'ARCHIVED')),
      payment_status TEXT NOT NULL DEFAULT 'TRIAL'
        CHECK (payment_status IN ('TRIAL', 'PAID', 'PENDING', 'FAILED', 'OVERDUE', 'REFUNDED')),
      trial_starts_at TEXT NULL,
      trial_ends_at TEXT NULL,
      subscription_starts_at TEXT NULL,
      subscription_ends_at TEXT NULL,
      grace_period_ends_at TEXT NULL,
      is_demo INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS society_settings (
      id TEXT PRIMARY KEY,
      society_id TEXT NOT NULL UNIQUE REFERENCES societies(id) ON DELETE CASCADE,
      upi_enabled INTEGER NOT NULL DEFAULT 1,
      gpay_upi_enabled INTEGER NOT NULL DEFAULT 1,
      paytm_enabled INTEGER NOT NULL DEFAULT 1,
      razorpay_enabled INTEGER NOT NULL DEFAULT 1,
      bank_transfer_enabled INTEGER NOT NULL DEFAULT 1,
      upi_id TEXT NULL,
      upi_payee_name TEXT NULL,
      upi_qr_url TEXT NULL,
      bank_name TEXT NULL,
      bank_account_number TEXT NULL,
      bank_ifsc TEXT NULL,
      razorpay_key_id TEXT NULL,
      razorpay_key_secret_encrypted TEXT NULL,
      bill_due_day INTEGER NOT NULL DEFAULT 10,
      late_fee_amount REAL NOT NULL DEFAULT 100.0,
      allow_member_staff_contacts INTEGER NOT NULL DEFAULT 1,
      custom_enrollment_fields TEXT NOT NULL DEFAULT '[]',
      email_notifications_enabled INTEGER NOT NULL DEFAULT 1,
      sms_notifications_enabled INTEGER NOT NULL DEFAULT 0,
      whatsapp_notifications_enabled INTEGER NOT NULL DEFAULT 0,
      brand_primary_color TEXT NOT NULL DEFAULT '#0f766e',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS society_subscriptions (
      id TEXT PRIMARY KEY,
      society_id TEXT NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
      plan_id TEXT NOT NULL REFERENCES subscription_plans(id),
      status TEXT NOT NULL CHECK (status IN ('TRIAL', 'ACTIVE', 'EXPIRED', 'CANCELLED', 'PENDING_PAYMENT')),
      starts_at TEXT NOT NULL,
      ends_at TEXT NOT NULL,
      is_trial INTEGER NOT NULL DEFAULT 0,
      extended_reason TEXT NULL,
      extended_by TEXT NULL REFERENCES users(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS subscription_payments (
      id TEXT PRIMARY KEY,
      society_id TEXT NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
      subscription_id TEXT NULL REFERENCES society_subscriptions(id) ON DELETE SET NULL,
      plan_id TEXT NOT NULL REFERENCES subscription_plans(id),
      invoice_number TEXT NOT NULL UNIQUE,
      amount REAL NOT NULL,
      tax_amount REAL NOT NULL DEFAULT 0,
      total_amount REAL NOT NULL,
      payment_gateway TEXT NOT NULL DEFAULT 'RAZORPAY',
      gateway_order_id TEXT NULL,
      gateway_payment_id TEXT NULL,
      gateway_signature TEXT NULL,
      verified_by_webhook INTEGER NOT NULL DEFAULT 0,
      verified_by_user_id TEXT NULL REFERENCES users(id),
      status TEXT NOT NULL CHECK (status IN ('CREATED', 'PAID', 'FAILED', 'CANCELLED', 'REFUNDED')),
      refund_reason TEXT NULL,
      paid_at TEXT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS apartment_blocks (
      id TEXT PRIMARY KEY,
      society_id TEXT NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      total_floors INTEGER NOT NULL DEFAULT 10,
      description TEXT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE (society_id, name)
    );

    CREATE TABLE IF NOT EXISTS households (
      id TEXT PRIMARY KEY,
      society_id TEXT NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
      block_id TEXT NULL REFERENCES apartment_blocks(id) ON DELETE SET NULL,
      block_name TEXT NOT NULL DEFAULT 'A',
      floor_number TEXT NOT NULL DEFAULT '1',
      flat_number TEXT NOT NULL,
      normalized_flat_number TEXT NOT NULL,
      occupancy_type TEXT NOT NULL DEFAULT 'OWNER' CHECK (occupancy_type IN ('OWNER', 'TENANT', 'VACANT')),
      area_sqft REAL NOT NULL DEFAULT 1200,
      status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('PENDING', 'ACTIVE', 'BLOCKED', 'ARCHIVED')),
      primary_member_id TEXT NULL,
      opening_balance REAL NOT NULL DEFAULT 0,
      opening_balance_notes TEXT NULL,
      opening_balance_date TEXT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_household_per_society
      ON households (society_id, normalized_flat_number)
      WHERE status != 'ARCHIVED';

    CREATE TABLE IF NOT EXISTS society_members (
      id TEXT PRIMARY KEY,
      society_id TEXT NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
      household_id TEXT NOT NULL REFERENCES households(id) ON DELETE RESTRICT,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      photo_url TEXT NULL,
      relationship_to_primary TEXT NOT NULL DEFAULT 'PRIMARY',
      is_primary_member INTEGER NOT NULL DEFAULT 1,
      ownership_type TEXT NOT NULL DEFAULT 'OWNER' CHECK (ownership_type IN ('OWNER', 'TENANT', 'FAMILY')),
      emergency_contact TEXT NULL,
      custom_fields TEXT NOT NULL DEFAULT '{}',
      approval_status TEXT NOT NULL DEFAULT 'APPROVED' CHECK (approval_status IN ('PENDING', 'APPROVED', 'REJECTED')),
      account_status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (account_status IN ('ACTIVE', 'BLOCKED', 'ARCHIVED')),
      joined_at TEXT NOT NULL DEFAULT (datetime('now')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS member_invitations (
      id TEXT PRIMARY KEY,
      society_id TEXT NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
      token TEXT NOT NULL UNIQUE,
      email TEXT NULL,
      phone TEXT NULL,
      flat_number TEXT NULL,
      expires_at TEXT NOT NULL,
      used_at TEXT NULL,
      created_by TEXT NOT NULL REFERENCES users(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS charge_categories (
      id TEXT PRIMARY KEY,
      society_id TEXT NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      code TEXT NOT NULL,
      description TEXT NULL,
      default_amount REAL NOT NULL DEFAULT 0,
      billing_frequency TEXT NOT NULL DEFAULT 'MONTHLY'
        CHECK (billing_frequency IN ('MONTHLY', 'QUARTERLY', 'ANNUAL', 'ONE_TIME')),
      applicable_flats TEXT NOT NULL DEFAULT 'ALL',
      due_day INTEGER NOT NULL DEFAULT 10,
      is_single_charge_per_period INTEGER NOT NULL DEFAULT 1,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE (society_id, code)
    );

    CREATE TABLE IF NOT EXISTS member_bills (
      id TEXT PRIMARY KEY,
      society_id TEXT NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
      household_id TEXT NOT NULL REFERENCES households(id) ON DELETE RESTRICT,
      member_id TEXT NULL REFERENCES society_members(id) ON DELETE SET NULL,
      bill_number TEXT NOT NULL UNIQUE,
      billing_month INTEGER NOT NULL CHECK (billing_month BETWEEN 1 AND 12),
      billing_year INTEGER NOT NULL CHECK (billing_year BETWEEN 2020 AND 2100),
      bill_type TEXT NOT NULL DEFAULT 'REGULAR'
        CHECK (bill_type IN ('REGULAR', 'SUPPLEMENTARY', 'ADJUSTMENT', 'OPENING_BALANCE')),
      adjustment_reason TEXT NULL,
      status TEXT NOT NULL DEFAULT 'UNPAID'
        CHECK (status IN ('DRAFT', 'PUBLISHED', 'UNPAID', 'PAYMENT_SUBMITTED', 'PENDING_VERIFICATION', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED')),
      subtotal_amount REAL NOT NULL DEFAULT 0,
      previous_balance REAL NOT NULL DEFAULT 0,
      penalty_amount REAL NOT NULL DEFAULT 0,
      credit_amount REAL NOT NULL DEFAULT 0,
      total_amount REAL NOT NULL DEFAULT 0,
      paid_amount REAL NOT NULL DEFAULT 0,
      balance_amount REAL NOT NULL DEFAULT 0,
      due_date TEXT NOT NULL,
      issued_at TEXT NULL,
      created_by TEXT NULL REFERENCES users(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_regular_bill_per_household_period
      ON member_bills (society_id, household_id, billing_month, billing_year)
      WHERE bill_type = 'REGULAR' AND status != 'CANCELLED';

    CREATE TABLE IF NOT EXISTS bill_items (
      id TEXT PRIMARY KEY,
      society_id TEXT NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
      bill_id TEXT NOT NULL REFERENCES member_bills(id) ON DELETE CASCADE,
      household_id TEXT NOT NULL REFERENCES households(id) ON DELETE RESTRICT,
      charge_category_id TEXT NOT NULL REFERENCES charge_categories(id) ON DELETE RESTRICT,
      category_name TEXT NOT NULL,
      billing_month INTEGER NOT NULL,
      billing_year INTEGER NOT NULL,
      description TEXT NULL,
      amount REAL NOT NULL,
      is_adjustment INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_charge_per_flat_period
      ON bill_items (society_id, household_id, billing_month, billing_year, charge_category_id)
      WHERE is_adjustment = 0;

    CREATE TABLE IF NOT EXISTS bill_adjustments (
      id TEXT PRIMARY KEY,
      society_id TEXT NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
      bill_id TEXT NOT NULL REFERENCES member_bills(id) ON DELETE CASCADE,
      adjustment_type TEXT NOT NULL CHECK (adjustment_type IN ('CREDIT', 'DEBIT', 'PENALTY_WAIVER', 'SUPPLEMENTARY')),
      amount REAL NOT NULL,
      reason TEXT NOT NULL,
      created_by TEXT NOT NULL REFERENCES users(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      society_id TEXT NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
      household_id TEXT NOT NULL REFERENCES households(id) ON DELETE RESTRICT,
      member_id TEXT NOT NULL REFERENCES society_members(id) ON DELETE RESTRICT,
      payment_method TEXT NOT NULL
        CHECK (payment_method IN ('UPI', 'GPAY_UPI', 'PAYTM', 'RAZORPAY', 'BANK_TRANSFER', 'CASH', 'OTHER')),
      amount REAL NOT NULL CHECK (amount > 0),
      payment_date TEXT NOT NULL,
      reference_number TEXT NOT NULL,
      proof_url TEXT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING_VERIFICATION'
        CHECK (status IN ('PAYMENT_SUBMITTED', 'PENDING_VERIFICATION', 'CONFIRMED', 'REJECTED', 'PARTIALLY_PAID', 'REFUNDED')),
      verification_notes TEXT NULL,
      verified_by TEXT NULL REFERENCES users(id),
      verified_at TEXT NULL,
      ledger_posted INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS payment_allocations (
      id TEXT PRIMARY KEY,
      society_id TEXT NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
      payment_id TEXT NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
      bill_id TEXT NOT NULL REFERENCES member_bills(id) ON DELETE RESTRICT,
      allocated_amount REAL NOT NULL CHECK (allocated_amount > 0),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE (payment_id, bill_id)
    );

    CREATE TABLE IF NOT EXISTS payment_receipts (
      id TEXT PRIMARY KEY,
      society_id TEXT NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
      payment_id TEXT NOT NULL UNIQUE REFERENCES payments(id) ON DELETE RESTRICT,
      receipt_number TEXT NOT NULL UNIQUE,
      issued_to_name TEXT NOT NULL,
      flat_number TEXT NOT NULL,
      amount REAL NOT NULL,
      payment_method TEXT NOT NULL,
      reference_number TEXT NOT NULL,
      issued_by TEXT NULL REFERENCES users(id),
      issued_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS staff_roles (
      id TEXT PRIMARY KEY,
      society_id TEXT NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      is_office_bearer INTEGER NOT NULL DEFAULT 0,
      is_system_default INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE (society_id, name)
    );

    CREATE TABLE IF NOT EXISTS role_permissions (
      id TEXT PRIMARY KEY,
      society_id TEXT NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
      role_id TEXT NOT NULL UNIQUE REFERENCES staff_roles(id) ON DELETE CASCADE,
      view_members INTEGER NOT NULL DEFAULT 0,
      manage_members INTEGER NOT NULL DEFAULT 0,
      generate_bills INTEGER NOT NULL DEFAULT 0,
      verify_payments INTEGER NOT NULL DEFAULT 0,
      manage_expenses INTEGER NOT NULL DEFAULT 0,
      view_financial_reports INTEGER NOT NULL DEFAULT 0,
      manage_complaints INTEGER NOT NULL DEFAULT 0,
      manage_events INTEGER NOT NULL DEFAULT 0,
      manage_staff INTEGER NOT NULL DEFAULT 0,
      change_society_settings INTEGER NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS staff (
      id TEXT PRIMARY KEY,
      society_id TEXT NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
      user_id TEXT NULL REFERENCES users(id) ON DELETE SET NULL,
      role_id TEXT NOT NULL REFERENCES staff_roles(id) ON DELETE RESTRICT,
      full_name TEXT NOT NULL,
      photo_url TEXT NULL,
      phone TEXT NOT NULL,
      email TEXT NULL,
      address TEXT NULL,
      designation TEXT NOT NULL,
      joining_date TEXT NOT NULL,
      wage_type TEXT NOT NULL DEFAULT 'MONTHLY' CHECK (wage_type IN ('MONTHLY', 'DAILY')),
      salary_amount REAL NOT NULL DEFAULT 0,
      employment_status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (employment_status IN ('ACTIVE', 'INACTIVE', 'TERMINATED')),
      is_on_duty INTEGER NOT NULL DEFAULT 0,
      duty_schedule TEXT NULL,
      assigned_duties TEXT NULL,
      show_contact_to_members INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS staff_documents (
      id TEXT PRIMARY KEY,
      society_id TEXT NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
      staff_id TEXT NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
      document_type TEXT NOT NULL,
      masked_document_number TEXT NOT NULL,
      document_url TEXT NOT NULL,
      uploaded_by TEXT NOT NULL REFERENCES users(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS staff_duty_records (
      id TEXT PRIMARY KEY,
      society_id TEXT NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
      staff_id TEXT NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
      duty_status TEXT NOT NULL CHECK (duty_status IN ('ON_DUTY', 'OFF_DUTY')),
      shift_notes TEXT NULL,
      changed_by TEXT NULL REFERENCES users(id),
      changed_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS attendance_records (
      id TEXT PRIMARY KEY,
      society_id TEXT NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
      staff_id TEXT NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
      attendance_date TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('PRESENT', 'ABSENT', 'HALF_DAY', 'LEAVE')),
      check_in_time TEXT NULL,
      check_out_time TEXT NULL,
      salary_paid REAL NOT NULL DEFAULT 0,
      notes TEXT NULL,
      recorded_by TEXT NULL REFERENCES users(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE (society_id, staff_id, attendance_date)
    );

    CREATE TABLE IF NOT EXISTS complaints (
      id TEXT PRIMARY KEY,
      society_id TEXT NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
      complaint_number TEXT NOT NULL UNIQUE,
      household_id TEXT NOT NULL REFERENCES households(id) ON DELETE CASCADE,
      member_id TEXT NOT NULL REFERENCES society_members(id) ON DELETE CASCADE,
      flat_number TEXT NOT NULL,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      priority TEXT NOT NULL DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
      status TEXT NOT NULL DEFAULT 'SUBMITTED'
        CHECK (status IN ('SUBMITTED', 'IN_PROGRESS', 'RESOLVED', 'REJECTED')),
      assigned_staff_id TEXT NULL REFERENCES staff(id) ON DELETE SET NULL,
      resolution_notes TEXT NULL,
      resolution_image_url TEXT NULL,
      resolved_at TEXT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS complaint_attachments (
      id TEXT PRIMARY KEY,
      society_id TEXT NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
      complaint_id TEXT NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
      file_url TEXT NOT NULL,
      file_type TEXT NOT NULL DEFAULT 'image/png',
      uploaded_by TEXT NOT NULL REFERENCES users(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS complaint_comments (
      id TEXT PRIMARY KEY,
      society_id TEXT NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
      complaint_id TEXT NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
      author_user_id TEXT NOT NULL REFERENCES users(id),
      author_name TEXT NOT NULL,
      comment_text TEXT NOT NULL,
      is_internal INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS suggestions (
      id TEXT PRIMARY KEY,
      society_id TEXT NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
      household_id TEXT NOT NULL REFERENCES households(id) ON DELETE CASCADE,
      member_id TEXT NOT NULL REFERENCES society_members(id) ON DELETE CASCADE,
      flat_number TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'SUBMITTED' CHECK (status IN ('SUBMITTED', 'UNDER_REVIEW', 'ACKNOWLEDGED', 'IMPLEMENTED')),
      admin_response TEXT NULL,
      responded_by TEXT NULL REFERENCES users(id),
      responded_at TEXT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS society_events (
      id TEXT PRIMARY KEY,
      society_id TEXT NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
      event_type TEXT NOT NULL DEFAULT 'GENERAL',
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      event_date TEXT NOT NULL,
      event_time TEXT NOT NULL,
      venue TEXT NOT NULL,
      image_url TEXT NULL,
      publication_status TEXT NOT NULL DEFAULT 'PUBLISHED' CHECK (publication_status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED')),
      created_by TEXT NULL REFERENCES users(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS announcements (
      id TEXT PRIMARY KEY,
      society_id TEXT NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
      category TEXT NOT NULL DEFAULT 'GENERAL'
        CHECK (category IN ('MEETING', 'FESTIVAL', 'MAINTENANCE', 'EMERGENCY', 'WATER_INTERRUPTION', 'SECURITY_ALERT', 'GENERAL')),
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      image_url TEXT NULL,
      publication_status TEXT NOT NULL DEFAULT 'PUBLISHED' CHECK (publication_status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED')),
      send_email INTEGER NOT NULL DEFAULT 1,
      created_by TEXT NULL REFERENCES users(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS financial_accounts (
      id TEXT PRIMARY KEY,
      society_id TEXT NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
      account_type TEXT NOT NULL CHECK (account_type IN ('CASH', 'BANK')),
      account_name TEXT NOT NULL,
      opening_balance REAL NOT NULL DEFAULT 0,
      current_balance REAL NOT NULL DEFAULT 0,
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE (society_id, account_type)
    );

    CREATE TABLE IF NOT EXISTS expense_categories (
      id TEXT PRIMARY KEY,
      society_id TEXT NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE (society_id, name)
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      society_id TEXT NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
      expense_category_id TEXT NOT NULL REFERENCES expense_categories(id) ON DELETE RESTRICT,
      category_name TEXT NOT NULL,
      description TEXT NOT NULL,
      amount REAL NOT NULL CHECK (amount > 0),
      expense_date TEXT NOT NULL,
      payment_method TEXT NOT NULL,
      account_type TEXT NOT NULL CHECK (account_type IN ('CASH', 'BANK')),
      vendor_name TEXT NOT NULL,
      invoice_url TEXT NULL,
      status TEXT NOT NULL DEFAULT 'APPROVED' CHECK (status IN ('APPROVED', 'REVERSED')),
      entered_by TEXT NOT NULL REFERENCES users(id),
      approved_by TEXT NULL REFERENCES users(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS ledger_entries (
      id TEXT PRIMARY KEY,
      society_id TEXT NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
      transaction_code TEXT NOT NULL UNIQUE,
      entry_date TEXT NOT NULL,
      entry_type TEXT NOT NULL
        CHECK (entry_type IN ('INCOME', 'EXPENSE', 'TRANSFER', 'RECEIVABLE', 'LIABILITY', 'REFUND', 'REVERSAL', 'ADJUSTMENT')),
      account_type TEXT NOT NULL CHECK (account_type IN ('CASH', 'BANK', 'RECEIVABLE', 'NONE')),
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      amount REAL NOT NULL,
      direction TEXT NOT NULL CHECK (direction IN ('CREDIT', 'DEBIT')),
      reference_type TEXT NOT NULL,
      reference_id TEXT NOT NULL,
      household_id TEXT NULL REFERENCES households(id) ON DELETE SET NULL,
      flat_number TEXT NULL,
      member_id TEXT NULL REFERENCES society_members(id) ON DELETE SET NULL,
      payment_method TEXT NULL,
      reversal_of_entry_id TEXT NULL REFERENCES ledger_entries(id),
      created_by TEXT NULL REFERENCES users(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE (society_id, reference_type, reference_id, entry_type)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      society_id TEXT NULL REFERENCES societies(id) ON DELETE CASCADE,
      user_id TEXT NULL REFERENCES users(id) ON DELETE CASCADE,
      notification_type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      channel TEXT NOT NULL DEFAULT 'IN_APP' CHECK (channel IN ('IN_APP', 'EMAIL', 'SMS', 'WHATSAPP')),
      dedup_key TEXT NULL UNIQUE,
      is_read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      society_id TEXT NULL REFERENCES societies(id) ON DELETE CASCADE,
      actor_user_id TEXT NULL REFERENCES users(id) ON DELETE SET NULL,
      actor_role TEXT NOT NULL,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT NULL,
      details TEXT NOT NULL DEFAULT '{}',
      ip_address TEXT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  const safeAlterColumns = [
    "ALTER TABLE society_settings ADD COLUMN razorpay_webhook_secret_encrypted TEXT NULL",
    "ALTER TABLE society_settings ADD COLUMN paytm_merchant_id TEXT NULL",
    "ALTER TABLE society_settings ADD COLUMN paytm_merchant_key_encrypted TEXT NULL",
    "ALTER TABLE society_settings ADD COLUMN custom_gateway_name TEXT NULL",
    "ALTER TABLE society_settings ADD COLUMN custom_gateway_api_key TEXT NULL",
    "ALTER TABLE society_settings ADD COLUMN custom_gateway_secret_encrypted TEXT NULL",
    "ALTER TABLE platform_settings ADD COLUMN razorpay_key_secret_encrypted TEXT NULL",
    "ALTER TABLE platform_settings ADD COLUMN razorpay_webhook_secret_encrypted TEXT NULL",
    "ALTER TABLE platform_settings ADD COLUMN paytm_merchant_id TEXT NULL",
    "ALTER TABLE platform_settings ADD COLUMN paytm_merchant_key_encrypted TEXT NULL",
    "ALTER TABLE platform_settings ADD COLUMN custom_gateway_name TEXT NULL",
    "ALTER TABLE platform_settings ADD COLUMN custom_gateway_api_key TEXT NULL",
    "ALTER TABLE platform_settings ADD COLUMN custom_gateway_secret_encrypted TEXT NULL",
    "ALTER TABLE platform_settings ADD COLUMN upi_id TEXT NULL",
    "ALTER TABLE platform_settings ADD COLUMN upi_payee_name TEXT NULL",
    "ALTER TABLE platform_settings ADD COLUMN bank_name TEXT NULL",
    "ALTER TABLE platform_settings ADD COLUMN bank_account_number TEXT NULL",
    "ALTER TABLE platform_settings ADD COLUMN bank_ifsc TEXT NULL",
    "ALTER TABLE households ADD COLUMN opening_balance REAL NOT NULL DEFAULT 0",
    "ALTER TABLE households ADD COLUMN opening_balance_notes TEXT NULL",
    "ALTER TABLE households ADD COLUMN opening_balance_date TEXT NULL",
  ];
  for (const sql of safeAlterColumns) {
    try {
      db.exec(sql);
    } catch {
      // Column already exists
    }
  }

  // Migrate member_bills if CHECK constraint lacks 'OPENING_BALANCE'
  try {
    const billTableSql = db
      .prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='member_bills'")
      .get() as { sql?: string } | undefined;
    if (billTableSql?.sql && !billTableSql.sql.includes('OPENING_BALANCE')) {
      db.exec('PRAGMA foreign_keys = OFF;');
      db.exec(`
        CREATE TABLE member_bills_temp_migration (
          id TEXT PRIMARY KEY,
          society_id TEXT NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
          household_id TEXT NOT NULL REFERENCES households(id) ON DELETE RESTRICT,
          member_id TEXT NULL REFERENCES society_members(id) ON DELETE SET NULL,
          bill_number TEXT NOT NULL UNIQUE,
          billing_month INTEGER NOT NULL CHECK (billing_month BETWEEN 1 AND 12),
          billing_year INTEGER NOT NULL CHECK (billing_year BETWEEN 2020 AND 2100),
          bill_type TEXT NOT NULL DEFAULT 'REGULAR'
            CHECK (bill_type IN ('REGULAR', 'SUPPLEMENTARY', 'ADJUSTMENT', 'OPENING_BALANCE')),
          adjustment_reason TEXT NULL,
          status TEXT NOT NULL DEFAULT 'UNPAID'
            CHECK (status IN ('DRAFT', 'PUBLISHED', 'UNPAID', 'PAYMENT_SUBMITTED', 'PENDING_VERIFICATION', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED')),
          subtotal_amount REAL NOT NULL DEFAULT 0,
          previous_balance REAL NOT NULL DEFAULT 0,
          penalty_amount REAL NOT NULL DEFAULT 0,
          credit_amount REAL NOT NULL DEFAULT 0,
          total_amount REAL NOT NULL DEFAULT 0,
          paid_amount REAL NOT NULL DEFAULT 0,
          balance_amount REAL NOT NULL DEFAULT 0,
          due_date TEXT NOT NULL,
          issued_at TEXT NULL,
          created_by TEXT NULL REFERENCES users(id),
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
        INSERT INTO member_bills_temp_migration SELECT * FROM member_bills;
        DROP TABLE member_bills;
        ALTER TABLE member_bills_temp_migration RENAME TO member_bills;
        CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_regular_bill_per_household_period
          ON member_bills (society_id, household_id, billing_month, billing_year)
          WHERE bill_type = 'REGULAR' AND status != 'CANCELLED';
      `);
      db.exec('PRAGMA foreign_keys = ON;');
    }
  } catch (migrationErr) {
    console.error('[Migration Warning] Failed to update member_bills check constraint:', migrationErr);
  }
}

/**
 * Provisions default settings, blocks, charge categories, expense categories,
 * staff roles & permissions, and financial accounts for any newly created society.
 */
export function bootstrapSocietyDefaults(societyId: string, societyName: string): void {
  const existingSettings = db
    .prepare('SELECT id FROM society_settings WHERE society_id = ?')
    .get(societyId);
  if (!existingSettings) {
    const slug = societyName.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 14) || 'society';
    db.prepare(`
      INSERT INTO society_settings (
        id, society_id, upi_enabled, gpay_upi_enabled, paytm_enabled, razorpay_enabled, bank_transfer_enabled,
        upi_id, upi_payee_name, bank_name, bank_account_number, bank_ifsc, bill_due_day, late_fee_amount
      ) VALUES (?, ?, 1, 1, 1, 1, 1, ?, ?, 'HDFC Bank Ltd', '50200089412210', 'HDFC0001245', 10, 150)
    `).run(uuid(), societyId, `${slug}@hdfcbank`, `${societyName} RWA`);
  }

  // Default Financial Accounts (CASH & BANK)
  for (const accType of ['CASH', 'BANK'] as const) {
    const exists = db
      .prepare('SELECT id FROM financial_accounts WHERE society_id = ? AND account_type = ?')
      .get(societyId, accType);
    if (!exists) {
      db.prepare(`
        INSERT INTO financial_accounts (id, society_id, account_type, account_name, opening_balance, current_balance)
        VALUES (?, ?, ?, ?, 0, 0)
      `).run(
        uuid(),
        societyId,
        accType,
        accType === 'CASH' ? 'Society Petty Cash Account' : 'Society Main RWA Bank Account'
      );
    }
  }

  // Default Apartment Blocks
  for (const blockName of ['Block A', 'Block B', 'Block C']) {
    const exists = db
      .prepare('SELECT id FROM apartment_blocks WHERE society_id = ? AND name = ?')
      .get(societyId, blockName);
    if (!exists) {
      db.prepare(`
        INSERT INTO apartment_blocks (id, society_id, name, total_floors, description)
        VALUES (?, ?, ?, 10, ?)
      `).run(uuid(), societyId, blockName, `Residential ${blockName}`);
    }
  }

  // Default 10 Charge Categories (Section 6 of PRD)
  const defaultCharges = [
    { name: 'Monthly maintenance', code: 'MONTHLY_MAINTENANCE', amount: 2500, freq: 'MONTHLY' },
    { name: 'Water charges', code: 'WATER_CHARGES', amount: 400, freq: 'MONTHLY' },
    { name: 'Electricity charges', code: 'ELECTRICITY_CHARGES', amount: 600, freq: 'MONTHLY' },
    { name: 'Parking charges', code: 'PARKING_CHARGES', amount: 300, freq: 'MONTHLY' },
    { name: 'Security charges', code: 'SECURITY_CHARGES', amount: 500, freq: 'MONTHLY' },
    { name: 'Cleaning charges', code: 'CLEANING_CHARGES', amount: 250, freq: 'MONTHLY' },
    { name: 'Repair and maintenance', code: 'REPAIR_MAINTENANCE', amount: 350, freq: 'ONE_TIME' },
    { name: 'Late payment fees', code: 'LATE_PAYMENT_FEES', amount: 150, freq: 'ONE_TIME' },
    { name: 'Special assessments', code: 'SPECIAL_ASSESSMENTS', amount: 1000, freq: 'ONE_TIME' },
    { name: 'Other charges', code: 'OTHER_CHARGES', amount: 200, freq: 'ONE_TIME' },
  ];

  for (const ch of defaultCharges) {
    const exists = db
      .prepare('SELECT id FROM charge_categories WHERE society_id = ? AND code = ?')
      .get(societyId, ch.code);
    if (!exists) {
      db.prepare(`
        INSERT INTO charge_categories (
          id, society_id, name, code, description, default_amount, billing_frequency, applicable_flats, due_day, is_single_charge_per_period, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'ALL', 10, 1, 1)
      `).run(uuid(), societyId, ch.name, ch.code, `${ch.name} for society households`, ch.amount, ch.freq);
    }
  }

  // Default Expense Categories (Section 12 of PRD)
  const defaultExpenseCategories = [
    'Security Services & Guards',
    'Housekeeping & Sanitation',
    'Common Area Electricity Bill',
    'Water Tanker & Pump Repair',
    'Lift AMC & Maintenance',
    'Garden & Landscaping',
    'Diesel for Generator',
    'Office Stationery & Admin',
    'Festival & Community Events',
  ];
  for (const expName of defaultExpenseCategories) {
    const exists = db
      .prepare('SELECT id FROM expense_categories WHERE society_id = ? AND name = ?')
      .get(societyId, expName);
    if (!exists) {
      db.prepare(`
        INSERT INTO expense_categories (id, society_id, name, description, is_active)
        VALUES (?, ?, ?, ?, 1)
      `).run(uuid(), societyId, expName, `Standard expense head: ${expName}`);
    }
  }

  // Default Staff & Office Bearer Roles with granular permissions (Sections 3C, 9, 13 of PRD)
  const defaultRoles = [
    {
      name: 'President',
      isOfficeBearer: 1,
      perms: {
        view_members: 1, manage_members: 1, generate_bills: 1, verify_payments: 1,
        manage_expenses: 1, view_financial_reports: 1, manage_complaints: 1,
        manage_events: 1, manage_staff: 1, change_society_settings: 1,
      },
    },
    {
      name: 'Vice President',
      isOfficeBearer: 1,
      perms: {
        view_members: 1, manage_members: 1, generate_bills: 1, verify_payments: 1,
        manage_expenses: 1, view_financial_reports: 1, manage_complaints: 1,
        manage_events: 1, manage_staff: 1, change_society_settings: 0,
      },
    },
    {
      name: 'Secretary',
      isOfficeBearer: 1,
      perms: {
        view_members: 1, manage_members: 1, generate_bills: 1, verify_payments: 0,
        manage_expenses: 1, view_financial_reports: 1, manage_complaints: 1,
        manage_events: 1, manage_staff: 1, change_society_settings: 1,
      },
    },
    {
      name: 'Joint Secretary',
      isOfficeBearer: 1,
      perms: {
        view_members: 1, manage_members: 0, generate_bills: 0, verify_payments: 0,
        manage_expenses: 0, view_financial_reports: 1, manage_complaints: 1,
        manage_events: 1, manage_staff: 1, change_society_settings: 0,
      },
    },
    {
      name: 'Treasurer',
      isOfficeBearer: 1,
      perms: {
        view_members: 1, manage_members: 0, generate_bills: 1, verify_payments: 1,
        manage_expenses: 1, view_financial_reports: 1, manage_complaints: 0,
        manage_events: 0, manage_staff: 0, change_society_settings: 0,
      },
    },
    {
      name: 'Cashier',
      isOfficeBearer: 0,
      perms: {
        view_members: 1, manage_members: 0, generate_bills: 0, verify_payments: 1,
        manage_expenses: 0, view_financial_reports: 1, manage_complaints: 0,
        manage_events: 0, manage_staff: 0, change_society_settings: 0,
      },
    },
    {
      name: 'Accountant',
      isOfficeBearer: 0,
      perms: {
        view_members: 1, manage_members: 0, generate_bills: 1, verify_payments: 1,
        manage_expenses: 1, view_financial_reports: 1, manage_complaints: 0,
        manage_events: 0, manage_staff: 0, change_society_settings: 0,
      },
    },
    {
      name: 'Maintenance Supervisor',
      isOfficeBearer: 0,
      perms: {
        view_members: 1, manage_members: 0, generate_bills: 0, verify_payments: 0,
        manage_expenses: 1, view_financial_reports: 0, manage_complaints: 1,
        manage_events: 0, manage_staff: 1, change_society_settings: 0,
      },
    },
    {
      name: 'Security Supervisor',
      isOfficeBearer: 0,
      perms: {
        view_members: 1, manage_members: 0, generate_bills: 0, verify_payments: 0,
        manage_expenses: 0, view_financial_reports: 0, manage_complaints: 1,
        manage_events: 0, manage_staff: 1, change_society_settings: 0,
      },
    },
    {
      name: 'Security Guard',
      isOfficeBearer: 0,
      perms: {
        view_members: 1, manage_members: 0, generate_bills: 0, verify_payments: 0,
        manage_expenses: 0, view_financial_reports: 0, manage_complaints: 0,
        manage_events: 0, manage_staff: 0, change_society_settings: 0,
      },
    },
    {
      name: 'Maintenance Staff',
      isOfficeBearer: 0,
      perms: {
        view_members: 0, manage_members: 0, generate_bills: 0, verify_payments: 0,
        manage_expenses: 0, view_financial_reports: 0, manage_complaints: 1,
        manage_events: 0, manage_staff: 0, change_society_settings: 0,
      },
    },
    {
      name: 'Office Administrator',
      isOfficeBearer: 0,
      perms: {
        view_members: 1, manage_members: 1, generate_bills: 1, verify_payments: 0,
        manage_expenses: 0, view_financial_reports: 0, manage_complaints: 1,
        manage_events: 1, manage_staff: 1, change_society_settings: 0,
      },
    },
  ];

  for (const r of defaultRoles) {
    let roleRow = db
      .prepare('SELECT id FROM staff_roles WHERE society_id = ? AND name = ?')
      .get(societyId, r.name) as { id: string } | undefined;
    if (!roleRow) {
      const roleId = uuid();
      db.prepare(`
        INSERT INTO staff_roles (id, society_id, name, is_office_bearer, is_system_default)
        VALUES (?, ?, ?, ?, 1)
      `).run(roleId, societyId, r.name, r.isOfficeBearer);
      db.prepare(`
        INSERT INTO role_permissions (
          id, society_id, role_id, view_members, manage_members, generate_bills, verify_payments,
          manage_expenses, view_financial_reports, manage_complaints, manage_events, manage_staff, change_society_settings
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        uuid(),
        societyId,
        roleId,
        r.perms.view_members,
        r.perms.manage_members,
        r.perms.generate_bills,
        r.perms.verify_payments,
        r.perms.manage_expenses,
        r.perms.view_financial_reports,
        r.perms.manage_complaints,
        r.perms.manage_events,
        r.perms.manage_staff,
        r.perms.change_society_settings
      );
    }
  }
}

export function logAudit(params: {
  societyId?: string | null;
  actorUserId?: string | null;
  actorRole: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  details?: Record<string, unknown>;
  ipAddress?: string | null;
}): void {
  db.prepare(`
    INSERT INTO audit_logs (id, society_id, actor_user_id, actor_role, action, entity_type, entity_id, details, ip_address)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    uuid(),
    params.societyId ?? null,
    params.actorUserId ?? null,
    params.actorRole,
    params.action,
    params.entityType,
    params.entityId ?? null,
    JSON.stringify(params.details ?? {}),
    params.ipAddress ?? null
  );
}

export function sendNotification(params: {
  societyId?: string | null;
  userId?: string | null;
  notificationType: string;
  title: string;
  message: string;
  channel?: 'IN_APP' | 'EMAIL' | 'SMS' | 'WHATSAPP';
  dedupKey?: string | null;
}): boolean {
  if (params.dedupKey) {
    const existing = db
      .prepare('SELECT id FROM notifications WHERE dedup_key = ?')
      .get(params.dedupKey);
    if (existing) {
      return false; // Prevent duplicate notification
    }
  }
  db.prepare(`
    INSERT INTO notifications (id, society_id, user_id, notification_type, title, message, channel, dedup_key)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    uuid(),
    params.societyId ?? null,
    params.userId ?? null,
    params.notificationType,
    params.title,
    params.message,
    params.channel ?? 'IN_APP',
    params.dedupKey ?? null
  );
  return true;
}

export function seedInitialDataIfEmpty(): void {
  const envRazorpayKeyId = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || '';
  const existingPlatform = db.prepare('SELECT id, razorpay_key_id FROM platform_settings LIMIT 1').get() as { id: string; razorpay_key_id: string } | undefined;
  if (!existingPlatform) {
    db.prepare(`
      INSERT INTO platform_settings (
        id, platform_name, support_email, support_phone, default_trial_enabled, default_trial_days,
        default_grace_period_days, auto_approve_paid_societies, auto_approve_trial_societies, razorpay_key_id
      ) VALUES ('default', 'SocietyOS Enterprise SaaS', 'superadmin@societyos.com', '+91-98765-00001', 1, 14, 7, 1, 1, ?)
    `).run(envRazorpayKeyId);
  } else if (
    envRazorpayKeyId &&
    (!existingPlatform.razorpay_key_id || existingPlatform.razorpay_key_id.startsWith('rzp_test_platform_demo_key'))
  ) {
    db.prepare("UPDATE platform_settings SET razorpay_key_id = ? WHERE id = 'default'").run(envRazorpayKeyId);
  }

  // Seed Subscription Plans
  const planCount = (db.prepare('SELECT COUNT(*) as cnt FROM subscription_plans').get() as { cnt: number }).cnt;
  const planMonthlyId = 'plan-monthly-standard';
  const planQuarterlyId = 'plan-quarterly-growth';
  const planAnnualId = 'plan-annual-enterprise';

  if (planCount === 0) {
    db.prepare(`
      INSERT INTO subscription_plans (
        id, code, name, description, billing_period, duration_days, price_amount, tax_percent,
        max_households, trial_enabled, trial_days, grace_period_days, auto_approve_after_payment, is_active
      ) VALUES
      (?, 'MONTHLY_STARTER', 'Starter Monthly Plan', 'Ideal for small societies and apartments up to 100 flats.', 'MONTHLY', 30, 1999, 18, 100, 1, 14, 7, 1, 1),
      (?, 'QUARTERLY_GROWTH', 'Growth Quarterly Plan', 'Complete billing, accounting, and staff portal for up to 300 flats.', 'QUARTERLY', 90, 5499, 18, 300, 1, 14, 7, 1, 1),
      (?, 'ANNUAL_ENTERPRISE', 'Enterprise Annual RWA Suite', 'Full multi-block suite with unlimited reports, priority support & up to 1000 flats.', 'ANNUAL', 365, 19999, 18, 1000, 1, 14, 10, 1, 1)
    `).run(planMonthlyId, planQuarterlyId, planAnnualId);
  }

  // Seed Super Admin Account
  const superAdminExists = db.prepare("SELECT id FROM users WHERE role = 'SUPER_ADMIN' LIMIT 1").get();
  if (!superAdminExists) {
    const superAdminId = 'user-super-admin';
    db.prepare(`
      INSERT INTO users (id, email, phone, password_hash, role, society_id, is_active, email_verified)
      VALUES (?, 'superadmin@societyos.com', '+91-98765-00001', ?, 'SUPER_ADMIN', NULL, 1, 1)
    `).run(superAdminId, hashPassword('SuperAdmin@123'));

    db.prepare(`
      INSERT INTO user_profiles (id, user_id, society_id, full_name, preferred_language)
      VALUES (?, ?, NULL, 'Platform Owner (Super Admin)', 'en')
    `).run(uuid(), superAdminId);
  }

  // Seed 2 Isolated Sample Societies (Clearly flagged with is_demo = 1 as required by Section 21)
  const societyCount = (db.prepare('SELECT COUNT(*) as cnt FROM societies').get() as { cnt: number }).cnt;
  if (societyCount === 0) {
    const soc1Id = 'soc-green-valley';
    const soc2Id = 'soc-royal-palms';
    const admin1Id = 'user-admin-green-valley';
    const admin2Id = 'user-admin-royal-palms';

    // Society 1: Green Valley Residency (Active Paid Annual Subscription)
    db.prepare(`
      INSERT INTO societies (
        id, name, slug, enrollment_code, address, city, state, pincode,
        contact_email, contact_phone, registration_number, subscription_plan_id,
        subscription_status, approval_status, account_status, payment_status,
        subscription_starts_at, subscription_ends_at, is_demo
      ) VALUES (
        ?, 'Green Valley Residency (Demo)', 'green-valley-residency', 'GVR-2026',
        'Sector 68, Airport Road, Mohali', 'Mohali', 'Punjab', '160062',
        'admin@greenvalley.com', '+91-98150-11223', 'PB-MOH-RWA-2021-089', ?,
        'ACTIVE', 'APPROVED', 'ACTIVE', 'PAID',
        datetime('now', '-30 days'), datetime('now', '+335 days'), 1
      )
    `).run(soc1Id, planAnnualId);

    db.prepare(`
      INSERT INTO users (id, email, phone, password_hash, role, society_id, is_active, email_verified)
      VALUES (?, 'admin@greenvalley.com', '+91-98150-11223', ?, 'SOCIETY_ADMIN', ?, 1, 1)
    `).run(admin1Id, hashPassword('Admin@123'), soc1Id);

    db.prepare(`
      INSERT INTO user_profiles (id, user_id, society_id, full_name, preferred_language)
      VALUES (?, ?, ?, 'Harpreet Singh Gill (RWA President)', 'en')
    `).run(uuid(), admin1Id, soc1Id);

    db.prepare('UPDATE societies SET admin_user_id = ? WHERE id = ?').run(admin1Id, soc1Id);

    // Record verified subscription payment for Society 1
    const sub1Id = uuid();
    db.prepare(`
      INSERT INTO society_subscriptions (id, society_id, plan_id, status, starts_at, ends_at, is_trial)
      VALUES (?, ?, ?, 'ACTIVE', datetime('now', '-30 days'), datetime('now', '+335 days'), 0)
    `).run(sub1Id, soc1Id, planAnnualId);

    db.prepare(`
      INSERT INTO subscription_payments (
        id, society_id, subscription_id, plan_id, invoice_number, amount, tax_amount, total_amount,
        payment_gateway, gateway_order_id, gateway_payment_id, verified_by_webhook, status, paid_at
      ) VALUES (?, ?, ?, ?, 'SUB-INV-2026-0001', 19999, 3599.82, 23598.82, 'RAZORPAY', 'order_demo_gvr_01', 'pay_demo_gvr_01', 1, 'PAID', datetime('now', '-30 days'))
    `).run(uuid(), soc1Id, sub1Id, planAnnualId);

    bootstrapSocietyDefaults(soc1Id, 'Green Valley Residency');

    // Society 2: Royal Palms Enclave (On 14-Day Free Trial)
    db.prepare(`
      INSERT INTO societies (
        id, name, slug, enrollment_code, address, city, state, pincode,
        contact_email, contact_phone, registration_number, subscription_plan_id,
        subscription_status, approval_status, account_status, payment_status,
        trial_starts_at, trial_ends_at, is_demo
      ) VALUES (
        ?, 'Royal Palms Enclave (Demo)', 'royal-palms-enclave', 'RPE-2026',
        'Pakhowal Road, Civil Lines, Ludhiana', 'Ludhiana', 'Punjab', '141001',
        'admin@royalpalms.com', '+91-98720-44556', 'PB-LDH-RWA-2024-112', ?,
        'TRIAL', 'APPROVED', 'ACTIVE', 'TRIAL',
        datetime('now', '-3 days'), datetime('now', '+11 days'), 1
      )
    `).run(soc2Id, planQuarterlyId);

    db.prepare(`
      INSERT INTO users (id, email, phone, password_hash, role, society_id, is_active, email_verified)
      VALUES (?, 'admin@royalpalms.com', '+91-98720-44556', ?, 'SOCIETY_ADMIN', ?, 1, 1)
    `).run(admin2Id, hashPassword('Admin@123'), soc2Id);

    db.prepare(`
      INSERT INTO user_profiles (id, user_id, society_id, full_name, preferred_language)
      VALUES (?, ?, ?, 'Gurप्रीत Kaur Sandhu (Secretary)', 'en')
    `).run(uuid(), admin2Id, soc2Id);

    db.prepare('UPDATE societies SET admin_user_id = ? WHERE id = ?').run(admin2Id, soc2Id);

    const sub2Id = uuid();
    db.prepare(`
      INSERT INTO society_subscriptions (id, society_id, plan_id, status, starts_at, ends_at, is_trial)
      VALUES (?, ?, ?, 'TRIAL', datetime('now', '-3 days'), datetime('now', '+11 days'), 1)
    `).run(sub2Id, soc2Id, planQuarterlyId);

    bootstrapSocietyDefaults(soc2Id, 'Royal Palms Enclave');

    // Seed Households & Members in Society 1 (Green Valley Residency)
    const blockA = db.prepare("SELECT id FROM apartment_blocks WHERE society_id = ? AND name = 'Block A'").get(soc1Id) as { id: string };
    const blockB = db.prepare("SELECT id FROM apartment_blocks WHERE society_id = ? AND name = 'Block B'").get(soc1Id) as { id: string };

    const hh1Id = 'hh-gvr-a101';
    const hh2Id = 'hh-gvr-a102';
    const hh3Id = 'hh-gvr-b201';
    const mem1UserId = 'user-member-a101';
    const mem2UserId = 'user-member-a102';
    const mem3UserId = 'user-member-b201';
    const mem1Id = 'member-gvr-a101';
    const mem2Id = 'member-gvr-a102';
    const mem3Id = 'member-gvr-b201';

    db.prepare(`
      INSERT INTO households (id, society_id, block_id, block_name, floor_number, flat_number, normalized_flat_number, occupancy_type, area_sqft, status, primary_member_id)
      VALUES
      (?, ?, ?, 'Block A', '1', 'A-101', ?, 'OWNER', 1450, 'ACTIVE', ?),
      (?, ?, ?, 'Block A', '1', 'A-102', ?, 'TENANT', 1450, 'ACTIVE', ?),
      (?, ?, ?, 'Block B', '2', 'B-201', ?, 'OWNER', 1650, 'ACTIVE', ?)
    `).run(
      hh1Id, soc1Id, blockA.id, normalizeFlatNumber('A-101'), mem1Id,
      hh2Id, soc1Id, blockA.id, normalizeFlatNumber('A-102'), mem2Id,
      hh3Id, soc1Id, blockB.id, normalizeFlatNumber('B-201'), mem3Id
    );

    db.prepare(`
      INSERT INTO users (id, email, phone, password_hash, role, society_id, is_active, email_verified)
      VALUES
      (?, 'resident@greenvalley.com', '+91-98151-10101', ?, 'MEMBER', ?, 1, 1),
      (?, 'simran@greenvalley.com', '+91-98151-10102', ?, 'MEMBER', ?, 1, 1),
      (?, 'rajesh@greenvalley.com', '+91-98151-20101', ?, 'MEMBER', ?, 1, 1)
    `).run(
      mem1UserId, hashPassword('Member@123'), soc1Id,
      mem2UserId, hashPassword('Member@123'), soc1Id,
      mem3UserId, hashPassword('Member@123'), soc1Id
    );

    db.prepare(`
      INSERT INTO user_profiles (id, user_id, society_id, full_name, preferred_language, address, emergency_contact_name, emergency_contact_phone)
      VALUES
      (?, ?, ?, 'Manpreet Singh Brar', 'en', 'Flat A-101, Block A, Green Valley Residency', 'Kuldeep Kaur', '+91-98151-99991'),
      (?, ?, ?, 'Simranjit Kaur Dhillon', 'pa', 'Flat A-102, Block A, Green Valley Residency', 'Navjot Singh', '+91-98151-99992'),
      (?, ?, ?, 'Rajesh Kumar Sharma', 'en', 'Flat B-201, Block B, Green Valley Residency', 'Anita Sharma', '+91-98151-99993')
    `).run(uuid(), mem1UserId, soc1Id, uuid(), mem2UserId, soc1Id, uuid(), mem3UserId, soc1Id);

    db.prepare(`
      INSERT INTO society_members (
        id, society_id, household_id, user_id, full_name, email, phone,
        relationship_to_primary, is_primary_member, ownership_type, emergency_contact, approval_status, account_status
      ) VALUES
      (?, ?, ?, ?, 'Manpreet Singh Brar', 'resident@greenvalley.com', '+91-98151-10101', 'PRIMARY', 1, 'OWNER', 'Kuldeep Kaur (+91-98151-99991)', 'APPROVED', 'ACTIVE'),
      (?, ?, ?, ?, 'Simranjit Kaur Dhillon', 'simran@greenvalley.com', '+91-98151-10102', 'PRIMARY', 1, 'TENANT', 'Navjot Singh (+91-98151-99992)', 'APPROVED', 'ACTIVE'),
      (?, ?, ?, ?, 'Rajesh Kumar Sharma', 'rajesh@greenvalley.com', '+91-98151-20101', 'PRIMARY', 1, 'OWNER', 'Anita Sharma (+91-98151-99993)', 'APPROVED', 'ACTIVE')
    `).run(
      mem1Id, soc1Id, hh1Id, mem1UserId,
      mem2Id, soc1Id, hh2Id, mem2UserId,
      mem3Id, soc1Id, hh3Id, mem3UserId
    );

    // Also seed a household in Society 2 (with flat A-101 to prove cross-society isolation works!)
    const soc2BlockA = db.prepare("SELECT id FROM apartment_blocks WHERE society_id = ? AND name = 'Block A'").get(soc2Id) as { id: string };
    const hhSoc2Id = 'hh-rpe-a101';
    const memSoc2UserId = 'user-member-rpe-a101';
    const memSoc2Id = 'member-rpe-a101';
    db.prepare(`
      INSERT INTO households (id, society_id, block_id, block_name, floor_number, flat_number, normalized_flat_number, occupancy_type, area_sqft, status, primary_member_id)
      VALUES (?, ?, ?, 'Block A', '1', 'A-101', ?, 'OWNER', 1800, 'ACTIVE', ?)
    `).run(hhSoc2Id, soc2Id, soc2BlockA.id, normalizeFlatNumber('A-101'), memSoc2Id);

    db.prepare(`
      INSERT INTO users (id, email, phone, password_hash, role, society_id, is_active, email_verified)
      VALUES (?, 'resident@royalpalms.com', '+91-98720-10101', ?, 'MEMBER', ?, 1, 1)
    `).run(memSoc2UserId, hashPassword('Member@123'), soc2Id);

    db.prepare(`
      INSERT INTO user_profiles (id, user_id, society_id, full_name, preferred_language, address)
      VALUES (?, ?, ?, 'Amanpreet Singh Grewal', 'en', 'Flat A-101, Royal Palms Enclave')
    `).run(uuid(), memSoc2UserId, soc2Id);

    db.prepare(`
      INSERT INTO society_members (
        id, society_id, household_id, user_id, full_name, email, phone,
        relationship_to_primary, is_primary_member, ownership_type, approval_status, account_status
      ) VALUES (?, ?, ?, ?, 'Amanpreet Singh Grewal', 'resident@royalpalms.com', '+91-98720-10101', 'PRIMARY', 1, 'OWNER', 'APPROVED', 'ACTIVE')
    `).run(memSoc2Id, soc2Id, hhSoc2Id, memSoc2UserId);

    // Seed Staff Accounts in Society 1 (Cashier login + Security Guard on duty + Maintenance Staff)
    const cashierRole = db.prepare("SELECT id FROM staff_roles WHERE society_id = ? AND name = 'Cashier'").get(soc1Id) as { id: string };
    const guardRole = db.prepare("SELECT id FROM staff_roles WHERE society_id = ? AND name = 'Security Guard'").get(soc1Id) as { id: string };
    const maintRole = db.prepare("SELECT id FROM staff_roles WHERE society_id = ? AND name = 'Maintenance Staff'").get(soc1Id) as { id: string };

    const cashierUserId = 'user-staff-cashier-gvr';
    db.prepare(`
      INSERT INTO users (id, email, phone, password_hash, role, society_id, is_active, email_verified)
      VALUES (?, 'cashier@greenvalley.com', '+91-98152-33445', ?, 'STAFF', ?, 1, 1)
    `).run(cashierUserId, hashPassword('Staff@123'), soc1Id);

    db.prepare(`
      INSERT INTO user_profiles (id, user_id, society_id, full_name, preferred_language)
      VALUES (?, ?, ?, 'Balwinder Singh (Cashier)', 'en')
    `).run(uuid(), cashierUserId, soc1Id);

    const staffCashierId = 'staff-gvr-cashier';
    const staffGuardId = 'staff-gvr-guard';
    const staffMaintId = 'staff-gvr-plumber';

    db.prepare(`
      INSERT INTO staff (
        id, society_id, user_id, role_id, full_name, phone, email, address, designation,
        joining_date, wage_type, salary_amount, employment_status, is_on_duty, duty_schedule, assigned_duties, show_contact_to_members
      ) VALUES
      (?, ?, ?, ?, 'Balwinder Singh', '+91-98152-33445', 'cashier@greenvalley.com', 'Phase 7, Mohali', 'Society Cashier', '2024-01-15', 'MONTHLY', 22000, 'ACTIVE', 1, 'Mon-Sat 09:00 AM - 05:00 PM', 'Payment verification, receipt generation & collection desk', 1),
      (?, ?, NULL, ?, 'Sukhdev Singh', '+91-98152-77889', 'sukhdev.guard@greenvalley.com', 'Sohana, Mohali', 'Head Security Guard', '2023-06-01', 'MONTHLY', 18500, 'ACTIVE', 1, 'Daily 08:00 AM - 08:00 PM (Gate 1)', 'Main Gate Entry/Exit & Visitor Verification', 1),
      (?, ?, NULL, ?, 'Rameshwar Prasad', '+91-98152-99001', NULL, 'Kharar, Mohali', 'Plumber & Electrician', '2024-03-10', 'MONTHLY', 19500, 'ACTIVE', 1, 'Daily 09:00 AM - 06:00 PM', 'Water supply, electrical panel & pump room maintenance', 1)
    `).run(
      staffCashierId, soc1Id, cashierUserId, cashierRole.id,
      staffGuardId, soc1Id, guardRole.id,
      staffMaintId, soc1Id, maintRole.id
    );

    // Seed Sample Bills, Confirmed Payment, Pending Verification Payment, Expense & Ledger for Society 1
    const maintCat = db.prepare("SELECT id, name FROM charge_categories WHERE society_id = ? AND code = 'MONTHLY_MAINTENANCE'").get(soc1Id) as { id: string; name: string };
    const waterCat = db.prepare("SELECT id, name FROM charge_categories WHERE society_id = ? AND code = 'WATER_CHARGES'").get(soc1Id) as { id: string; name: string };
    const secCat = db.prepare("SELECT id, name FROM charge_categories WHERE society_id = ? AND code = 'SECURITY_CHARGES'").get(soc1Id) as { id: string; name: string };

    const bill1Id = 'bill-gvr-2026-10-a101';
    const bill2Id = 'bill-gvr-2026-10-a102';
    const bill3Id = 'bill-gvr-2026-10-b201';

    // Bill 1: A-101 (UNPAID so resident can test paying or viewing current month's bill, plus previous month PAID)
    const bill0Id = 'bill-gvr-2026-09-a101';
    db.prepare(`
      INSERT INTO member_bills (
        id, society_id, household_id, member_id, bill_number, billing_month, billing_year,
        bill_type, status, subtotal_amount, previous_balance, penalty_amount, credit_amount,
        total_amount, paid_amount, balance_amount, due_date, issued_at, created_by
      ) VALUES
      (?, ?, ?, ?, 'GVR-202609-A101', 9, 2026, 'REGULAR', 'PAID', 3400, 0, 0, 0, 3400, 3400, 0, '2026-09-10', datetime('now', '-40 days'), ?),
      (?, ?, ?, ?, 'GVR-202610-A101', 10, 2026, 'REGULAR', 'UNPAID', 3400, 0, 0, 0, 3400, 0, 3400, '2026-10-25', datetime('now', '-5 days'), ?),
      (?, ?, ?, ?, 'GVR-202610-A102', 10, 2026, 'REGULAR', 'PENDING_VERIFICATION', 3400, 0, 0, 0, 3400, 0, 3400, '2026-10-25', datetime('now', '-5 days'), ?),
      (?, ?, ?, ?, 'GVR-202610-B201', 10, 2026, 'REGULAR', 'PAID', 3400, 0, 0, 0, 3400, 3400, 0, '2026-10-25', datetime('now', '-5 days'), ?)
    `).run(
      bill0Id, soc1Id, hh1Id, mem1Id, admin1Id,
      bill1Id, soc1Id, hh1Id, mem1Id, admin1Id,
      bill2Id, soc1Id, hh2Id, mem2Id, admin1Id,
      bill3Id, soc1Id, hh3Id, mem3Id, admin1Id
    );

    const insertItem = db.prepare(`
      INSERT INTO bill_items (id, society_id, bill_id, household_id, charge_category_id, category_name, billing_month, billing_year, description, amount, is_adjustment)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    `);
    for (const [bId, hhId, m, y] of [
      [bill0Id, hh1Id, 9, 2026],
      [bill1Id, hh1Id, 10, 2026],
      [bill2Id, hh2Id, 10, 2026],
      [bill3Id, hh3Id, 10, 2026],
    ] as const) {
      insertItem.run(uuid(), soc1Id, bId, hhId, maintCat.id, maintCat.name, m, y, 'Monthly Maintenance Charges', 2500);
      insertItem.run(uuid(), soc1Id, bId, hhId, waterCat.id, waterCat.name, m, y, 'Water Supply Charges', 400);
      insertItem.run(uuid(), soc1Id, bId, hhId, secCat.id, secCat.name, m, y, '24x7 Security Charges', 500);
    }

    // Confirmed payments for A-101 (Sep) and B-201 (Oct) + Pending Verification payment for A-102 (Oct)
    const pay0Id = 'pay-gvr-sep-a101';
    const pay2Id = 'pay-gvr-oct-a102-pending';
    const pay3Id = 'pay-gvr-oct-b201-confirmed';

    db.prepare(`
      INSERT INTO payments (
        id, society_id, household_id, member_id, payment_method, amount, payment_date,
        reference_number, status, verification_notes, verified_by, verified_at, ledger_posted
      ) VALUES
      (?, ?, ?, ?, 'UPI', 3400, '2026-09-08', 'UPI-425188992011', 'CONFIRMED', 'Verified against HDFC bank statement', ?, datetime('now', '-38 days'), 1),
      (?, ?, ?, ?, 'GPAY_UPI', 3400, '2026-10-16', 'GPAY-628910443120', 'PENDING_VERIFICATION', NULL, NULL, NULL, 0),
      (?, ?, ?, ?, 'RAZORPAY', 3400, '2026-10-14', 'pay_OctB201Rzp991', 'CONFIRMED', 'Verified via Razorpay settlement', ?, datetime('now', '-3 days'), 1)
    `).run(
      pay0Id, soc1Id, hh1Id, mem1Id, admin1Id,
      pay2Id, soc1Id, hh2Id, mem2Id,
      pay3Id, soc1Id, hh3Id, mem3Id, admin1Id
    );

    db.prepare(`
      INSERT INTO payment_allocations (id, society_id, payment_id, bill_id, allocated_amount)
      VALUES
      (?, ?, ?, ?, 3400),
      (?, ?, ?, ?, 3400),
      (?, ?, ?, ?, 3400)
    `).run(
      uuid(), soc1Id, pay0Id, bill0Id,
      uuid(), soc1Id, pay2Id, bill2Id,
      uuid(), soc1Id, pay3Id, bill3Id
    );

    db.prepare(`
      INSERT INTO payment_receipts (id, society_id, payment_id, receipt_number, issued_to_name, flat_number, amount, payment_method, reference_number, issued_by)
      VALUES
      (?, ?, ?, 'RCP-GVR-2026-0001', 'Manpreet Singh Brar', 'A-101', 3400, 'UPI', 'UPI-425188992011', ?),
      (?, ?, ?, 'RCP-GVR-2026-0002', 'Rajesh Kumar Sharma', 'B-201', 3400, 'RAZORPAY', 'pay_OctB201Rzp991', ?)
    `).run(
      uuid(), soc1Id, pay0Id, admin1Id,
      uuid(), soc1Id, pay3Id, admin1Id
    );

    // Ledger entries for confirmed payments + sample expense
    db.prepare(`
      INSERT INTO ledger_entries (
        id, society_id, transaction_code, entry_date, entry_type, account_type, category,
        description, amount, direction, reference_type, reference_id, household_id, flat_number, member_id, payment_method, created_by
      ) VALUES
      (?, ?, 'TXN-GVR-2026-0001', '2026-09-08', 'INCOME', 'BANK', 'Maintenance Collection', 'Bill payment RCP-GVR-2026-0001 (Flat A-101)', 3400, 'CREDIT', 'PAYMENT', ?, ?, 'A-101', ?, 'UPI', ?),
      (?, ?, 'TXN-GVR-2026-0002', '2026-10-14', 'INCOME', 'BANK', 'Maintenance Collection', 'Bill payment RCP-GVR-2026-0002 (Flat B-201)', 3400, 'CREDIT', 'PAYMENT', ?, ?, 'B-201', ?, 'RAZORPAY', ?)
    `).run(
      uuid(), soc1Id, pay0Id, hh1Id, mem1Id, admin1Id,
      uuid(), soc1Id, pay3Id, hh3Id, mem3Id, admin1Id
    );

    const expCatSec = db.prepare("SELECT id, name FROM expense_categories WHERE society_id = ? AND name = 'Security Services & Guards'").get(soc1Id) as { id: string; name: string };
    const exp1Id = 'exp-gvr-oct-01';
    db.prepare(`
      INSERT INTO expenses (
        id, society_id, expense_category_id, category_name, description, amount, expense_date,
        payment_method, account_type, vendor_name, status, entered_by, approved_by
      ) VALUES (?, ?, ?, ?, 'Main Gate Security Guard Duty Settlement (First Half Oct)', 1800, '2026-10-15', 'BANK_TRANSFER', 'BANK', 'ShieldForce Security Pvt Ltd', 'APPROVED', ?, ?)
    `).run(exp1Id, soc1Id, expCatSec.id, expCatSec.name, admin1Id, admin1Id);

    db.prepare(`
      INSERT INTO ledger_entries (
        id, society_id, transaction_code, entry_date, entry_type, account_type, category,
        description, amount, direction, reference_type, reference_id, payment_method, created_by
      ) VALUES (?, ?, 'TXN-GVR-2026-0003', '2026-10-15', 'EXPENSE', 'BANK', ?, 'Main Gate Security Guard Duty Settlement (First Half Oct)', 1800, 'DEBIT', 'EXPENSE', ?, 'BANK_TRANSFER', ?)
    `).run(uuid(), soc1Id, expCatSec.name, exp1Id, admin1Id);

    // Update Society 1 Bank & Cash account balances
    db.prepare("UPDATE financial_accounts SET opening_balance = 25000, current_balance = 30000 WHERE society_id = ? AND account_type = 'BANK'").run(soc1Id);
    db.prepare("UPDATE financial_accounts SET opening_balance = 5000, current_balance = 5000 WHERE society_id = ? AND account_type = 'CASH'").run(soc1Id);

    // Sample Complaint, Suggestion, Event, Announcement in Society 1
    const comp1Id = 'comp-gvr-001';
    db.prepare(`
      INSERT INTO complaints (
        id, society_id, complaint_number, household_id, member_id, flat_number,
        title, category, description, priority, status, assigned_staff_id
      ) VALUES (?, ?, 'CMP-GVR-1001', ?, ?, 'A-101', 'Low water pressure in Block A morning supply', 'Water supply', 'Water pressure on 1st floor has been low between 7 AM and 8:30 AM for the past two days.', 'HIGH', 'IN_PROGRESS', ?)
    `).run(comp1Id, soc1Id, hh1Id, mem1Id, staffMaintId);

    db.prepare(`
      INSERT INTO complaint_comments (id, society_id, complaint_id, author_user_id, author_name, comment_text, is_internal)
      VALUES (?, ?, ?, ?, 'Harpreet Singh Gill (RWA President)', 'Assigned Plumber Rameshwar Prasad to inspect Block A overhead booster valve today.', 0)
    `).run(uuid(), soc1Id, comp1Id, admin1Id);

    db.prepare(`
      INSERT INTO suggestions (id, society_id, household_id, member_id, flat_number, title, description, status, admin_response, responded_by, responded_at)
      VALUES (?, ?, ?, ?, 'A-101', 'Install EV Charging Point in Visitor Parking Zone', 'Many residents are buying electric two-wheelers and cars. A shared metered EV charging bay would benefit everyone.', 'ACKNOWLEDGED', 'Great suggestion! Added to the agenda for the upcoming General Body Meeting.', ?, datetime('now', '-2 days'))
    `).run(uuid(), soc1Id, hh1Id, mem1Id, admin1Id);

    db.prepare(`
      INSERT INTO society_events (id, society_id, event_type, title, description, event_date, event_time, venue, publication_status, created_by)
      VALUES
      (?, ?, 'MEETING', 'Annual General Body Meeting (AGM) 2026', 'Review of annual society accounts, security upgrade approval, and solar rooftop proposal.', '2026-10-25', '11:00 AM', 'Society Community Hall, Block A', 'PUBLISHED', ?),
      (?, ?, 'FESTIVAL', 'Grand Diwali & Bandi Chhor Divas Mela', 'Cultural evening, langar, lights competition, and community dinner for all residents.', '2026-11-01', '06:30 PM', 'Central Lawn & Amphitheatre', 'PUBLISHED', ?)
    `).run(uuid(), soc1Id, admin1Id, uuid(), soc1Id, admin1Id);

    db.prepare(`
      INSERT INTO announcements (id, society_id, category, title, content, publication_status, send_email, created_by)
      VALUES
      (?, ?, 'WATER_INTERRUPTION', 'Overhead Water Tank Cleaning Schedule — Block A & B', 'Overhead water tanks will be hygienically cleaned on Sunday from 10:00 AM to 01:00 PM. Please store water accordingly.', 'PUBLISHED', 1, ?),
      (?, ?, 'SECURITY_ALERT', 'Mandatory Sticker Verification for Resident Vehicles', 'All residents are requested to collect their 2026 RFID vehicle stickers from the RWA office between 9 AM and 5 PM.', 'PUBLISHED', 1, ?)
    `).run(uuid(), soc1Id, admin1Id, uuid(), soc1Id, admin1Id);
  }

  // Ensure demo societies have an illustrative Super Admin Subscription Renewal / Payment Due notice if none exists yet
  sendNotification({
    societyId: 'soc-royal-palms',
    userId: 'user-admin-royal-palms',
    notificationType: 'SUBSCRIPTION_PAYMENT_DUE',
    title: 'Subscription Payment Due for Approval — Growth Quarterly Plan (₹6,488.82)',
    message: 'Super Admin Notice: Your society free trial is ending in 11 days. Please complete your subscription payment of ₹6,488.82 (₹5,499 + 18% GST) for continued active approval and uninterrupted portal access.',
    channel: 'IN_APP',
    dedupKey: 'seed:sub-due:soc-royal-palms',
  });

  // Dues notifications are generated only when <= 30 days remain to renewal.
  // soc-green-valley has 335 days remaining, so it has an active confirmed subscription.
  sendNotification({
    societyId: 'soc-green-valley',
    userId: 'user-admin-green-valley',
    notificationType: 'SUBSCRIPTION_PAYMENT_CONFIRMED',
    title: 'Enterprise Annual Subscription Active & Verified',
    message: 'Super Admin Notice: Your Enterprise Annual RWA Suite subscription is active and fully approved. Next renewal is scheduled in 335 days.',
    channel: 'IN_APP',
    dedupKey: 'seed:sub-active:soc-green-valley',
  });
}
