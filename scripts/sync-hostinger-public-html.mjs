import fs from 'node:fs';
import path from 'node:path';

/**
 * Hostinger Git & Node.js Deployment Synchronizer
 * ------------------------------------------------
 * Automatically runs during "npm run build".
 * When Hostinger Git or Node.js deploys into hbuilds/ (e.g. ~/hbuilds/current or ~/hbuilds/versions/<id>),
 * this script detects the parent ~/public_html webroot and automatically synchronizes:
 *   1. All compiled React SPA files (dist/* -> public_html/)
 *   2. The PHP API Gateway (api/* -> public_html/api/)
 *   3. The production Apache / LiteSpeed .htaccess configuration
 *   4. The production environment configuration (.env)
 * 
 * This ensures that immediately upon "git push", the live domain (public_html)
 * is populated and never throws 403 Forbidden!
 */

function findProjectRoot(startDir) {
  let curr = startDir;
  while (curr && curr !== path.dirname(curr)) {
    if (fs.existsSync(path.join(curr, 'vite.config.ts')) && fs.existsSync(path.join(curr, 'server', 'index.ts'))) {
      return curr;
    }
    curr = path.dirname(curr);
  }
  return startDir;
}

const cwd = findProjectRoot(process.cwd());

// Find public_html candidate paths relative to this build execution
const candidates = [
  path.resolve(cwd, '../../../public_html'), // from ~/hbuilds/versions/<hash>
  path.resolve(cwd, '../../public_html'),    // from ~/hbuilds/current
  path.resolve(cwd, '../public_html'),       // from adjacent folder
  path.resolve(cwd, 'public_html'),          // inside repo if exists
];

let targetPublicHtml = null;
for (const cand of candidates) {
  try {
    if (fs.existsSync(cand) && fs.statSync(cand).isDirectory()) {
      targetPublicHtml = cand;
      break;
    }
  } catch {
    // Ignore permission or stat errors
  }
}

const distDir = path.resolve(cwd, 'dist');
const apiDir = path.resolve(cwd, 'api');

if (targetPublicHtml && fs.existsSync(distDir)) {
  console.log(`[Hostinger Sync] Detected Hostinger public_html at: ${targetPublicHtml}`);

  // 1. Copy all dist/ contents (index.html, assets/, etc.) into public_html
  try {
    fs.cpSync(distDir, targetPublicHtml, { recursive: true, force: true });
    console.log('[Hostinger Sync] Copied compiled React SPA assets and index.html to public_html');
  } catch (err) {
    console.error('[Hostinger Sync] Error copying dist/ to public_html:', err.message);
  }

  // 2. Copy api/ gateway into public_html/api
  if (fs.existsSync(apiDir)) {
    try {
      const targetApiDir = path.join(targetPublicHtml, 'api');
      fs.cpSync(apiDir, targetApiDir, { recursive: true, force: true });
      console.log('[Hostinger Sync] Copied api/ gateway to public_html/api');
    } catch (err) {
      console.error('[Hostinger Sync] Error copying api/ to public_html/api:', err.message);
    }
  }

  // 3. Copy app.js, dist-server/, package.json, and database/ for Node.js runtime compatibility
  try {
    const filesToCopy = ['app.js', 'package.json'];
    for (const f of filesToCopy) {
      const srcFile = path.resolve(cwd, f);
      if (fs.existsSync(srcFile)) {
        fs.copyFileSync(srcFile, path.join(targetPublicHtml, f));
      }
    }
    const dirsToCopy = ['dist-server', 'database'];
    for (const d of dirsToCopy) {
      const srcDir = path.resolve(cwd, d);
      if (fs.existsSync(srcDir)) {
        fs.cpSync(srcDir, path.join(targetPublicHtml, d), { recursive: true, force: true });
      }
    }
    console.log('[Hostinger Sync] Copied app.js, dist-server/, and package.json to public_html');
  } catch (err) {
    console.error('[Hostinger Sync] Error copying server files to public_html:', err.message);
  }

  // 4. Write rock-solid production .htaccess in public_html
  try {
    const htaccessContent = `# ============================================================================
# SocietyOS — Hostinger Apache / LiteSpeed Configuration (.htaccess)
# ============================================================================
DirectoryIndex index.html index.php

<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /

  RewriteRule ^index\\.html$ - [L]

  # Allow direct access to existing files (js, css, images, svg, etc.)
  RewriteCond %{REQUEST_FILENAME} -f [OR]
  RewriteCond %{REQUEST_FILENAME} -d
  RewriteRule ^ - [L]

  # Route all /api/* requests to api/index.php gateway (prevents HTML fallback)
  RewriteCond %{REQUEST_URI} ^/api(/.*)?$ [NC]
  RewriteRule ^api/(.*)$ api/index.php [QSA,L]
  RewriteRule ^api$ api/index.php [QSA,L]

  # Route all SPA pages to index.html
  RewriteRule . /index.html [L]
</IfModule>

Options -Indexes
`;
    fs.writeFileSync(path.join(targetPublicHtml, '.htaccess'), htaccessContent, 'utf8');
    console.log('[Hostinger Sync] Wrote production .htaccess to public_html');
  } catch (err) {
    console.error('[Hostinger Sync] Error writing .htaccess to public_html:', err.message);
  }

  // 4. Initialize .env if hostinger.env exists
  const hostingerEnv = path.resolve(cwd, 'hostinger.env');
  if (fs.existsSync(hostingerEnv)) {
    const publicEnv = path.join(targetPublicHtml, '.env');
    if (!fs.existsSync(publicEnv)) {
      try {
        fs.copyFileSync(hostingerEnv, publicEnv);
        console.log('[Hostinger Sync] Initialized public_html/.env from hostinger.env');
      } catch {
        // Non-critical
      }
    }
  }

  console.log('[Hostinger Sync] Complete! Hostinger public_html is live and in sync.');
} else {
  console.log('[Hostinger Sync] No Hostinger public_html found in parent directories (skipping external sync).');
}
