import { glob } from "astro/loaders";
import { z } from "astro/zod";
import { defineCollection } from "astro:content";
import { themeSchema } from "./lib/theme";
import { modsSchema } from "./lib/mods";

const SITE_CONTENT_BASE = "./src/content/site";

const slugs = defineCollection({
	loader: glob({ pattern: "**/*.md", base: "./src/content/slugs" }),
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
			theme: z.enum(["dark", "light"]).optional(),
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

/** blank, null, or omitted social handles get dropped through here */
const optionalSocialHandle = z
	.string()
	.nullish()
	.transform((value) => {
		const handle = value?.trim().replace(/^@/, "") ?? "";
		return handle || undefined;
	});

const optionalSocialEmail = z
	.string()
	.nullish()
	.transform((value, ctx) => {
		const email = value?.trim() ?? "";
		if (!email) return undefined;
		const parsed = z.string().email().safeParse(email);
		if (!parsed.success) {
			ctx.addIssue({
				code: "custom",
				message: "Invalid email address",
			});
			return z.NEVER;
		}
		return parsed.data;
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
			legalName: z.string().min(1),
			title: z.string().min(1),
			description: z.string().min(1),
			url: z.string().url().optional(),
			email: z.string().email(),
			icon: coverImage.optional(),
			avatar: coverImage.optional(),
			logo: z
				.object({
					light: coverImage.optional(),
					dark: coverImage.optional(),
				})
				.optional(),
			banner: z
				.object({
					image: coverImage.optional(),
					position: z.string().min(1).optional(),
					imageSize: z.number().positive().optional(),
					credit: z.string().min(1).optional(),
				})
				.optional(),
			theme: themeSchema,
			socials: z
				.object({
					soundcloud: optionalSocialHandle,
					instagram: optionalSocialHandle,
					bluesky: optionalSocialHandle,
					twitter: optionalSocialHandle,
					email: optionalSocialEmail,
				})
				.optional(),
			mods: modsSchema,
		});
	},
});

export const collections = { slugs, projects, performances, about, site };
