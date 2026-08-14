import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import esbuild from 'esbuild';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.join(__dirname, 'dist');
const publicDir = path.join(__dirname, 'public');

console.log('🚀 Building production distribution for MC Mod Updater...');

function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach((childItemName) => {
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else if (exists) {
    fs.copyFileSync(src, dest);
  }
}

try {
  // Ensure dist directory exists
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }

  // 1. Bundle JavaScript & CSS
  esbuild.buildSync({
    entryPoints: [path.join(__dirname, 'index.tsx')],
    bundle: true,
    outdir: distDir,
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

  // 2. Copy all assets from public/ into dist/
  if (fs.existsSync(publicDir)) {
    copyRecursiveSync(publicDir, distDir);
    console.log('✓ Copied public/ static assets into dist/');
  }

  // 3. Copy fonts/ into dist/fonts/ if present
  const fontsDir = path.join(__dirname, 'fonts');
  if (fs.existsSync(fontsDir)) {
    copyRecursiveSync(fontsDir, path.join(distDir, 'fonts'));
    console.log('✓ Copied fonts/ into dist/fonts/');
  }

  // 4. Copy root minecraft-font.css into dist/
  const fontCssPath = path.join(__dirname, 'minecraft-font.css');
  if (fs.existsSync(fontCssPath)) {
    fs.copyFileSync(fontCssPath, path.join(distDir, 'minecraft-font.css'));
    console.log('✓ Copied minecraft-font.css into dist/');
  }

  // 5. Generate dist/index.html
  const rootIndexHtmlPath = path.join(__dirname, 'index.html');
  if (fs.existsSync(rootIndexHtmlPath)) {
    let htmlContent = fs.readFileSync(rootIndexHtmlPath, 'utf-8');
    
    // Normalize paths so they resolve directly from dist root
    htmlContent = htmlContent
      .replace('/dist/bundle.js', '/bundle.js')
      .replace('/dist/bundle.css', '/bundle.css');

    fs.writeFileSync(path.join(distDir, 'index.html'), htmlContent, 'utf-8');
    console.log('✓ Generated dist/index.html');
  }

  // 6. Create dist/dist fallback folder so both /bundle.js and /dist/bundle.js work
  const distNestedDir = path.join(distDir, 'dist');
  if (!fs.existsSync(distNestedDir)) {
    fs.mkdirSync(distNestedDir, { recursive: true });
  }
  const filesToDuplicate = ['bundle.js', 'bundle.js.map', 'bundle.css', 'bundle.css.map'];
  filesToDuplicate.forEach(file => {
    const srcFile = path.join(distDir, file);
    if (fs.existsSync(srcFile)) {
      fs.copyFileSync(srcFile, path.join(distNestedDir, file));
    }
  });

  console.log('🎉 Production distribution build ready in ./dist!');
} catch (err) {
  console.error('❌ Build failed:', err);
  process.exit(1);
}
