import { defineConfig } from 'blume';

export default defineConfig({
  title: 'GitWarp',
  description: 'Documentation for the GitWarp URL manipulation toolkit.',
  theme: {
    accent: { light: 'oklch(0.6 0.14 255)', dark: 'oklch(0.6 0.14 255)' },
    background: { light: 'oklch(0.17 0.02 255)', dark: 'oklch(0.17 0.02 255)' },
    mode: 'dark',
  },
  analytics: {
    scripts: [
      {
        content: `
          const style = document.createElement('style');
          style.innerHTML = \`
            button[aria-label="Toggle color theme"] { display: none !important; }
            :root, .dark-mode, .light-mode {
              --blume-accent: oklch(0.6 0.14 255) !important;
              --blume-action: oklch(0.6 0.14 255) !important;
              --color-accent: oklch(0.6 0.14 255) !important;
              --blume-background: oklch(0.17 0.02 255) !important;
              --color-background: oklch(0.17 0.02 255) !important;
              --blume-code-background: oklch(0.23 0.02 260) !important; /* bg-card */
            }
          \`;
          document.head.appendChild(style);
          localStorage.setItem('blume-theme', 'dark');
          document.documentElement.dataset.theme = 'dark';
        `,
      },
    ],
  },
  navigation: {
    featured: [{ href: '../', label: 'Back to GitWarp' }],
  },
});
