import fs from 'node:fs';
import path from 'node:path';
import { db, initDatabase, seedInitialDataIfEmpty } from '../server/db.ts';

initDatabase();
seedInitialDataIfEmpty();

const TABLES_IN_ORDER = [
  'platform_settings',
  'users',
  'user_profiles',
  'subscription_plans',
  'societies',
  'society_settings',
  'society_subscriptions',
  'subscription_payments',
  'apartment_blocks',
  'households',
  'society_members',
  'member_invitations',
  'charge_categories',
  'member_bills',
  'bill_items',
  'bill_adjustments',
  'payments',
  'payment_allocations',
  'payment_receipts',
  'staff_roles',
  'role_permissions',
  'staff',
  'staff_documents',
  'staff_duty_records',
  'attendance_records',
  'complaints',
  'complaint_attachments',
  'complaint_comments',
  'suggestions',
  'society_events',
  'announcements',
  'financial_accounts',
  'expense_categories',
  'expenses',
  'ledger_entries',
  'notifications',
  'audit_logs',
];

function mapColumnType(colName: string, sqliteType: string): string {
  const upper = (sqliteType || 'TEXT').toUpperCase();
  if (colName === 'id' || colName.endsWith('_id')) {
    return 'VARCHAR(64)';
  }
  if (
    colName === 'email' ||
    colName === 'slug' ||
    colName === 'code' ||
    colName === 'enrollment_code' ||
    colName === 'invoice_number' ||
    colName === 'bill_number' ||
    colName === 'receipt_number' ||
    colName === 'complaint_number' ||
    colName === 'transaction_code' ||
    colName === 'token' ||
    colName === 'dedup_key' ||
    colName === 'normalized_flat_number' ||
    colName === 'flat_number' ||
    colName === 'block_name' ||
    colName === 'role' ||
    colName === 'status' ||
    colName === 'account_type' ||
    colName === 'entry_type' ||
    colName === 'reference_type' ||
    colName === 'attendance_date'
  ) {
    return 'VARCHAR(191)';
  }
  if (colName === 'name' || colName === 'full_name' || colName === 'title' || colName === 'phone' || colName === 'contact_email' || colName === 'contact_phone') {
    return 'VARCHAR(255)';
  }
  if (colName.endsWith('_at') || colName.endsWith('_date')) {
    return 'VARCHAR(64)';
  }
  if (upper.includes('INT')) {
    return 'INT';
  }
  if (upper.includes('REAL') || upper.includes('FLOA') || upper.includes('DOUB')) {
    return 'DECIMAL(14,2)';
  }
  if (colName.includes('url') || colName.includes('template') || colName.includes('description') || colName.includes('message') || colName.includes('content') || colName.includes('details') || colName.includes('fields')) {
    return 'LONGTEXT';
  }
  return 'TEXT';
}

function escapeSqlValue(val: any): string {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number') return Number.isFinite(val) ? String(val) : '0';
  if (typeof val === 'boolean') return val ? '1' : '0';
  const s = String(val)
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\r/g, '\\r')
    .replace(/\n/g, '\\n');
  return `'${s}'`;
}

const lines: string[] = [];
lines.push('-- ============================================================================');
lines.push('-- SocietyOS Multi-Tenant SaaS Platform — Hostinger MySQL 8.0 / MariaDB Schema');
lines.push('-- Import this file directly in Hostinger hPanel -> phpMyAdmin -> Import tab');
lines.push('-- ============================================================================');
lines.push('');
lines.push('SET NAMES utf8mb4;');
lines.push('SET FOREIGN_KEY_CHECKS = 0;');
lines.push('SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";');
lines.push('');

for (const table of TABLES_IN_ORDER) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{
    cid: number;
    name: string;
    type: string;
    notnull: number;
    dflt_value: string | null;
    pk: number;
  }>;

  lines.push(`-- --------------------------------------------------------`);
  lines.push(`-- Table structure for table \`${table}\``);
  lines.push(`-- --------------------------------------------------------`);
  lines.push(`CREATE TABLE IF NOT EXISTS \`${table}\` (`);

  const colDefs: string[] = [];
  let pkCol = 'id';

  for (const col of cols) {
    const mysqlType = mapColumnType(col.name, col.type);
    const nullable = col.pk ? 'NOT NULL' : col.notnull ? 'NOT NULL' : 'NULL';
    let defaultClause = '';

    if (col.dflt_value !== null && !mysqlType.includes('TEXT')) {
      const rawDef = String(col.dflt_value).trim();
      if (rawDef.toLowerCase().includes("datetime('now')")) {
        defaultClause = '';
      } else {
        defaultClause = ` DEFAULT ${rawDef}`;
      }
    }

    if (col.pk) {
      pkCol = col.name;
    }
    colDefs.push(`  \`${col.name}\` ${mysqlType} ${nullable}${defaultClause}`);
  }

  colDefs.push(`  PRIMARY KEY (\`${pkCol}\`)`);

  // Add useful indexes for tenant isolation and lookups
  if (cols.some((c) => c.name === 'society_id')) {
    colDefs.push(`  KEY \`idx_${table}_society_id\` (\`society_id\`)`);
  }
  if (table === 'users') {
    colDefs.push(`  UNIQUE KEY \`uk_users_email\` (\`email\`)`);
  } else if (table === 'societies') {
    colDefs.push(`  UNIQUE KEY \`uk_societies_slug\` (\`slug\`)`);
    colDefs.push(`  UNIQUE KEY \`uk_societies_enrollment_code\` (\`enrollment_code\`)`);
  } else if (table === 'subscription_plans') {
    colDefs.push(`  UNIQUE KEY \`uk_subscription_plans_code\` (\`code\`)`);
  } else if (table === 'subscription_payments') {
    colDefs.push(`  UNIQUE KEY \`uk_subscription_payments_invoice\` (\`invoice_number\`)`);
  } else if (table === 'member_bills') {
    colDefs.push(`  UNIQUE KEY \`uk_member_bills_bill_number\` (\`bill_number\`)`);
  } else if (table === 'payment_receipts') {
    colDefs.push(`  UNIQUE KEY \`uk_payment_receipts_number\` (\`receipt_number\`)`);
  } else if (table === 'ledger_entries') {
    colDefs.push(`  UNIQUE KEY \`uk_ledger_entries_txn_code\` (\`transaction_code\`)`);
  }

  lines.push(colDefs.join(',\n'));
  lines.push(`) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`);
  lines.push('');

  // Export seed rows
  const rows = db.prepare(`SELECT * FROM ${table}`).all() as Record<string, any>[];
  if (rows.length > 0) {
    lines.push(`-- Seed data for table \`${table}\``);
    const colNames = cols.map((c) => `\`${c.name}\``).join(', ');
    for (const row of rows) {
      const vals = cols.map((c) => escapeSqlValue(row[c.name])).join(', ');
      lines.push(`INSERT IGNORE INTO \`${table}\` (${colNames}) VALUES (${vals});`);
    }
    lines.push('');
  }
}

lines.push('SET FOREIGN_KEY_CHECKS = 1;');
lines.push('');

const outDir = path.join(process.cwd(), 'database');
fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, 'mysql_schema.sql');
fs.writeFileSync(outFile, lines.join('\n'), 'utf8');
console.log(`Generated ${outFile} (${lines.length} lines, ${TABLES_IN_ORDER.length} tables)`);
