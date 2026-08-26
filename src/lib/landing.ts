import { getCollection, type CollectionEntry } from "astro:content";

export type SlugEntry = CollectionEntry<"slugs">;
export type ProjectEntry = CollectionEntry<"projects">;

export const defaultLinks = [
	{ id: "home", label: "Home", href: "https://example.com" },
	{ id: "newsletter", label: "Newsletter", href: "https://example.com/newsletter" },
	{ id: "community", label: "Community", href: "https://example.com/community" },
];

export async function getPublishedSlugs(): Promise<SlugEntry[]> {
	const entries = await getCollection("slugs", ({ data }) => data.status === "published");
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

/** 1:1 fallback when a release has no cover URL. */
export const PLACEHOLDER_COVER_SRC = "/placeholder-cover.svg";

export function coverSrc(cover: unknown): string {
	if (typeof cover === "string" && cover.length > 0) return cover;
	if (typeof cover === "object" && cover !== null && "src" in cover) {
		const src = String((cover as { src: string }).src);
		if (src) return src;
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
