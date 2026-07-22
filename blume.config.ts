import { defineConfig } from 'blume';

export default defineConfig({
  title: 'GitWarp',
  description: 'Documentation for the GitWarp URL manipulation toolkit.',
  theme: {
    accent: { light: 'oklch(0.6 0.14 255)', dark: 'oklch(0.6 0.14 255)' },
    background: { light: 'oklch(0.17 0.02 255)', dark: 'oklch(0.17 0.02 255)' },
    mode: 'dark',
    fonts: {
      display: 'geist',
      body: 'geist',
      mono: 'geist-mono',
    },
  },
  analytics: {},
  navigation: {
    featured: [{ href: '../', label: 'Back to GitWarp' }],
  },
});
