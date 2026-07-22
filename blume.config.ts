import { defineConfig } from 'blume';

export default defineConfig({
  title: 'GitWarp',
  description: 'Documentation for the GitWarp URL manipulation toolkit.',
  theme: {
    accent: 'oklch(0.6 0.14 255)',
    background: 'oklch(0.17 0.02 255)',
    mode: 'dark'
  },
  navigation: {
    featured: [
      { href: "/", label: "Back to GitWarp" }
    ]
  }
});
