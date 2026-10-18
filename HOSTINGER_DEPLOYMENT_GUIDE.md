# Hostinger Deployment Guide (Node.js + MySQL Backend)

This project is pre-configured for **Hostinger Cloud / VPS / Node.js Web Hosting** with a **MySQL 8.0 / MariaDB** database backend.

---

## Files Included for Hostinger Upload

| File / Folder | Purpose |
| :--- | :--- |
| **`hostinger-societyos-mysql-deploy.zip`** | Ready-to-upload production package containing built frontend (`dist/`), backend (`server/`), startup script (`app.js`), `.htaccess`, and MySQL schema (`database/mysql_schema.sql`). |
| **`database/mysql_schema.sql`** | Complete MySQL 8.0 / MariaDB database dump (all **37 tables** + initial seed data for Super Admin, Demo Societies, Plans, Members, Bills, and Notifications). Ready to import in **Hostinger phpMyAdmin**. |
| **`server/mysql.ts`** | MySQL connection pool (`mysql2/promise`) + automatic schema initializer and real-time write synchronization adapter. |
| **`app.js`** | Hostinger Node.js Application Startup File. |
| **`.env.hostinger.example`** | Template environment file for Hostinger MySQL & Razorpay credentials. |
| **`.htaccess`** | LiteSpeed / Apache rewrite configuration for routing `/api/*`, `/uploads/*`, and React SPA routes. |

---

## Step 1: Create & Import the MySQL Database in Hostinger

1. Log in to **Hostinger hPanel** → **Databases** → **Management**.
2. Create a new MySQL Database and User (for example):
   - **Database Name**: `u123456789_societyos`
   - **MySQL Username**: `u123456789_admin`
   - **MySQL Password**: *(your strong password)*
3. Click **Enter phpMyAdmin** next to your newly created database.
4. Go to the **Import** tab in phpMyAdmin:
   - Choose **`database/mysql_schema.sql`**
   - Click **Import / Go** at the bottom.
   - All **37 tables** (`societies`, `users`, `society_members`, `member_bills`, `payments`, `society_invoices`, `notifications`, `platform_settings`, etc.) and initial accounts will be created automatically.

---

## Step 2: Upload Project to Hostinger

### Option A: Using Hostinger File Manager (Upload ZIP)
1. Open **Hostinger hPanel** → **Files** → **File Manager**.
2. Navigate to `domains/yourdomain.com/public_html`.
3. Upload **`hostinger-societyos-mysql-deploy.zip`** and right-click → **Extract**.

### Option B: Using Git / SSH
```bash
npm install
npm run build
```

---

## Step 3: Configure `.env` with Your MySQL Credentials

1. In your Hostinger folder (`public_html`), copy `.env.hostinger.example` to **`.env`** (or edit `.env` directly):
```env
NODE_ENV=production
PORT=4000

DB_DRIVER=mysql
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_DATABASE=u123456789_societyos
MYSQL_USER=u123456789_admin
MYSQL_PASSWORD=YOUR_MYSQL_PASSWORD

JWT_SECRET=replace_with_a_long_random_secret_string

RAZORPAY_KEY_ID=rzp_test_TpIGmZQJ7x3t3P
RAZORPAY_KEY_SECRET=J855unI9vpDKw3WpzStw8Bru
VITE_RAZORPAY_KEY_ID=rzp_test_TpIGmZQJ7x3t3P
```

---

## Step 4: Start the Node.js Application on Hostinger

### If using Hostinger hPanel Node.js Selector:
1. Go to **Advanced** → **Node.js** in hPanel.
2. Select **Node.js version 22.x (or 24.x)**.
3. Set **Application root**: `domains/yourdomain.com/public_html`
4. Set **Application startup file**: `app.js`
5. Click **NPM Install**, then click **Restart / Start App**.

### If using Hostinger VPS / Cloud SSH (PM2):
```bash
npm install --omit=dev
NODE_ENV=production pm2 start app.js --name societyos
pm2 save
```

---

## Step 5: Verify MySQL Connection

Visit:
```
https://yourdomain.com/api/health
```
You will see:
```json
{
  "status": "ok",
  "timestamp": "2026-10-18T12:00:00.000Z",
  "database": {
    "driver": "mysql",
    "mysqlConnected": true,
    "mysqlHost": "127.0.0.1",
    "mysqlDatabase": "u123456789_societyos",
    "lastSyncAt": "2026-10-18T12:00:00.000Z",
    "lastError": null
  }
}
```

---

## Default Login Accounts Included in `mysql_schema.sql`

- **Super Admin Portal**: `superadmin@societyos.in` / `SuperAdmin@123`
- **Society Admin (Green Valley Residency)**: `admin@greenvalley.in` / `Admin@123`
- **Resident Member (Flat A-101)**: `resident1@greenvalley.in` / `Member@123`
