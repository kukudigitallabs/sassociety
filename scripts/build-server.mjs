import esbuild from 'esbuild';
import path from 'node:path';
import fs from 'node:fs';

const root = process.cwd();
const outDir = path.join(root, 'dist-server');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

console.log('[Build] Compiling server/index.ts to dist-server/server.js...');
await esbuild.build({
  entryPoints: [path.join(root, 'server', 'index.ts')],
  bundle: true,
  platform: 'node',
  format: 'esm',
  packages: 'external',
  outfile: path.join(outDir, 'server.js'),
  sourcemap: false,
  target: 'node18',
});
console.log('[Build] Server compiled successfully into pure ES Module JavaScript!');
