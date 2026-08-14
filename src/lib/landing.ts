import { getCollection, type CollectionEntry } from "astro:content";

export type SlugEntry = CollectionEntry<"slugs">;

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

export function coverSrc(cover: unknown): string | undefined {
	if (!cover) return undefined;
	if (typeof cover === "string") return cover;
	if (typeof cover === "object" && cover !== null && "src" in cover) {
		return String((cover as { src: string }).src);
	}
	return undefined;
}

export async function getSlugByIdOrSlug(value: string): Promise<SlugEntry | undefined> {
	const entries = await getPublishedSlugs();
	return entries.find((entry) => entry.id === value || entry.data.id === value);
}
