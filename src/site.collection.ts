import { glob } from "astro/loaders";
import { z } from "astro/zod";
import { defineCollection } from "astro:content";
import { themeSchema } from "./lib/theme";
import { modsObjectSchema } from "./lib/mods";

const SITE_BASE = "./src/site";

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

const optionalUrl = z
	.string()
	.nullish()
	.transform((value, ctx) => {
		const trimmed = value?.trim() ?? "";
		if (!trimmed) return undefined;
		const parsed = z.string().url().safeParse(trimmed);
		if (!parsed.success) {
			ctx.addIssue({ code: "custom", message: "Invalid URL" });
			return z.NEVER;
		}
		return parsed.data;
	});

const optionalNonEmpty = z
	.string()
	.nullish()
	.transform((value) => {
		const trimmed = value?.trim() ?? "";
		return trimmed || undefined;
	});

const optionalPositiveNumber = z
	.number()
	.nullish()
	.transform((value, ctx) => {
		if (value == null) return undefined;
		if (!(value > 0)) {
			ctx.addIssue({
				code: "custom",
				message: "Expected a positive number",
			});
			return z.NEVER;
		}
		return value;
	});

const socialsSchema = z
	.record(z.string().min(1), z.string().nullish())
	.transform((socials, ctx) => {
		const out: Record<string, string | undefined> = {};
		for (const [key, raw] of Object.entries(socials)) {
			if (key === "email") {
				const email = optionalSocialEmail.safeParse(raw);
				if (!email.success) {
					for (const issue of email.error.issues) {
						ctx.addIssue({ ...issue, path: ["email"] });
					}
					return z.NEVER;
				}
				out[key] = email.data;
				continue;
			}
			const handle = optionalSocialHandle.safeParse(raw);
			if (!handle.success) {
				for (const issue of handle.error.issues) {
					ctx.addIssue({ ...issue, path: [key] });
				}
				return z.NEVER;
			}
			out[key] = handle.data;
		}
		return out;
	});

/** Identity fields **/
export const siteArtist = defineCollection({
	loader: glob({
		pattern: "artist.yaml",
		base: SITE_BASE,
		generateId: () => "artist",
	}),
	schema: z.object({
		artist: z.string().min(1),
		legalName: z.string().min(1),
		title: z.string().min(1),
		description: z.string().min(1),
		url: optionalUrl,
		email: z.string().email(),
	}),
});

/** Brand images **/
export const siteImages = defineCollection({
	loader: glob({
		pattern: "images.yaml",
		base: SITE_BASE,
		generateId: () => "images",
	}),
	schema: ({ image }) => {
		const coverImage = z.union([image(), z.string().url()]);
		return z.object({
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
					position: optionalNonEmpty,
					imageSize: optionalPositiveNumber,
					credit: optionalNonEmpty,
				})
				.optional(),
		});
	},
});

/** Palette overrides — empty file / no colors keeps Sass defaults **/
export const siteTheme = defineCollection({
	loader: glob({
		pattern: "theme.yaml",
		base: SITE_BASE,
		generateId: () => "theme",
	}),
	schema: themeSchema,
});
/** Social handles **/
export const siteSocials = defineCollection({
	loader: glob({
		pattern: "socials.yaml",
		base: SITE_BASE,
		generateId: () => "socials",
	}),
	schema: socialsSchema,
});

/** Landing mods **/
export const siteMods = defineCollection({
	loader: glob({
		pattern: "mods.yaml",
		base: SITE_BASE,
		generateId: () => "mods",
	}),
	schema: modsObjectSchema,
});
