import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import esbuild from 'esbuild';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = 3000;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf',
  '.woff2': 'font/woff2',
  '.map': 'application/json; charset=utf-8',
};

// Build application bundle with esbuild
function buildApp() {
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
      sourcemap: true,
    });
    return true;
  } catch (err) {
    console.error('Bundle build error:', err.message);
    return false;
  }
}

// Initial bundle build
console.log('📦 Building application bundle with esbuild...');
buildApp();
console.log('✓ Application bundle built successfully!');

// Rebuild on file changes with debounce
let rebuildTimeout = null;
fs.watch(__dirname, { recursive: true }, (eventType, filename) => {
  if (filename && !filename.startsWith('dist') && !filename.startsWith('.git') && !filename.startsWith('node_modules')) {
    if (rebuildTimeout) clearTimeout(rebuildTimeout);
    rebuildTimeout = setTimeout(() => {
      buildApp();
    }, 100);
  }
});

const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, `http://localhost:${PORT}`);
  let pathname = decodeURIComponent(parsedUrl.pathname);

  // Root route
  if (pathname === '/') {
    pathname = '/index.html';
  }

  // Check if file exists on disk
  const filePath = path.join(__dirname, pathname.startsWith('/') ? pathname.slice(1) : pathname);

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    const mime = MIME_TYPES[ext] || 'application/octet-stream';
    const content = fs.readFileSync(filePath);

    res.writeHead(200, {
      'Content-Type': mime,
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache',
    });
    res.end(content);
    return;
  }

  // SPA navigation fallback for browser routes (e.g. /404, /profiles, etc.)
  const isHtmlRequest = (req.headers.accept && req.headers.accept.includes('text/html')) || !path.extname(pathname);
  if (isHtmlRequest) {
    const indexPath = path.join(__dirname, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache',
      });
      res.end(fs.readFileSync(indexPath));
      return;
    }
  }

  // 404 for missing static assets
  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('404 Not Found');
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n  🚀 MC Mod Updater ready!`);
  console.log(`  ➜ Local:   http://localhost:${PORT}/`);
  console.log(`  ➜ Network: http://0.0.0.0:${PORT}/\n`);
});

// Keep event loop alive
setInterval(() => {}, 1000 * 60 * 60);
