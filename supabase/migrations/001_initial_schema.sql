-- ============================================================================
-- Migration: 001_initial_schema.sql
-- Project: Multi-Tenant Society Management Software SaaS Platform
-- Engine: PostgreSQL 15+ / Supabase (with Row-Level Security & Tenant Isolation)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. CORE IDENTITY & PLATFORM TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(30) NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(30) NOT NULL CHECK (role IN ('SUPER_ADMIN', 'SOCIETY_ADMIN', 'STAFF', 'MEMBER')),
    society_id UUID NULL, -- NULL only for SUPER_ADMIN
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    reset_token_hash TEXT NULL,
    reset_token_expires_at TIMESTAMPTZ NULL,
    last_login_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    society_id UUID NULL,
    full_name VARCHAR(200) NOT NULL,
    avatar_url TEXT NULL,
    preferred_language VARCHAR(10) NOT NULL DEFAULT 'en' CHECK (preferred_language IN ('en', 'pa')),
    address TEXT NULL,
    emergency_contact_name VARCHAR(200) NULL,
    emergency_contact_phone VARCHAR(30) NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 2. SUBSCRIPTION PLANS & PLATFORM CONFIGURATION
-- ============================================================================

CREATE TABLE IF NOT EXISTS subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(120) NOT NULL,
    description TEXT NULL,
    billing_period VARCHAR(30) NOT NULL CHECK (billing_period IN ('MONTHLY', 'QUARTERLY', 'ANNUAL', 'CUSTOM')),
    duration_days INTEGER NOT NULL CHECK (duration_days > 0),
    price_amount NUMERIC(12, 2) NOT NULL CHECK (price_amount >= 0),
    tax_percent NUMERIC(5, 2) NOT NULL DEFAULT 18.00,
    max_households INTEGER NOT NULL DEFAULT 500,
    trial_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    trial_days INTEGER NOT NULL DEFAULT 14,
    grace_period_days INTEGER NOT NULL DEFAULT 7,
    auto_approve_after_payment BOOLEAN NOT NULL DEFAULT TRUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 3. SOCIETIES & TENANT SETTINGS
-- ============================================================================

CREATE TABLE IF NOT EXISTS societies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(120) NOT NULL UNIQUE,
    enrollment_code VARCHAR(80) NOT NULL UNIQUE,
    logo_url TEXT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL DEFAULT '',
    state VARCHAR(100) NOT NULL DEFAULT 'Punjab',
    pincode VARCHAR(20) NOT NULL DEFAULT '',
    contact_email VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(30) NOT NULL,
    registration_number VARCHAR(100) NULL,
    admin_user_id UUID NULL REFERENCES users(id) ON DELETE SET NULL,
    subscription_plan_id UUID NULL REFERENCES subscription_plans(id),
    subscription_status VARCHAR(30) NOT NULL DEFAULT 'TRIAL'
        CHECK (subscription_status IN ('TRIAL', 'ACTIVE', 'GRACE_PERIOD', 'EXPIRED', 'PENDING_PAYMENT', 'SUSPENDED')),
    approval_status VARCHAR(30) NOT NULL DEFAULT 'PENDING'
        CHECK (approval_status IN ('PENDING', 'APPROVED', 'REJECTED')),
    account_status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE'
        CHECK (account_status IN ('ACTIVE', 'SUSPENDED', 'ARCHIVED')),
    payment_status VARCHAR(30) NOT NULL DEFAULT 'TRIAL'
        CHECK (payment_status IN ('TRIAL', 'PAID', 'PENDING', 'FAILED', 'OVERDUE', 'REFUNDED')),
    trial_starts_at TIMESTAMPTZ NULL,
    trial_ends_at TIMESTAMPTZ NULL,
    subscription_starts_at TIMESTAMPTZ NULL,
    subscription_ends_at TIMESTAMPTZ NULL,
    grace_period_ends_at TIMESTAMPTZ NULL,
    is_demo BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE users
    ADD CONSTRAINT fk_users_society
    FOREIGN KEY (society_id) REFERENCES societies(id) ON DELETE CASCADE;

CREATE TABLE IF NOT EXISTS society_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    society_id UUID NOT NULL UNIQUE REFERENCES societies(id) ON DELETE CASCADE,
    upi_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    gpay_upi_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    paytm_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    razorpay_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    bank_transfer_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    upi_id VARCHAR(150) NULL,
    upi_payee_name VARCHAR(200) NULL,
    upi_qr_url TEXT NULL,
    bank_name VARCHAR(200) NULL,
    bank_account_number VARCHAR(80) NULL,
    bank_ifsc VARCHAR(30) NULL,
    razorpay_key_id VARCHAR(150) NULL,
    razorpay_key_secret_encrypted TEXT NULL,
    bill_due_day INTEGER NOT NULL DEFAULT 10 CHECK (bill_due_day BETWEEN 1 AND 28),
    late_fee_amount NUMERIC(10, 2) NOT NULL DEFAULT 100.00,
    allow_member_staff_contacts BOOLEAN NOT NULL DEFAULT TRUE,
    custom_enrollment_fields JSONB NOT NULL DEFAULT '[]'::jsonb,
    email_notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    sms_notifications_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    whatsapp_notifications_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    brand_primary_color VARCHAR(20) NOT NULL DEFAULT '#0f766e',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS society_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    society_id UUID NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES subscription_plans(id),
    status VARCHAR(30) NOT NULL CHECK (status IN ('TRIAL', 'ACTIVE', 'EXPIRED', 'CANCELLED', 'PENDING_PAYMENT')),
    starts_at TIMESTAMPTZ NOT NULL,
    ends_at TIMESTAMPTZ NOT NULL,
    is_trial BOOLEAN NOT NULL DEFAULT FALSE,
    extended_reason TEXT NULL,
    extended_by UUID NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subscription_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    society_id UUID NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
    subscription_id UUID NULL REFERENCES society_subscriptions(id) ON DELETE SET NULL,
    plan_id UUID NOT NULL REFERENCES subscription_plans(id),
    invoice_number VARCHAR(80) NOT NULL UNIQUE,
    amount NUMERIC(12, 2) NOT NULL,
    tax_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    total_amount NUMERIC(12, 2) NOT NULL,
    payment_gateway VARCHAR(40) NOT NULL DEFAULT 'RAZORPAY',
    gateway_order_id VARCHAR(120) NULL,
    gateway_payment_id VARCHAR(120) NULL,
    gateway_signature TEXT NULL,
    verified_by_webhook BOOLEAN NOT NULL DEFAULT FALSE,
    verified_by_user_id UUID NULL REFERENCES users(id),
    status VARCHAR(30) NOT NULL CHECK (status IN ('CREATED', 'PAID', 'FAILED', 'CANCELLED', 'REFUNDED')),
    refund_reason TEXT NULL,
    paid_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 4. APARTMENT BLOCKS, HOUSEHOLDS & SOCIETY MEMBERS (DUPLICATE FLAT PREVENTION)
-- ============================================================================

CREATE TABLE IF NOT EXISTS apartment_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    society_id UUID NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
    name VARCHAR(80) NOT NULL,
    total_floors INTEGER NOT NULL DEFAULT 10,
    description TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (society_id, name)
);

CREATE TABLE IF NOT EXISTS households (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    society_id UUID NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
    block_id UUID NULL REFERENCES apartment_blocks(id) ON DELETE SET NULL,
    block_name VARCHAR(80) NOT NULL DEFAULT 'A',
    floor_number VARCHAR(30) NOT NULL DEFAULT '1',
    flat_number VARCHAR(80) NOT NULL,
    normalized_flat_number VARCHAR(80) NOT NULL,
    occupancy_type VARCHAR(30) NOT NULL DEFAULT 'OWNER' CHECK (occupancy_type IN ('OWNER', 'TENANT', 'VACANT')),
    area_sqft NUMERIC(10, 2) NOT NULL DEFAULT 1200,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('PENDING', 'ACTIVE', 'BLOCKED', 'ARCHIVED')),
    primary_member_id UUID NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- CRITICAL UNIQUENESS RULE: Prevent duplicate active/pending/blocked registrations
-- for the same normalized flat/house number within the same society.
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_household_per_society
    ON households (society_id, normalized_flat_number)
    WHERE status <> 'ARCHIVED';

CREATE TABLE IF NOT EXISTS society_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    society_id UUID NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
    household_id UUID NOT NULL REFERENCES households(id) ON DELETE RESTRICT,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    full_name VARCHAR(200) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    photo_url TEXT NULL,
    relationship_to_primary VARCHAR(50) NOT NULL DEFAULT 'PRIMARY',
    is_primary_member BOOLEAN NOT NULL DEFAULT TRUE,
    ownership_type VARCHAR(30) NOT NULL DEFAULT 'OWNER' CHECK (ownership_type IN ('OWNER', 'TENANT', 'FAMILY')),
    emergency_contact VARCHAR(200) NULL,
    custom_fields JSONB NOT NULL DEFAULT '{}'::jsonb,
    approval_status VARCHAR(30) NOT NULL DEFAULT 'APPROVED' CHECK (approval_status IN ('PENDING', 'APPROVED', 'REJECTED')),
    account_status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE' CHECK (account_status IN ('ACTIVE', 'BLOCKED', 'ARCHIVED')),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS member_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    society_id UUID NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
    token VARCHAR(120) NOT NULL UNIQUE,
    email VARCHAR(255) NULL,
    phone VARCHAR(30) NULL,
    flat_number VARCHAR(80) NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ NULL,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 5. MONTHLY BILLING, CHARGE CATEGORIES & DUPLICATE BILL PREVENTION
-- ============================================================================

CREATE TABLE IF NOT EXISTS charge_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    society_id UUID NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    code VARCHAR(80) NOT NULL,
    description TEXT NULL,
    default_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    billing_frequency VARCHAR(30) NOT NULL DEFAULT 'MONTHLY'
        CHECK (billing_frequency IN ('MONTHLY', 'QUARTERLY', 'ANNUAL', 'ONE_TIME')),
    applicable_flats VARCHAR(50) NOT NULL DEFAULT 'ALL', -- 'ALL' or comma-separated normalized flats
    due_day INTEGER NOT NULL DEFAULT 10,
    is_Single_charge_per_period BOOLEAN NOT NULL DEFAULT TRUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (society_id, code)
);

CREATE TABLE IF NOT EXISTS member_bills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    society_id UUID NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
    household_id UUID NOT NULL REFERENCES households(id) ON DELETE RESTRICT,
    member_id UUID NULL REFERENCES society_members(id) ON DELETE SET NULL,
    bill_number VARCHAR(80) NOT NULL UNIQUE,
    billing_month INTEGER NOT NULL CHECK (billing_month BETWEEN 1 AND 12),
    billing_year INTEGER NOT NULL CHECK (billing_year BETWEEN 2020 AND 2100),
    bill_type VARCHAR(30) NOT NULL DEFAULT 'REGULAR'
        CHECK (bill_type IN ('REGULAR', 'SUPPLEMENTARY', 'ADJUSTMENT')),
    adjustment_reason TEXT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PUBLISHED'
        CHECK (status IN ('DRAFT', 'PUBLISHED', 'UNPAID', 'PAYMENT_SUBMITTED', 'PENDING_VERIFICATION', 'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED')),
    subtotal_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    previous_Read_balance NUMERIC(12, 2) NOT NULL DEFAULT 0,
    penalty_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    credit_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    paid_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    balance_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    due_date DATE NOT NULL,
    issued_at TIMESTAMPTZ NULL,
    created_by UUID NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Prevent duplicate REGULAR bills for the same household & period
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_regular_bill_per_household_period
    ON member_bills (society_id, household_id, billing_month, billing_year)
    WHERE bill_type = 'REGULAR' AND status <> 'CANCELLED';

CREATE TABLE IF NOT EXISTS bill_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    society_id UUID NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
    bill_id UUID NOT NULL REFERENCES member_bills(id) ON DELETE CASCADE,
    household_id UUID NOT NULL REFERENCES households(id) ON DELETE RESTRICT,
    charge_category_id UUID NOT NULL REFERENCES charge_categories(id) ON DELETE RESTRICT,
    category_name VARCHAR(150) NOT NULL,
    billing_month INTEGER NOT NULL,
    billing_year INTEGER NOT NULL,
    description TEXT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    is_adjustment BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- CRITICAL DUPLICATE BILL CHARGE PREVENTION:
-- Prevent duplicate standard charges for the same flat, billing period, and charge category
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_charge_per_flat_period
    ON bill_items (society_id, household_id, billing_month, billing_year, charge_category_id)
    WHERE is_adjustment = FALSE;

CREATE TABLE IF NOT EXISTS bill_adjustments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    society_id UUID NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
    bill_id UUID NOT NULL REFERENCES member_bills(id) ON DELETE CASCADE,
    adjustment_type VARCHAR(30) NOT NULL CHECK (adjustment_type IN ('CREDIT', 'DEBIT', 'PENALTY_WAIVER', 'SUPPLEMENTARY')),
    amount NUMERIC(12, 2) NOT NULL,
    reason TEXT NOT NULL,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 6. MEMBER PAYMENTS, ALLOCATIONS & RECEIPTS (IDEMPOTENT VERIFICATION)
-- ============================================================================

CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    society_id UUID NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
    household_id UUID NOT NULL REFERENCES households(id) ON DELETE RESTRICT,
    member_id UUID NOT NULL REFERENCES society_members(id) ON DELETE RESTRICT,
    payment_method VARCHAR(40) NOT NULL
        CHECK (payment_method IN ('UPI', 'GPAY_UPI', 'PAYTM', 'RAZORPAY', 'BANK_TRANSFER', 'CASH', 'OTHER')),
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    payment_date DATE NOT NULL,
    reference_number VARCHAR(150) NOT NULL,
    proof_url TEXT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING_VERIFICATION'
        CHECK (status IN ('PAYMENT_SUBMITTED', 'PENDING_VERIFICATION', 'CONFIRMED', 'REJECTED', 'PARTIALLY_PAID', 'REFUNDED')),
    verification_notes TEXT NULL,
    verified_by UUID NULL REFERENCES users(id),
    verified_at TIMESTAMPTZ NULL,
    ledger_posted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payment_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    society_id UUID NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
    payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    bill_id UUID NOT NULL REFERENCES member_bills(id) ON DELETE RESTRICT,
    allocated_amount NUMERIC(12, 2) NOT NULL CHECK (allocated_amount > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (payment_id, bill_id)
);

CREATE TABLE IF NOT EXISTS payment_receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    society_id UUID NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
    payment_id UUID NOT NULL UNIQUE REFERENCES payments(id) ON DELETE RESTRICT,
    receipt_number VARCHAR(80) NOT NULL UNIQUE,
    issued_to_name VARCHAR(200) NOT NULL,
    flat_number VARCHAR(80) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    payment_method VARCHAR(40) NOT NULL,
    reference_number VARCHAR(150) NOT NULL,
    issued_by UUID NULL REFERENCES users(id),
    issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 7. STAFF, ROLES, PERMISSIONS, DUTY & ATTENDANCE
-- ============================================================================

CREATE TABLE IF NOT EXISTS staff_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    society_id UUID NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
    name VARCHAR(120) NOT NULL,
    is_office_bearer BOOLEAN NOT NULL DEFAULT FALSE,
    is_system_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (society_id, name)
);

CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    society_id UUID NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
    role_id UUID NOT NULL UNIQUE REFERENCES staff_roles(id) ON DELETE CASCADE,
    view_members BOOLEAN NOT NULL DEFAULT FALSE,
    manage_members BOOLEAN NOT NULL DEFAULT FALSE,
    generate_bills BOOLEAN NOT NULL DEFAULT FALSE,
    verify_payments BOOLEAN NOT NULL DEFAULT FALSE,
    manage_expenses BOOLEAN NOT NULL DEFAULT FALSE,
    view_financial_reports BOOLEAN NOT NULL DEFAULT FALSE,
    manage_complaints BOOLEAN NOT NULL DEFAULT FALSE,
    manage_events BOOLEAN NOT NULL DEFAULT FALSE,
    manage_staff BOOLEAN NOT NULL DEFAULT FALSE,
    change_society_settings BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    society_id UUID NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
    user_id UUID NULL REFERENCES users(id) ON DELETE SET NULL,
    role_id UUID NOT NULL REFERENCES staff_roles(id) ON DELETE RESTRICT,
    full_name VARCHAR(200) NOT NULL,
    photo_url TEXT NULL,
    phone VARCHAR(30) NOT NULL,
    email VARCHAR(255) NULL,
    address TEXT NULL,
    designation VARCHAR(120) NOT NULL,
    joining_date DATE NOT NULL,
    wage_type VARCHAR(30) NOT NULL DEFAULT 'MONTHLY' CHECK (wage_type IN ('MONTHLY', 'DAILY')),
    salary_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    employment_status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE' CHECK (employment_status IN ('ACTIVE', 'INACTIVE', 'TERMINATED')),
    is_on_duty BOOLEAN NOT NULL DEFAULT FALSE,
    duty_schedule VARCHAR(200) NULL,
    assigned_duties TEXT NULL,
    show_contact_to_members BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS staff_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    society_id UUID NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
    staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    document_type VARCHAR(80) NOT NULL, -- 'AADHAAR', 'PAN', 'POLICE_VERIFICATION', 'OTHER'
    masked_document_number VARCHAR(80) NOT NULL, -- Masked (e.g., XXXX-XXXX-1234), never publicly exposed
    document_url TEXT NOT NULL,
    uploaded_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS staff_duty_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    society_id UUID NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
    staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    duty_status VARCHAR(20) NOT NULL CHECK (duty_status IN ('ON_DUTY', 'OFF_DUTY')),
    shift_notes TEXT NULL,
    changed_by UUID NULL REFERENCES users(id),
    changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    society_id UUID NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
    staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('PRESENT', 'ABSENT', 'HALF_DAY', 'LEAVE')),
    check_in_time VARCHAR(30) NULL,
    check_out_time VARCHAR(30) NULL,
    salary_paid NUMERIC(12, 2) NOT NULL DEFAULT 0,
    notes TEXT NULL,
    recorded_by UUID NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (society_id, staff_id, attendance_date)
);

-- ============================================================================
-- 8. COMPLAINTS, SUGGESTIONS, EVENTS & ANNOUNCEMENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS complaints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    society_id UUID NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
    complaint_number VARCHAR(60) NOT NULL UNIQUE,
    household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES society_members(id) ON DELETE CASCADE,
    flat_number VARCHAR(80) NOT NULL,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(80) NOT NULL,
    description TEXT NOT NULL,
    priority VARCHAR(20) NOT NULL DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
    status VARCHAR(30) NOT NULL DEFAULT 'SUBMITTED'
        CHECK (status IN ('SUBMITTED', 'IN_PROGRESS', 'RESOLVED', 'REJECTED')),
    assigned_staff_id UUID NULL REFERENCES staff(id) ON DELETE SET NULL,
    resolution_notes TEXT NULL,
    resolution_image_url TEXT NULL,
    resolved_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS complaint_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    society_id UUID NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
    complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_type VARCHAR(50) NOT NULL DEFAULT 'image/png',
    uploaded_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS complaint_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    society_id UUID NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
    complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    author_user_id UUID NOT NULL REFERENCES users(id),
    author_name VARCHAR(200) NOT NULL,
    comment_text TEXT NOT NULL,
    is_internal BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    society_id UUID NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
    household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES society_members(id) ON DELETE CASCADE,
    flat_number VARCHAR(80) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'SUBMITTED' CHECK (status IN ('SUBMITTED', 'UNDER_REVIEW', 'ACKNOWLEDGED', 'IMPLEMENTED')),
    admin_response TEXT NULL,
    responded_by UUID NULL REFERENCES users(id),
    responded_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS society_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    society_id UUID NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
    event_type VARCHAR(60) NOT NULL DEFAULT 'GENERAL',
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    event_date DATE NOT NULL,
    event_time VARCHAR(40) NOT NULL,
    venue VARCHAR(200) NOT NULL,
    image_url TEXT NULL,
    publication_status VARCHAR(20) NOT NULL DEFAULT 'PUBLISHED' CHECK (publication_status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED')),
    created_by UUID NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    society_id UUID NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
    category VARCHAR(60) NOT NULL DEFAULT 'GENERAL'
        CHECK (category IN ('MEETING', 'FESTIVAL', 'MAINTENANCE', 'EMERGENCY', 'WATER_INTERRUPTION', 'SECURITY_ALERT', 'GENERAL')),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT NULL,
    publication_status VARCHAR(20) NOT NULL DEFAULT 'PUBLISHED' CHECK (publication_status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED')),
    send_email BOOLEAN NOT NULL DEFAULT TRUE,
    created_by UUID NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 9. ACCOUNTING, EXPENSES, FINANCIAL ACCOUNTS & IMMUTABLE LEDGER
-- ============================================================================

CREATE TABLE IF NOT EXISTS financial_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    society_id UUID NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
    account_type VARCHAR(20) NOT NULL CHECK (account_type IN ('CASH', 'BANK')),
    account_name VARCHAR(150) NOT NULL,
    opening_balance NUMERIC(14, 2) NOT NULL DEFAULT 0,
    current_balance NUMERIC(14, 2) NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (society_id, account_type)
);

CREATE TABLE IF NOT EXISTS expense_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    society_id UUID NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    description TEXT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (society_id, name)
);

CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    society_id UUID NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
    expense_category_id UUID NOT NULL REFERENCES expense_categories(id) ON DELETE RESTRICT,
    category_name VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    expense_date DATE NOT NULL,
    payment_method VARCHAR(40) NOT NULL,
    account_type VARCHAR(20) NOT NULL CHECK (account_type IN ('CASH', 'BANK')),
    vendor_name VARCHAR(200) NOT NULL,
    invoice_url TEXT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'APPROVED' CHECK (status IN ('APPROVED', 'REVERSED')),
    entered_by UUID NOT NULL REFERENCES users(id),
    approved_by UUID NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ledger_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    society_id UUID NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
    transaction_code VARCHAR(80) NOT NULL UNIQUE,
    entry_date DATE NOT NULL,
    entry_type VARCHAR(30) NOT NULL
        CHECK (entry_type IN ('INCOME', 'EXPENSE', 'TRANSFER', 'RECEIVABLE', 'LIABILITY', 'REFUND', 'REVERSAL', 'ADJUSTMENT')),
    account_type VARCHAR(20) NOT NULL CHECK (account_type IN ('CASH', 'BANK', 'RECEIVABLE', 'NONE')),
    category VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    direction VARCHAR(10) NOT NULL CHECK (direction IN ('CREDIT', 'DEBIT')),
    reference_type VARCHAR(40) NOT NULL, -- 'PAYMENT', 'EXPENSE', 'BILL', 'REVERSAL', 'ADJUSTMENT'
    reference_id UUID NOT NULL,
    household_id UUID NULL REFERENCES households(id) ON DELETE SET NULL,
    flat_number VARCHAR(80) NULL,
    member_id UUID NULL REFERENCES society_members(id) ON DELETE SET NULL,
    payment_method VARCHAR(40) NULL,
    reversal_of_entry_id UUID NULL REFERENCES ledger_entries(id),
    created_by UUID NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (society_id, reference_type, reference_id, entry_type)
);

-- ============================================================================
-- 10. NOTIFICATIONS & AUDIT LOGS
-- ============================================================================

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    society_id UUID NULL REFERENCES societies(id) ON DELETE CASCADE,
    user_id UUID NULL REFERENCES users(id) ON DELETE CASCADE,
    notification_type VARCHAR(60) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    channel VARCHAR(30) NOT NULL DEFAULT 'IN_APP' CHECK (channel IN ('IN_APP', 'EMAIL', 'SMS', 'WHATSAPP')),
    dedup_key VARCHAR(200) NULL UNIQUE,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    society_id UUID NULL REFERENCES societies(id) ON DELETE CASCADE,
    actor_user_id UUID NULL REFERENCES users(id) ON DELETE SET NULL,
    actor_role VARCHAR(40) NOT NULL,
    action VARCHAR(120) NOT NULL,
    entity_type VARCHAR(80) NOT NULL,
    entity_id VARCHAR(120) NULL,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    ip_address VARCHAR(60) NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 11. ROW-LEVEL SECURITY (RLS) POLICIES FOR STRICT TENANT ISOLATION
-- ============================================================================

ALTER TABLE societies ENABLE ROW LEVEL SECURITY;
ALTER TABLE society_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE apartment_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE society_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE charge_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE society_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_entries ENABLE ROW LEVEL SECURITY;

-- Helper function to extract current user's society_id and role from JWT claims
CREATE OR REPLACE FUNCTION app_current_society_id() RETURNS UUID AS $$
    SELECT NULLIF(current_setting('request.jwt.claim.society_id', true), '')::UUID;
$$ LANGUAGE SQL STABLE;

CREATE OR REPLACE FUNCTION app_current_role() RETURNS TEXT AS $$
    SELECT COALESCE(current_setting('request.jwt.claim.role', true), '');
$$ LANGUAGE SQL STABLE;

-- Tenant Isolation Policy Template applied across society-scoped tables
CREATE POLICY tenant_isolation_households ON households
    USING (app_current_role() = 'SUPER_ADMIN' OR society_id = app_current_society_id());

CREATE POLICY tenant_isolation_members ON society_members
    USING (app_current_role() = 'SUPER_ADMIN' OR society_id = app_current_society_id());

CREATE POLICY tenant_isolation_bills ON member_bills
    USING (app_current_role() = 'SUPER_ADMIN' OR society_id = app_current_society_id());

CREATE POLICY tenant_isolation_payments ON payments
    USING (app_current_role() = 'SUPER_ADMIN' OR society_id = app_current_society_id());

CREATE POLICY tenant_isolation_ledger ON ledger_entries
    USING (app_current_role() = 'SUPER_ADMIN' OR society_id = app_current_society_id());
