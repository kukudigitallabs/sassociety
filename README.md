# SocietyOS — Multi-Tenant Society Management Software SaaS Platform

A production-ready, multi-tenant **Society Management Software SaaS Platform** built for residential societies, apartments, housing colonies, and Resident Welfare Associations (RWAs).

## Architecture & Technology Stack

- **Frontend**: React 19, TypeScript, Vite 6, Modern CSS (`@layer`, `:has()`, `:user-invalid`, logical properties, responsive collapsible sidebar, Light/Dark themes, and **English + Punjabi (`ਪੰਜਾਬੀ`)** localization).
- **Backend**: Node.js + TypeScript HTTP REST API with server-side JWT authentication, role-based access control (`SUPER_ADMIN`, `SOCIETY_ADMIN`, `STAFF`, `MEMBER`), granular 10-permission staff role matrix, rate limiting, and HMAC-SHA256 Razorpay payment signature verification.
- **Database**:
  - **PostgreSQL / Supabase Migrations**: Normalized 36-table PostgreSQL DDL schema with Row-Level Security (RLS) policies in [`supabase/migrations/001_initial_schema.sql`](./supabase/migrations/001_initial_schema.sql).
  - **Live Embedded SQL Engine**: Runs out-of-the-box using Node 24's built-in `node:sqlite` (`DatabaseSync`) with WAL mode, foreign keys, partial unique indexes, and ACID transactions stored in `./data/society_saas.db`.

## Key Security & Business Guarantees

1. **Strict Portal & Tenant Separation**:
   - The **Super Admin Control Center** is completely separated from all society portals. Super Admin controls are never shown inside Society Admin, Staff, or Member dashboards, and server middleware blocks cross-role and cross-tenant access (`403 Forbidden`).
2. **Duplicate Flat/House Registration Prevention**:
   - Flat numbers are normalized (`normalizeFlatNumber` — trimmed, uppercased, hyphen-normalized) on both frontend and backend.
   - Enforced by a database-level partial unique index `idx_unique_active_household_per_society ON households (society_id, normalized_flat_number) WHERE status != 'ARCHIVED'`.
   - Duplicate active registrations in the same society return: `"This flat/house number is already registered in this society."`
   - Multiple family members can be linked to an existing household (`FAMILY_MEMBER` mode), and authorized admins can transfer/correct flat registrations through a logged audit workflow.
3. **Duplicate Monthly Bill Prevention**:
   - Enforced by server-side checks and database unique indexes (`idx_unique_regular_bill_per_household_period` and `idx_unique_charge_per_flat_period`).
   - Authorized administrators can issue logged `SUPPLEMENTARY` / `ADJUSTMENT` bills with a mandatory audit reason.
4. **Idempotent Payment Verification & True Accounting Ledger**:
   - Manual/UPI payment submissions remain `PENDING_VERIFICATION` until verified by an administrator or authorized cashier.
   - Repeating the payment confirmation action is idempotent (`UNIQUE (society_id, reference_type, reference_id, entry_type)` on `ledger_entries`) and never creates duplicate ledger entries.
   - Surplus/deficit is calculated strictly from realized income vs. approved expenses (never treating uncollected bills as cash).

## Quick Start & Commands

```bash
# 1. Install dependencies
npm install

# 2. Copy environment template (optional for custom config)
cp .env.example .env

# 3. Run the automated Acceptance Criteria test suite (Section 22)
npm test

# 4. Build production frontend bundle
npm run build

# 5. Start the full-stack server (http://localhost:4000)
npm start
```

## Sample / Demo Accounts (Isolated from Production Records)

| Account Level | Email | Password | Portal Scope |
| :--- | :--- | :--- | :--- |
| **Super Admin (SaaS Owner)** | `superadmin@societyos.com` | `SuperAdmin@123` | Platform-wide societies, plans, trials, invoices, settings |
| **Society Admin (Active Paid)** | `admin@greenvalley.com` | `Admin@123` | Green Valley Residency (`GVR-2026`) |
| **Society Admin (14-Day Trial)** | `admin@royalpalms.com` | `Admin@123` | Royal Palms Enclave (`RPE-2026`) |
| **Society Staff (Cashier Role)** | `cashier@greenvalley.com` | `Staff@123` | Permission-scoped staff portal (verify payments) |
| **Resident Member (Flat A-101)** | `resident@greenvalley.com` | `Member@123` | Personal bills, receipts, complaints, live on-duty staff |
