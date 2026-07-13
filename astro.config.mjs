// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

// ponytail: no @astrojs/tailwind, postcss.config.mjs + @tailwindcss/postcss handles Tailwind v4 natively
export default defineConfig({
  integrations: [react()]
});
