import { z } from "zod";

export const THEME_COLOR_KEYS = [
	"canvas",
	"text",
	"surface",
	"surfaceHover",
	"surfaceMuted",
	"linkLargeBg",
	"linkSmallBg",
	"border",
	"borderMuted",
	"borderStrong",
	"borderAccent",
	"focus",
	"muted",
] as const;

export type ThemeColorKey = (typeof THEME_COLOR_KEYS)[number];

export type ThemeColors = Partial<Record<ThemeColorKey, string>>;

export const hexColor = z
	.string()
	.regex(
		/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/,
		"Expected a hex color like #cfcfcf",
	);

/** Blank / omitted values keep the Sass default (Keystatic may write ""). */
const optionalThemeColor = z
	.string()
	.nullish()
	.transform((value, ctx) => {
		const trimmed = value?.trim() ?? "";
		if (!trimmed) return undefined;
		const parsed = hexColor.safeParse(trimmed);
		if (!parsed.success) {
			ctx.addIssue({
				code: "custom",
				message: "Expected a hex color like #cfcfcf",
			});
			return z.NEVER;
		}
		return parsed.data;
	});

const themeColorFields = Object.fromEntries(
	THEME_COLOR_KEYS.map((key) => [key, optionalThemeColor]),
) as { [K in ThemeColorKey]: typeof optionalThemeColor };

export const themeColorsSchema = z.object(themeColorFields).optional();

export const themeSchema = z
	.object({
		colors: themeColorsSchema,
	})
	.optional();

/** Maps camel cased YAML keys to kebab cased `--palette-*` CSS custom properties. */
const THEME_COLOR_CSS_VARS: Record<ThemeColorKey, string> = {
	canvas: "--palette-canvas",
	text: "--palette-text",
	surface: "--palette-surface",
	surfaceHover: "--palette-surface-hover",
	surfaceMuted: "--palette-surface-muted",
	linkLargeBg: "--palette-link-large-bg",
	linkSmallBg: "--palette-link-small-bg",
	border: "--palette-border",
	borderMuted: "--palette-border-muted",
	borderStrong: "--palette-border-strong",
	borderAccent: "--palette-border-accent",
	focus: "--palette-focus",
	muted: "--palette-muted",
};

/** Set theme.colors from site theme YAML as an override to the default palette **/
export function themePaletteStyle(
	colors: ThemeColors | undefined | null,
): string | undefined {
	if (!colors) return undefined;

	const decls: string[] = [];
	for (const key of THEME_COLOR_KEYS) {
		const value = colors[key]?.trim();
		if (!value) continue;
		decls.push(`${THEME_COLOR_CSS_VARS[key]}: ${value}`);
	}

	return decls.length > 0 ? decls.join("; ") : undefined;
}
