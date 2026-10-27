/**
 * Logo animation library.
 *
 * Contract: id → binder class → slot vars → animation
 *
 * Add an entry here, then in `styles/components/logo-animations.scss`:
 *   1. Preset  — `--logo-preset-<id>-*` (+ `@keyframes` if needed)
 *   2. Binder  — `.site-logo--<id>` that maps the preset onto `--logo-slot-*`
 *
 * The logo parent always reads the slot; binders are what select a preset.
 */

export const LOGO_ANIMATION_LIBRARY = [
	{ id: "none", label: "None" },
	{ id: "spin", label: "Spin" },
] as const;

export type LogoAnimation = (typeof LOGO_ANIMATION_LIBRARY)[number]["id"];

// IDs that are to be kept in sync with `LOGO_ANIMATION_LIBRARY` for Zod and Keystatic values.
export const LOGO_ANIMATION_IDS = [
	"none",
	"spin",
] as const satisfies ReadonlyArray<LogoAnimation>;

export const LOGO_ANIMATION_DEFAULT: LogoAnimation = "none";

export const LOGO_ANIMATION_OPTIONS: ReadonlyArray<{
	label: string;
	value: LogoAnimation;
}> = LOGO_ANIMATION_LIBRARY.map((entry) => ({
	label: entry.label,
	value: entry.id,
}));

// Returns the binder class for an id, or undefined for `none`
export function logoAnimationClass(
	id: LogoAnimation,
): `site-logo--${Exclude<LogoAnimation, "none">}` | undefined {
	if (id === "none") return undefined;
	return `site-logo--${id}`;
}
