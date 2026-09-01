import { getCollection, getEntry, type CollectionEntry } from "astro:content";

export type SlugEntry = CollectionEntry<"slugs">;
export type ProjectEntry = CollectionEntry<"projects">;
export type PerformanceEntry = CollectionEntry<"performances">;
export type SiteAboutEntry = CollectionEntry<"about">;
export type SiteConfigEntry = CollectionEntry<"site">;

/** Standard filenames for site-wide content in `src/content/site/`. */
export const SITE_CONTENT_FILES = {
	about: "About.md",
	site: "Site.yaml",
} as const;

export const SITE_ABOUT_ENTRY_ID = "about";
export const SITE_CONFIG_ENTRY_ID = "site";

export const defaultLinks = [
	{ id: "home", label: "Home", href: "https://example.com" },
	{ id: "newsletter", label: "Newsletter", href: "https://example.com/newsletter" },
	{ id: "community", label: "Community", href: "https://example.com/community" },
];

export async function getPublishedSlugs(): Promise<SlugEntry[]> {
	const entries = await getCollection(
		"slugs",
		({ data }) => data.status === "published" || data.status === "unlisted",
	);
	return entries.sort((a, b) => {
		if (a.data.priority !== b.data.priority) {
			return b.data.priority - a.data.priority;
		}
		return b.data.publishedAt.getTime() - a.data.publishedAt.getTime();
	});
}

export async function getReleaseSlugs(): Promise<SlugEntry[]> {
	const entries = await getPublishedSlugs();
	return entries.filter((entry) => {
		if (entry.data.status === "unlisted") return false;
		const category = entry.data.category.toLowerCase();
		return (
			category === "release" ||
			category === "releases" ||
			entry.data.tags.some((tag) => tag.toLowerCase() === "release")
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

export async function getSiteAbout(): Promise<SiteAboutEntry | undefined> {
	return getEntry("about", SITE_ABOUT_ENTRY_ID);
}

export async function getSiteConfig(): Promise<SiteConfigEntry | undefined> {
	return getEntry("site", SITE_CONFIG_ENTRY_ID);
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
export function slugPageBackgroundSrc(
	data: { background?: unknown; cover?: unknown } | undefined,
): string {
	return coverSrc(data?.background ?? data?.cover);
}

export function pageBackgroundImage(cover: unknown): string {
	return `url(${JSON.stringify(coverSrc(cover))})`;
}

export async function getRandomReleaseCover(): Promise<string | undefined> {
	const releases = await getReleaseSlugs();
	const withCovers = releases.filter((e) => e.data.cover != null);
	if (withCovers.length === 0) return undefined;
	const pick = withCovers[Math.floor(Math.random() * withCovers.length)];
	return coverSrc(pick.data.cover);
}

export async function getSlugByIdOrSlug(value: string): Promise<SlugEntry | undefined> {
	const entries = await getPublishedSlugs();
	return entries.find((entry) => entry.id === value || entry.data.id === value);
}
