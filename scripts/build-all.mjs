import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

console.log(`[Build] Building Vite React SPA from root: ${root}...`);
execSync(`npx vite build --config ${path.join(root, 'vite.config.ts')} ${root} --outDir ${path.join(root, 'dist')}`, {
  cwd: root,
  stdio: 'inherit',
});

console.log(`[Build] Building Server...`);
execSync(`node ${path.join(root, 'scripts', 'build-server.mjs')}`, {
  cwd: root,
  stdio: 'inherit',
});

console.log(`[Build] Syncing Hostinger public_html...`);
execSync(`node ${path.join(root, 'scripts', 'sync-hostinger-public-html.mjs')}`, {
  cwd: root,
  stdio: 'inherit',
});
console.log(`[Build] All build steps completed successfully!`);
