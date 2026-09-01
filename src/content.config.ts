import { glob } from "astro/loaders";
import { z } from "astro/zod";
import { defineCollection } from "astro:content";

/** Site-wide content files live in `src/content/site/` (e.g. `About.md`). */
const SITE_CONTENT_BASE = "./src/content/site";

const slugs = defineCollection({
	loader: glob({ pattern: "**/*.md", base: "./src/content/slugs" }),
	schema: ({ image }) => {
		/** Local Astro image, or a remote URL. */
		const coverImage = z.union([image(), z.string().url()]);
		return z.object({
			id: z.string().min(1),
			title: z.string().min(1),
			description: z.string().min(1),
			recordLabel: z.string().min(1).optional(),
			cover: coverImage.optional(),
			background: coverImage.optional(),
			priority: z.number().int().nonnegative().default(0),
			publishedAt: z.coerce.date(),
			category: z.string().default("general"),
			tags: z.array(z.string()).default([]),
			campaign: z.string().optional(),
			status: z
				.enum(["draft", "published", "unlisted", "archived"])
				.default("published"),
			theme: z.enum(["dark", "light"]).optional(),
			featured: z
				.object({
					headline: z.string().min(1),
					summary: z
						.union([
							z.string().min(1),
							z.array(z.string().min(1)).min(1),
						])
						.transform((v) => (Array.isArray(v) ? v : [v])),
				})
				.optional(),
			music: z
				.object({
					trackId: z.string().min(1),
					title: z.string().min(1),
					artist: z.string().min(1),
					audioUrl: z.string().url(),
					coverUrl: z.string().url().optional(),
				})
				.optional(),
			links: z
				.object({
					small: z
						.array(
							z.object({
								id: z.string().min(1),
								label: z.string().min(1),
								href: z.string().url(),
							}),
						)
						.optional(),
					large: z
						.array(
							z.object({
								id: z.string().min(1),
								label: z.string().min(1),
								href: z.string().url(),
							}),
						)
						.optional(),
					paid: z
						.array(
							z.object({
								id: z.string().min(1),
								label: z.string().min(1),
								href: z.string().url(),
							}),
						)
						.optional(),
					free: z
						.array(
							z.object({
								id: z.string().min(1),
								label: z.string().min(1),
								href: z.string().url(),
							}),
						)
						.optional(),
				})
				.default({})
				.transform((v) => ({
					small: v.small ?? v.paid ?? [],
					large: v.large ?? v.free ?? [],
				})),
		});
	},
});

const projects = defineCollection({
	loader: glob({ pattern: "**/*.md", base: "./src/content/projects" }),
	schema: ({ image }) =>
		z.object({
			title: z.string().min(1),
			type: z.string().min(1),
			date: z.coerce.date(),
			href: z.string().url(),
			thumb: z.union([image(), z.string().url()]).optional(),
		}),
});

const performances = defineCollection({
	loader: glob({ pattern: "**/*.md", base: "./src/content/performances" }),
	schema: z.object({
		title: z.string().min(1),
		date: z.coerce.date(),
		location: z.string().min(1),
		href: z.string().url(),
	}),
});

const about = defineCollection({
	loader: glob({
		pattern: "About.md",
		base: SITE_CONTENT_BASE,
		generateId: () => "about",
	}),
	schema: z.object({}),
});

const site = defineCollection({
	loader: glob({
		pattern: "Site.yaml",
		base: SITE_CONTENT_BASE,
		generateId: () => "site",
	}),
	schema: ({ image }) => {
		const coverImage = z.union([image(), z.string().url()]);
		return z.object({
			artist: z.string().min(1),
			title: z.string().min(1),
			description: z.string().min(1),
			url: z.string().url().optional(),
			/** Favicon and browser chrome (not shown in page UI). */
			icon: coverImage.optional(),
			/** Profile image shown on the site (not used for browser/search metadata). */
			avatar: coverImage.optional(),
			banner: z
				.object({
					image: coverImage.optional(),
					position: z.string().min(1).optional(),
					imageSize: z.number().positive().optional(),
					credit: z.string().min(1).optional(),
				})
				.optional(),
		});
	},
});

export const collections = { slugs, projects, performances, about, site };
