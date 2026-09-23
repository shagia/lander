import { glob } from "astro/loaders";
import { z } from "astro/zod";
import { defineCollection } from "astro:content";
import { themeSchema } from "./lib/theme";
import { modsSchema } from "./lib/mods";

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

/** Site-wide config from `src/Site.yaml`. */
export const site = defineCollection({
	loader: glob({
		pattern: "Site.yaml",
		base: "./src",
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
