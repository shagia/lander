import { z } from "zod";
import {
	LOGO_ANIMATION_DEFAULT,
	LOGO_ANIMATION_IDS,
	type LogoAnimation,
} from "./logo-animations";

export type { LogoAnimation } from "./logo-animations";
export {
	LOGO_ANIMATION_DEFAULT,
	LOGO_ANIMATION_IDS,
	LOGO_ANIMATION_LIBRARY,
	LOGO_ANIMATION_OPTIONS,
	logoAnimationClass,
} from "./logo-animations";

export const MOD_DEFAULTS = {
	aboutText: true,
	audioPlayer: false,
	banner: false,
	linkLens: true,
	performancesText: false,
	projectsText: true,
	releases: true,
	socialLinksContent: true,
} as const;

export type ModId = keyof typeof MOD_DEFAULTS;

/** Cover grid (`image`) or text list (`text`) for future mods **/
export type ReleasesVariant = "image" | "text";

export const RELEASES_VARIANTS = ["image", "text"] as const satisfies ReadonlyArray<ReleasesVariant>;

export const RELEASES_VARIANT_DEFAULT: ReleasesVariant = "text";

export type ModsConfig = {
	[K in ModId]: boolean;
} & {
	logoAnimation: LogoAnimation;
	releasesVariant: ReleasesVariant;
};

/** Partial / raw shape accepted from the site mods YAML file*/
export type ModsConfigInput = Partial<ModsConfig>;

const modToggleFields = Object.fromEntries(
	(Object.keys(MOD_DEFAULTS) as ModId[]).map((key) => [
		key,
		z.boolean().optional(),
	]),
) as { [K in ModId]: z.ZodOptional<z.ZodBoolean> };

/** Mods object shape **/
export const modsObjectSchema = z.object({
	...modToggleFields,
	logoAnimation: z.enum(LOGO_ANIMATION_IDS).optional(),
	releasesVariant: z.enum(RELEASES_VARIANTS).optional(),
});

/** Optional landing Mods; omitted keys use defaults from `resolveMods` **/
export const modsSchema = modsObjectSchema.optional();

export function resolveMods(input?: ModsConfigInput | null): ModsConfig {
	return {
		aboutText: input?.aboutText ?? MOD_DEFAULTS.aboutText,
		audioPlayer: input?.audioPlayer ?? MOD_DEFAULTS.audioPlayer,
		banner: input?.banner ?? MOD_DEFAULTS.banner,
		linkLens: input?.linkLens ?? MOD_DEFAULTS.linkLens,
		performancesText: input?.performancesText ?? MOD_DEFAULTS.performancesText,
		projectsText: input?.projectsText ?? MOD_DEFAULTS.projectsText,
		releases: input?.releases ?? MOD_DEFAULTS.releases,
		socialLinksContent:
			input?.socialLinksContent ?? MOD_DEFAULTS.socialLinksContent,
		logoAnimation: input?.logoAnimation ?? LOGO_ANIMATION_DEFAULT,
		releasesVariant: input?.releasesVariant ?? RELEASES_VARIANT_DEFAULT,
	};
}

export function isModEnabled(mods: ModsConfig, id: ModId): boolean {
	return mods[id];
}
