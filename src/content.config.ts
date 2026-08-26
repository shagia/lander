import { glob } from "astro/loaders";
import { z } from "astro/zod";
import { defineCollection} from "astro:content";

const slugs = defineCollection({
	loader: glob({ pattern: "**/*.md", base: "./src/content/slugs" }),
	schema: z.object({
		id: z.string().min(1),
		title: z.string().min(1),
		description: z.string().min(1),
		recordLabel: z.string().min(1).optional(),
		cover: z.string().url().optional(),
		/** Optional page backdrop; falls back to `cover`, then the placeholder. */
		background: z.string().url().optional(),
		priority: z.number().int().nonnegative().default(0),
		publishedAt: z.coerce.date(),
		category: z.string().default("general"),
		tags: z.array(z.string()).default([]),
		campaign: z.string().optional(),
		status: z.enum(["draft", "published", "archived"]).default("published"),
		/** Optional page theme override; omit to follow the system/browser color scheme. */
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
	}),
});

const projects = defineCollection({
	loader: glob({ pattern: "**/*.md", base: "./src/content/projects" }),
	schema: z.object({
		title: z.string().min(1),
		type: z.string().min(1),
		date: z.coerce.date(),
		href: z.string().url(),
	}),
});

export const collections = { slugs, projects };
