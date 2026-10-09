import { glob } from "astro/loaders";
import { z } from "astro/zod";
import { defineCollection } from "astro:content";
import {
	siteArtist,
	siteImages,
	siteMods,
	siteSocials,
	siteTheme,
} from "./site.collection";

const mdPattern = "**/[^_]*.md"; // matches all markdown files except those starting with an underscore

const releases = defineCollection({
	loader: glob({ pattern: mdPattern, base: "./src/content/releases" }),
	schema: ({ image }) => {
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
			theme: z
				.union([z.enum(["dark", "light"]), z.literal("")])
				.optional()
				.transform((v) => (v === "" || v == null ? undefined : v)),
			featured: z
				.object({
					headline: z
						.string()
						.nullish()
						.transform((v) => v?.trim() || undefined),
					summary: z
						.union([z.string(), z.array(z.string().nullish())])
						.nullish()
						.transform((v) => {
							if (v == null) return [];
							const items = Array.isArray(v) ? v : [v];
							return items
								.map((s) => s?.trim() ?? "")
								.filter((s) => s.length > 0);
						}),
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
	loader: glob({ pattern: mdPattern, base: "./src/content/projects" }),
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
	loader: glob({ pattern: mdPattern, base: "./src/content/performances" }),
	schema: z.object({
		title: z.string().min(1),
		date: z.coerce.date(),
		location: z.string().min(1),
		href: z.string().url(),
	}),
});

export const collections = {
	releases,
	projects,
	performances,
	siteArtist,
	siteImages,
	siteTheme,
	siteSocials,
	siteMods,
};
