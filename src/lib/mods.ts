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

/** Cover grid (`image`) or text list (`text`) for the Releases mod. */
export type ReleasesVariant = "image" | "text";

export const RELEASES_VARIANT_DEFAULT: ReleasesVariant = "text";

export type ModsConfig = {
	[K in ModId]: boolean;
} & {
	releasesVariant: ReleasesVariant;
};

/** Partial / raw shape accepted from Site.yaml (all keys optional). */
export type ModsConfigInput = Partial<ModsConfig>;

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
		releasesVariant: input?.releasesVariant ?? RELEASES_VARIANT_DEFAULT,
	};
}

export function isModEnabled(mods: ModsConfig, id: ModId): boolean {
	return mods[id];
}
