// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import markdoc from '@astrojs/markdoc';
import keystatic from '@keystatic/astro';
import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
	output: 'server',
	adapter: vercel(),
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
