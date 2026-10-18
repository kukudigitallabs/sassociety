import fs from 'node:fs';
import path from 'node:path';
import { db } from './db.ts';

export const MYSQL_TABLES = [
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
] as const;

let mysqlPool: any = null;
let mysqlConnected = false;
let lastSyncTime: string | null = null;
let lastMysqlError: string | null = null;
let syncInProgress = false;

export function getMysqlConfig() {
  return {
    driver: (process.env.DB_DRIVER || (process.env.MYSQL_DATABASE ? 'mysql' : 'sqlite')).toLowerCase(),
    host: process.env.MYSQL_HOST || '127.0.0.1',
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER || '',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || '',
  };
}

export function isMysqlEnabled(): boolean {
  const cfg = getMysqlConfig();
  return cfg.driver === 'mysql' && Boolean(cfg.database && cfg.user);
}

export function getDatabaseHealth() {
  const cfg = getMysqlConfig();
  return {
    driver: isMysqlEnabled() ? 'mysql' : 'sqlite',
    mysqlConfigured: isMysqlEnabled(),
    mysqlConnected,
    mysqlHost: isMysqlEnabled() ? cfg.host : null,
    mysqlDatabase: isMysqlEnabled() ? cfg.database : null,
    lastSyncedAt: lastSyncTime,
    lastError: lastMysqlError,
  };
}

/**
 * Initializes the Hostinger MySQL connection pool, ensures schema exists,
 * and loads existing MySQL records into the runtime database engine.
 */
export async function initMysqlBackend(): Promise<void> {
  if (!isMysqlEnabled()) {
    return;
  }

  const cfg = getMysqlConfig();
  try {
    // Dynamically import mysql2/promise so local environments without mysql2 still work
    const mysqlModuleName = 'mysql2/promise';
    const mysql = await import(/* @vite-ignore */ mysqlModuleName);
    mysqlPool = mysql.createPool({
      host: cfg.host,
      port: cfg.port,
      user: cfg.user,
      password: cfg.password,
      database: cfg.database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      multipleStatements: true,
      charset: 'utf8mb4',
    });

    // Test connection
    const conn = await mysqlPool.getConnection();
    try {
      await conn.ping();
      mysqlConnected = true;
      lastMysqlError = null;
      console.log(`[MySQL Backend] Connected to Hostinger MySQL database "${cfg.database}" at ${cfg.host}:${cfg.port}`);

      // Ensure tables exist using database/mysql_schema.sql if users table is missing
      const [tables] = await conn.query("SHOW TABLES LIKE 'users'");
      if (!Array.isArray(tables) || tables.length === 0) {
        const schemaPath = path.join(process.cwd(), 'database', 'mysql_schema.sql');
        if (fs.existsSync(schemaPath)) {
          console.log('[MySQL Backend] Initializing MySQL schema from database/mysql_schema.sql...');
          const sqlContent = fs.readFileSync(schemaPath, 'utf8');
          await conn.query(sqlContent);
        }
      }

      // Check if MySQL has existing users; if so, pull from MySQL into runtime engine
      const [userCountRows]: any = await conn.query('SELECT COUNT(*) as cnt FROM `users`');
      const mysqlUserCount = Number(userCountRows?.[0]?.cnt || 0);
      if (mysqlUserCount > 0) {
        await pullAllTablesFromMysql(conn);
      } else {
        await pushAllTablesToMysql(conn);
      }
      lastSyncTime = new Date().toISOString();
    } finally {
      conn.release();
    }
  } catch (err: any) {
    mysqlConnected = false;
    lastMysqlError = err?.message || String(err);
    console.error('[MySQL Backend Warning] Could not connect to MySQL, continuing with local embedded DB fallback:', lastMysqlError);
  }
}

async function pullAllTablesFromMysql(conn: any): Promise<void> {
  db.exec('PRAGMA foreign_keys = OFF;');
  db.exec('BEGIN IMMEDIATE');
  try {
    for (const table of MYSQL_TABLES) {
      const [rows]: any = await conn.query(`SELECT * FROM \`${table}\``);
      if (!Array.isArray(rows)) continue;

      db.prepare(`DELETE FROM ${table}`).run();
      if (rows.length === 0) continue;

      const cols = Object.keys(rows[0]);
      const placeholders = cols.map(() => '?').join(', ');
      const colList = cols.join(', ');
      const insertStmt = db.prepare(`INSERT OR REPLACE INTO ${table} (${colList}) VALUES (${placeholders})`);

      for (const row of rows) {
        const vals = cols.map((c) => {
          const v = row[c];
          if (v instanceof Date) return v.toISOString();
          return v ?? null;
        });
        insertStmt.run(...vals);
      }
    }
    db.exec('COMMIT');
    console.log('[MySQL Backend] Loaded all records from Hostinger MySQL into runtime engine.');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  } finally {
    db.exec('PRAGMA foreign_keys = ON;');
  }
}

async function pushAllTablesToMysql(conn: any): Promise<void> {
  await conn.query('SET FOREIGN_KEY_CHECKS = 0;');
  try {
    for (const table of MYSQL_TABLES) {
      const rows = db.prepare(`SELECT * FROM ${table}`).all() as Record<string, any>[];
      if (rows.length === 0) continue;

      const cols = Object.keys(rows[0]);
      const colNames = cols.map((c) => `\`${c}\``).join(', ');
      const placeholders = cols.map(() => '?').join(', ');
      const updateCols = cols
        .filter((c) => c !== 'id')
        .map((c) => `\`${c}\` = VALUES(\`${c}\`)`)
        .join(', ');

      const sql = `INSERT INTO \`${table}\` (${colNames}) VALUES (${placeholders}) ON DUPLICATE KEY UPDATE ${updateCols}`;
      for (const row of rows) {
        const vals = cols.map((c) => row[c] ?? null);
        await conn.query(sql, vals);
      }
    }
    lastSyncTime = new Date().toISOString();
  } finally {
    await conn.query('SET FOREIGN_KEY_CHECKS = 1;');
  }
}

/**
 * Asynchronously synchronizes runtime changes to Hostinger MySQL after write operations (POST / PUT / DELETE).
 */
export async function syncToMysqlAfterWrite(): Promise<void> {
  if (!isMysqlEnabled() || !mysqlPool || !mysqlConnected || syncInProgress) {
    return;
  }
  syncInProgress = true;
  try {
    const conn = await mysqlPool.getConnection();
    try {
      await pushAllTablesToMysql(conn);
    } finally {
      conn.release();
    }
  } catch (err: any) {
    lastMysqlError = err?.message || String(err);
    console.error('[MySQL Sync Error]', lastMysqlError);
  } finally {
    syncInProgress = false;
  }
}
