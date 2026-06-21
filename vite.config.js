import { defineConfig } from 'vite';

export default defineConfig({
  // If running in GitHub Actions, use the repo name as the base path.
  // Otherwise, use the root path (good for local dev and Cloudflare Pages).
  base: process.env.GITHUB_ACTIONS ? '/gitswapForged/' : '/',
});
