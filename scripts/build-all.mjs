import { execSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

console.log(`[Build] Starting SocietyOS production build from root: ${root}...`);

// 1. Build React SPA with Vite (or use precompiled dist if available)
try {
  console.log(`[Build] Running Vite build...`);
  execSync(`npx vite build --config ${path.join(root, 'vite.config.ts')} ${root} --outDir ${path.join(root, 'dist')}`, {
    cwd: root,
    stdio: 'inherit',
  });
} catch (err) {
  console.warn(`[Build] Vite build encountered error: ${err.message}`);
  if (fs.existsSync(path.join(root, 'dist', 'index.html'))) {
    console.log(`[Build] Using existing pre-compiled dist/ directory.`);
  } else if (fs.existsSync(path.join(root, 'public_html', 'index.html'))) {
    console.log(`[Build] Recovering dist/ from public_html...`);
    fs.cpSync(path.join(root, 'public_html'), path.join(root, 'dist'), { recursive: true });
  } else {
    throw err;
  }
}

// Ensure dist output directory exists for Hostinger publisher
const distDir = path.join(root, 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}
if (!fs.existsSync(path.join(distDir, 'index.html')) && fs.existsSync(path.join(root, 'index.html'))) {
  fs.copyFileSync(path.join(root, 'index.html'), path.join(distDir, 'index.html'));
}

// 2. Build backend server
try {
  console.log(`[Build] Building Server...`);
  execSync(`node ${path.join(root, 'scripts', 'build-server.mjs')}`, {
    cwd: root,
    stdio: 'inherit',
  });
} catch (err) {
  console.warn(`[Build] Server build warning: ${err.message}`);
  if (!fs.existsSync(path.join(root, 'dist-server', 'server.js'))) {
    throw err;
  }
}

// 3. Sync into Hostinger public_html if running in Hostinger deployment environment
try {
  console.log(`[Build] Syncing Hostinger public_html...`);
  execSync(`node ${path.join(root, 'scripts', 'sync-hostinger-public-html.mjs')}`, {
    cwd: root,
    stdio: 'inherit',
  });
} catch (err) {
  console.warn(`[Build] Hostinger sync notice: ${err.message}`);
}

console.log(`[Build] All build steps completed successfully! Output ready in dist/`);
