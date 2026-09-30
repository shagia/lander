// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import markdoc from '@astrojs/markdoc';
import keystatic from '@keystatic/astro';


// https://astro.build/config
export default defineConfig({
  vite: {
      css: {
          preprocessorOptions: {
              scss: {
                  loadPaths: [`${import.meta.dirname}/src/styles`],
              },
          },
      },
	},

  integrations: [react(), markdoc(), keystatic()],
});