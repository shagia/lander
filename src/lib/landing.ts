import { getCollection, getEntry, type CollectionEntry } from "astro:content";
import { resolveMods, type ModsConfig, type ModsConfigInput } from "./mods";
import type { ThemeColors } from "./theme";

export type ReleaseEntry = CollectionEntry<"releases">;
export type ProjectEntry = CollectionEntry<"projects">;
export type PerformanceEntry = CollectionEntry<"performances">;

/** Merged site settings **/
export type SiteConfigData = {
	artist: string;
	legalName: string;
	title: string;
	description: string;
	url?: string;
	email: string;
	icon?: CollectionEntry<"siteImages">["data"]["icon"];
	avatar?: CollectionEntry<"siteImages">["data"]["avatar"];
	logo?: CollectionEntry<"siteImages">["data"]["logo"];
	banner?: CollectionEntry<"siteImages">["data"]["banner"];
	theme?: { colors?: ThemeColors };
	socials?: Record<string, string | undefined>;
	mods?: ModsConfigInput;
};

export type SiteConfigEntry = {
	id: "site";
	data: SiteConfigData;
};

/** Split site settings **/
export const SITE_CONTENT_FILES = {
	artist: "artist.yaml",
	images: "images.yaml",
	theme: "theme.yaml",
	socials: "socials.yaml",
	mods: "mods.yaml",
} as const;

export const SITE_CONFIG_ENTRY_ID = "site";

export async function getPublishedReleases(): Promise<ReleaseEntry[]> {
	const entries = await getCollection(
		"releases",
		({ data }) => data.status === "published" || data.status === "unlisted",
	);
	return entries.sort((a, b) => {
		if (a.data.priority !== b.data.priority) {
			return b.data.priority - a.data.priority;
		}
		return b.data.publishedAt.getTime() - a.data.publishedAt.getTime();
	});
}

export async function getReleases(): Promise<ReleaseEntry[]> {
	const entries = await getPublishedReleases();
	return entries.filter((entry) => {
		if (entry.data.status === "unlisted") return false;
		const category = entry.data.category.toLowerCase();
		return (
			category === "release" ||
			category === "releases" ||
			entry.data.tags.some((tag: string) => tag.toLowerCase() === "release")
		);
	});
}

export async function getProjects(): Promise<ProjectEntry[]> {
	const entries = await getCollection("projects");
	return entries.sort(
		(a, b) => b.data.date.getTime() - a.data.date.getTime(),
	);
}

export async function getPerformances(): Promise<PerformanceEntry[]> {
	const entries = await getCollection("performances");
	return entries.sort(
		(a, b) => b.data.date.getTime() - a.data.date.getTime(),
	);
}

export async function getSiteConfig(): Promise<SiteConfigEntry | undefined> {
	const artist = await getEntry("siteArtist", "artist");
	if (!artist) return undefined;

	const [images, theme, socials, mods] = await Promise.all([
		getEntry("siteImages", "images"),
		getEntry("siteTheme", "theme"),
		getEntry("siteSocials", "socials"),
		getEntry("siteMods", "mods"),
	]);

	return {
		id: SITE_CONFIG_ENTRY_ID,
		data: {
			...artist.data,
			...images?.data,
			theme: theme?.data,
			socials: socials?.data,
			mods: mods?.data,
		},
	};
}

export async function getMods(): Promise<ModsConfig> {
	const site = await getSiteConfig();
	return resolveMods(site?.data.mods);
}

/** 1:1 fallback when a release has no cover URL. */
export const PLACEHOLDER_COVER_SRC = "/placeholder-cover.svg";

export function coverSrc(cover: unknown): string {
	if (typeof cover === "string" && cover.length > 0) return cover;
	if (cover != null && (typeof cover === "object" || typeof cover === "function")) {
		if ("src" in cover) {
			const src = String((cover as { src: string }).src);
			if (src) return src;
		}
	}
	return PLACEHOLDER_COVER_SRC;
}

/** Page backdrop: `background` → `cover` → placeholder. */
export function releasePageBackgroundSrc(
	data: { background?: unknown; cover?: unknown } | undefined,
): string {
	return coverSrc(data?.background ?? data?.cover);
}

export function pageBackgroundImage(cover: unknown): string {
	return `url(${JSON.stringify(coverSrc(cover))})`;
}

export async function getRandomReleaseCover(): Promise<string | undefined> {
	const releases = await getReleases();
	const withCovers = releases.filter((e) => e.data.cover != null);
	if (withCovers.length === 0) return undefined;
	const pick = withCovers[Math.floor(Math.random() * withCovers.length)];
	return coverSrc(pick.data.cover);
}

export async function getReleaseById(value: string): Promise<ReleaseEntry | undefined> {
	const entries = await getPublishedReleases();
	return entries.find((entry) => entry.id === value || entry.data.id === value);
}
