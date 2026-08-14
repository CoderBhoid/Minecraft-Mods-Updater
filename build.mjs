import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import esbuild from 'esbuild';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Building production bundle for MC Mod Updater...');

try {
  fs.mkdirSync(path.join(__dirname, 'dist'), { recursive: true });
  
  esbuild.buildSync({
    entryPoints: [path.join(__dirname, 'index.tsx')],
    bundle: true,
    outdir: path.join(__dirname, 'dist'),
    entryNames: 'bundle',
    jsx: 'automatic',
    conditions: ['style'],
    external: ['/minecraft-font.css*'],
    loader: {
      '.ttf': 'file',
      '.woff2': 'file',
      '.png': 'file',
      '.svg': 'file',
    },
    target: 'es2022',
    minify: true,
    sourcemap: true,
  });

  console.log('✓ Production build completed successfully in ./dist!');
} catch (err) {
  console.error('Build failed:', err);
  process.exit(1);
}
