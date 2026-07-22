import { defineConfig } from 'blume';

export default defineConfig({
  title: 'GitWarp',
  description: 'Documentation for the GitWarp URL manipulation toolkit.',
  theme: {
    accent: '#4081d2',
    background: '#091018',
    mode: 'dark'
  },
  navigation: {
    featured: [
      { href: "../", label: "Back to GitWarp" }
    ]
  }
});
