export const SOCIAL_PLATFORMS = {
	soundcloud: { rootUrl: "https://soundcloud.com/" },
	instagram: { rootUrl: "https://www.instagram.com/" },
	bluesky: { rootUrl: "https://bsky.app/profile/" },
	twitter: { rootUrl: "https://x.com/" },
	youtube: { rootUrl: "https://www.youtube.com/@" },
	tiktok: { rootUrl: "https://www.tiktok.com/@" },
	/** Handle should be `artistname.bandcamp.com` (full host). */
	bandcamp: { rootUrl: "https://" },
	/** Invite code → discord.gg/<code> */
	discord: { rootUrl: "https://discord.gg/" },
	/** Default instance; other instances: register that instance's profile root. */
	mastodon: { rootUrl: "https://mastodon.social/@" },
	threads: { rootUrl: "https://www.threads.net/@" },
	facebook: { rootUrl: "https://www.facebook.com/" },
	twitch: { rootUrl: "https://www.twitch.tv/" },
	email: { rootUrl: "mailto:" },
} as const satisfies Record<string, { rootUrl: string }>;

export type SocialPlatformId = keyof typeof SOCIAL_PLATFORMS;

export type SocialPlatform = { rootUrl: string };

export function getSocialPlatform(
	platformId: string,
): SocialPlatform | undefined {
	return SOCIAL_PLATFORMS[platformId as SocialPlatformId];
}

/** Build href when the platform is registered; otherwise undefined (label-only). */
export function socialHref(
	platformId: string,
	handle: string,
): string | undefined {
	const platform = getSocialPlatform(platformId);
	if (!platform) return undefined;
	return `${platform.rootUrl}${handle}`;
}
