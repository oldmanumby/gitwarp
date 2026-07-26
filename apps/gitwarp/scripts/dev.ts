import fs from 'fs';
import path from 'path';

const PORT = 3000;
const BASE_DIR = process.cwd();

console.log(`Starting Bun dev server on http://localhost:${PORT}`);

Bun.serve({
  port: PORT,
  // fallow-ignore-next-line complexity
  fetch(req) {
    const url = new URL(req.url);
    let pathname = decodeURIComponent(url.pathname);

    // Route /docs to docs_temp
    if (pathname.startsWith('/docs')) {
      let docPath = pathname.replace(/^\/docs/, '');
      let filePath = path.join(BASE_DIR, 'docs_temp', docPath);

      if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
        filePath = path.join(filePath, 'index.html');
      }

      if (fs.existsSync(filePath)) {
        return new Response(Bun.file(filePath));
      }
      return new Response('Not Found', { status: 404 });
    }

    // Serve public and root files (src, theme.css, etc)
    let filePath = path.join(BASE_DIR, pathname === '/' ? 'index.html' : pathname);
    
    // Fallbacks
    if (!fs.existsSync(filePath)) {
      // Try public folder
      const publicPath = path.join(BASE_DIR, 'public', pathname);
      if (fs.existsSync(publicPath)) {
        filePath = publicPath;
      }
    }

    if (fs.existsSync(filePath) && !fs.statSync(filePath).isDirectory()) {
      return new Response(Bun.file(filePath));
    }

    return new Response('Not Found', { status: 404 });
  },
});
