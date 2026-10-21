import esbuild from 'esbuild';
import path from 'node:path';
import fs from 'node:fs';

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

const root = findProjectRoot(process.cwd());
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
  external: ['vite', 'fsevents', 'lightningcss'],
  outfile: path.join(outDir, 'server.js'),
  sourcemap: false,
  target: 'node18',
});
console.log('[Build] Server compiled successfully into pure ES Module JavaScript!');
