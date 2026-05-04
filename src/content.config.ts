import { glob } from "astro/loaders";
import { z } from "astro/zod";
import { defineCollection} from "astro:content";

const slugs = defineCollection({
	loader: glob({ pattern: "**/*.md", base: "./src/content/slugs" }),
	schema: ({ image }) =>
		z.object({
			id: z.string().min(1),
			title: z.string().min(1),
			description: z.string().min(1),
			cover: image().optional(),
			priority: z.number().int().nonnegative().default(0),
			publishedAt: z.coerce.date(),
			category: z.string().default("general"),
			tags: z.array(z.string()).default([]),
			campaign: z.string().optional(),
			status: z.enum(["draft", "published", "archived"]).default("published"),
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

export const collections = { slugs };
