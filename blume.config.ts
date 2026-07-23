import { defineConfig } from 'blume';

export default defineConfig({
  title: 'GitWarp Docs',
  description: 'Documentation powered by Blume.',
  theme: {
    fonts: {
      display: 'geist',
      body: 'geist',
      mono: 'geist-mono',
    },
  },
  navigation: {
    featured: [
      {
        label: 'Back to GitWarp',
        href: "javascript:window.location.href='/'",
        icon: 'arrow-left',
      },
    ],
  },
});
