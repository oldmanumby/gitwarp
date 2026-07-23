/**
 * Project: GitWarp
 * Description: Vite build and development configuration.
 *
 * Author: B.A. Umberger (Old Man Umby)
 * Website: https://oldmanumby.com
 * GitHub: https://github.com/oldmanumby
 *
 * Copyright (c) 2026 B.A. Umberger.
 * Released under the MIT License.
 */
import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';
import process from 'process';

function serveDocsPlugin() {
  return {
    name: 'serve-docs',
    enforce: 'pre',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url.startsWith('/docs')) {
          let relUrl = req.url.split('?')[0];
          relUrl = decodeURIComponent(relUrl);
          let filePath = path.join(process.cwd(), 'docs_temp', relUrl.replace(/^\/docs/, ''));

          if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
            filePath = path.join(filePath, 'index.html');
          }

          if (fs.existsSync(filePath)) {
            const ext = path.extname(filePath);
            const mimeTypes = {
              '.html': 'text/html',
              '.js': 'text/javascript',
              '.css': 'text/css',
              '.png': 'image/png',
              '.svg': 'image/svg+xml',
              '.woff2': 'font/woff2',
              '.json': 'application/json',
            };
            res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
            res.end(fs.readFileSync(filePath));
            return;
          }
        }
        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [serveDocsPlugin()],
});
