import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const root = process.cwd();

// 1. Package hostinger-societyos-mysql-deploy.zip
console.log('Building hostinger-societyos-mysql-deploy.zip...');
const deployZip = path.join(root, 'hostinger-societyos-mysql-deploy.zip');
if (fs.existsSync(deployZip)) fs.unlinkSync(deployZip);

execSync(
  `zip -r "${deployZip}" dist server api database scripts src index.html vite.config.ts tsconfig.json vercel.json app.js package.json package-lock.json .env hostinger.env -x "*/.DS_Store" "*node_modules*"`,
  { cwd: root, stdio: 'inherit' }
);

// 2. Package hostinger-subdomain-society-upload.zip (for Hostinger public_html / subdomain)
console.log('Building hostinger-subdomain-society-upload.zip...');
const stagingDir = path.join(root, 'dist-hostinger-staging');
if (fs.existsSync(stagingDir)) fs.rmSync(stagingDir, { recursive: true, force: true });
fs.mkdirSync(stagingDir, { recursive: true });

// Copy dist files to staging root
fs.cpSync(path.join(root, 'dist'), stagingDir, { recursive: true });
// Copy server
fs.cpSync(path.join(root, 'server'), path.join(stagingDir, 'server'), { recursive: true });
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

// Copy to artifact directory as well
const artifactZip = '/Users/kuku/.gemini/antigravity/brain/2862068e-a20a-44b8-b990-eac8eb21b37d/hostinger-subdomain-society-upload.zip';
fs.copyFileSync(subdomainZip, artifactZip);

fs.rmSync(stagingDir, { recursive: true, force: true });
console.log('Deployment zip packages built successfully!');
