/**
 * Global toggles for optional Mods under `src/components/mods/`.
 */
export const MODS = {
	aboutText: true,
	audioPlayer: false,
	banner: false,
	linkLens: true,
	performancesText: false,
	projectsText: true,
	releases: true,
	socialLinksContent: true,
} as const;

export type ModId = keyof typeof MODS;

export function isModEnabled(id: ModId): boolean {
	return MODS[id];
}

/** Cover grid (`image`) or text list (`text`) for the Releases mod. */
export type ReleasesVariant = "image" | "text";

/**
 * Site-wide Releases display style.
 * Override per instance with `<Releases variant="image" />` or `variant="text"`.
 */
export const RELEASES_VARIANT: ReleasesVariant = "text";
