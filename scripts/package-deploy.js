import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const root = process.cwd();
const artifactDir = '/Users/kuku/.gemini/antigravity/brain/7a68040b-c614-45fd-ae0f-c793800d3d22';

// Ensure builds are up to date
console.log('[1/4] Running production Vite build and esbuild server compile...');
execSync('npm run build', { cwd: root, stdio: 'inherit' });

// 1. Package hostinger-societyos-mysql-deploy.zip (Full repo bundle without vercel/git)
console.log('[2/4] Packaging hostinger-societyos-mysql-deploy.zip & hostinger-web-app-complete.zip...');
const deployZip = path.join(root, 'hostinger-societyos-mysql-deploy.zip');
if (fs.existsSync(deployZip)) fs.unlinkSync(deployZip);

execSync(
  `zip -r "${deployZip}" dist dist-server server api database scripts src index.html vite.config.ts tsconfig.json app.js package.json package-lock.json .env hostinger.env .htaccess -x "*/.DS_Store" "*node_modules*" "scratch*"`,
  { cwd: root, stdio: 'inherit' }
);
fs.copyFileSync(deployZip, path.join(artifactDir, 'hostinger-societyos-mysql-deploy.zip'));
fs.copyFileSync(deployZip, path.join(artifactDir, 'hostinger-web-app-complete.zip'));

// 2. Package hostinger-subdomain-society-upload.zip & hostinger-public-html-extract.zip (for File Manager public_html extraction)
console.log('[3/4] Packaging hostinger-subdomain-society-upload.zip & hostinger-public-html-extract.zip...');
const stagingDir = path.join(root, 'dist-hostinger-staging');
if (fs.existsSync(stagingDir)) fs.rmSync(stagingDir, { recursive: true, force: true });
fs.mkdirSync(stagingDir, { recursive: true });

// Copy dist files directly to staging root
fs.cpSync(path.join(root, 'dist'), stagingDir, { recursive: true });
// Copy compiled server
fs.cpSync(path.join(root, 'dist-server'), path.join(stagingDir, 'dist-server'), { recursive: true });
// Copy server source
fs.cpSync(path.join(root, 'server'), path.join(stagingDir, 'server'), { recursive: true });
// Copy api (including PHP fallback proxy index.php)
fs.cpSync(path.join(root, 'api'), path.join(stagingDir, 'api'), { recursive: true });
// Copy database
fs.cpSync(path.join(root, 'database'), path.join(stagingDir, 'database'), { recursive: true });
// Copy config & entry files
for (const f of ['package.json', 'package-lock.json', '.env', 'hostinger.env', 'app.js', '.htaccess']) {
  const srcF = path.join(root, f);
  if (fs.existsSync(srcF)) {
    fs.copyFileSync(srcF, path.join(stagingDir, f));
  }
}

const subdomainZip = path.join(root, 'hostinger-subdomain-society-upload.zip');
if (fs.existsSync(subdomainZip)) fs.unlinkSync(subdomainZip);
execSync(`zip -r "${subdomainZip}" . -x "*/.DS_Store"`, { cwd: stagingDir, stdio: 'inherit' });

fs.copyFileSync(subdomainZip, path.join(artifactDir, 'hostinger-subdomain-society-upload.zip'));
fs.copyFileSync(subdomainZip, path.join(artifactDir, 'hostinger-public-html-extract.zip'));
fs.rmSync(stagingDir, { recursive: true, force: true });

// 3. Database MariaDB schema zip
console.log('[4/4] Refreshing database schema zip...');
const dbZip = path.join(artifactDir, 'societyos_schema.sql.zip');
if (fs.existsSync(dbZip)) fs.unlinkSync(dbZip);
execSync(`zip -j "${dbZip}" database/societyos_schema.sql`, { cwd: root, stdio: 'inherit' });

console.log('✓ All Hostinger deployment packages built and verified successfully!');
