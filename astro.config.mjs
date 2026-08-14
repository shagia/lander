// @ts-check
import { defineConfig } from 'astro/config';

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
});
