import { config, fields, collection, singleton } from '@keystatic/core';

const linkItem = fields.object({
	id: fields.text({ label: 'ID', validation: { isRequired: true } }),
	label: fields.text({ label: 'Label', validation: { isRequired: true } }),
	href: fields.url({ label: 'URL', validation: { isRequired: true } }),
});

/** Brand images live under `src/assets/ui/`; paths in `src/site/*.yaml` are `../assets/ui/...`. */
const uiImage = (label: string, description?: string) =>
	fields.image({
		label,
		description,
		directory: 'src/assets/ui',
		publicPath: '../assets/ui/',
	});

const themeColor = (label: string) =>
	fields.text({
		label,
		description: 'Hex color like #e8eaed. Leave blank for the Sass default.',
	});

const socialHandle = (label: string, description?: string) =>
	fields.text({
		label,
		description: description ?? 'Leave blank to hide this platform.',
	});

function readEnv(name: string): string | undefined {
	if (typeof process !== 'undefined' && process.env?.[name]) {
		return process.env[name];
	}
	const viteEnv = import.meta.env as Record<string, string | undefined>;
	return viteEnv[name];
}

function parseGithubRepo(
	value: string | undefined,
): { owner: string; name: string } | undefined {
	if (!value) return undefined;
	const [owner, name, ...rest] = value.split('/');
	if (!owner || !name || rest.length > 0) return undefined;
	return { owner, name };
}

// Prefer PUBLIC_ so the Admin UI (browser) can see the repo. Server also accepts
// KEYSTATIC_GITHUB_REPO. GitHub mode is selected by repo alone so the first-run
// "Create GitHub App" wizard works before CLIENT_ID exists.
const githubRepo = parseGithubRepo(
	readEnv('PUBLIC_KEYSTATIC_GITHUB_REPO') || readEnv('KEYSTATIC_GITHUB_REPO'),
);

export default config({
	storage: githubRepo
		? {
				kind: 'github',
				repo: githubRepo,
			}
		: {
				kind: 'local',
			},
	// Custom groups replace the default Collections / Singletons headings.
	ui: {
		navigation: {
			Collections: ['releases'],
			'Site Settings': [
				'siteArtist',
				'siteImages',
				'siteTheme',
				'siteSocials',
				'siteMods',
			],
		},
	},
	singletons: {
		siteArtist: singleton({
			label: 'Artist Info',
			path: 'src/site/artist',
			format: { data: 'yaml' },
			schema: {
				artist: fields.text({
					label: 'Artist',
					validation: { isRequired: true },
				}),
				legalName: fields.text({
					label: 'Legal name',
					validation: { isRequired: true },
				}),
				title: fields.text({
					label: 'Site title',
					validation: { isRequired: true },
				}),
				description: fields.text({
					label: 'Description',
					multiline: true,
					validation: { isRequired: true },
				}),
				email: fields.text({
					label: 'Email',
					validation: { isRequired: true },
				}),
				url: fields.url({ label: 'Site URL' }),
			},
		}),
		siteImages: singleton({
			label: 'Artist Images',
			path: 'src/site/images',
			format: { data: 'yaml' },
			schema: {
				icon: uiImage('Icon', 'Favicon / app icon under src/assets/ui/.'),
				avatar: uiImage('Avatar'),
				logo: fields.object(
					{
						light: uiImage('Light logo'),
						dark: uiImage('Dark logo'),
					},
					{ label: 'Logo' },
				),
				banner: fields.object(
					{
						image: uiImage('Banner image'),
						position: fields.text({
							label: 'Position',
							description: 'CSS background-position, e.g. center center.',
							defaultValue: 'center center',
						}),
						imageSize: fields.number({
							label: 'Image size',
							description: 'Scale factor for the banner image (e.g. 1.2).',
							defaultValue: 1,
							step: 0.1,
							validation: { min: 0.1 },
						}),
						credit: fields.text({
							label: 'Credit',
							description: 'Optional photo credit under the banner.',
						}),
					},
					{
						label: 'Banner',
						description: 'Shown when mods.banner is enabled.',
					},
				),
			},
		}),
		siteTheme: singleton({
			label: 'Theme',
			path: 'src/site/theme',
			format: { data: 'yaml' },
			schema: {
				colors: fields.object(
					{
						canvas: themeColor('Canvas'),
						text: themeColor('Text'),
						surface: themeColor('Surface'),
						surfaceHover: themeColor('Surface hover'),
						surfaceMuted: themeColor('Surface muted'),
						linkLargeBg: themeColor('Link large background'),
						linkSmallBg: themeColor('Link small background'),
						border: themeColor('Border'),
						borderMuted: themeColor('Border muted'),
						borderStrong: themeColor('Border strong'),
						borderAccent: themeColor('Border accent'),
						focus: themeColor('Focus'),
						muted: themeColor('Muted'),
					},
					{
						label: 'Colors',
						description:
							'Overrides for src/styles/global/abstracts/_colors.scss. Leave blank for Sass defaults.',
					},
				),
			},
		}),
		siteSocials: singleton({
			label: 'Socials',
			path: 'src/site/socials',
			format: { data: 'yaml' },
			schema: {
				soundcloud: socialHandle('SoundCloud'),
				bandcamp: socialHandle(
					'Bandcamp',
					'Full host, e.g. yourname.bandcamp.com.',
				),
				instagram: socialHandle('Instagram'),
				bluesky: socialHandle('Bluesky'),
				twitter: socialHandle('Twitter / X'),
				youtube: socialHandle('YouTube'),
				tiktok: socialHandle('TikTok'),
				threads: socialHandle('Threads'),
				mastodon: socialHandle('Mastodon'),
				facebook: socialHandle('Facebook'),
				twitch: socialHandle('Twitch'),
				discord: socialHandle(
					'Discord',
					'Invite code only (discord.gg/<code>).',
				),
				email: socialHandle('Email', 'Shown in the socials row.'),
			},
		}),
		siteMods: singleton({
			label: 'Mods',
			path: 'src/site/mods',
			format: { data: 'yaml' },
			schema: {
				aboutText: fields.checkbox({
					label: 'About text',
					defaultValue: true,
				}),
				audioPlayer: fields.checkbox({
					label: 'Audio player',
					defaultValue: false,
				}),
				banner: fields.checkbox({
					label: 'Banner',
					defaultValue: false,
				}),
				linkLens: fields.checkbox({
					label: 'Link lens',
					defaultValue: true,
				}),
				performancesText: fields.checkbox({
					label: 'Performances',
					defaultValue: false,
				}),
				projectsText: fields.checkbox({
					label: 'Projects',
					defaultValue: true,
				}),
				releases: fields.checkbox({
					label: 'Releases',
					defaultValue: true,
				}),
				socialLinksContent: fields.checkbox({
					label: 'Social links',
					defaultValue: true,
				}),
				releasesVariant: fields.select({
					label: 'Releases layout',
					options: [
						{ label: 'Text list', value: 'text' },
						{ label: 'Cover grid', value: 'image' },
					],
					defaultValue: 'text',
				}),
			},
		}),
	},
	collections: {
		releases: collection({
			label: 'Releases',
			slugField: 'title',
			path: 'src/content/releases/*',
			format: { contentField: 'content' },
			columns: ['title', 'status', 'publishedAt'],
			schema: {
				title: fields.slug({ name: { label: 'Title' } }),
				id: fields.text({
					label: 'ID',
					description:
						'Stable release id used for routing and lookups (can differ from the filename slug).',
					validation: { isRequired: true },
				}),
				description: fields.text({
					label: 'Description',
					multiline: true,
					validation: { isRequired: true },
				}),
				recordLabel: fields.text({ label: 'Record label' }),
				priority: fields.integer({
					label: 'Priority',
					description: 'Higher values sort first among published releases.',
					defaultValue: 0,
					validation: { min: 0 },
				}),
				publishedAt: fields.date({
					label: 'Published at',
					validation: { isRequired: true },
				}),
				category: fields.select({
					label: 'Category',
					options: [
						{ label: 'General', value: 'general' },
						{ label: 'Release', value: 'release' },
						{ label: 'Releases', value: 'releases' },
						{ label: 'Performances', value: 'performances' },
						{ label: 'Projects', value: 'projects' },
					],
					defaultValue: 'general',
				}),
				tags: fields.array(fields.text({ label: 'Tag' }), {
					label: 'Tags',
					itemLabel: (props) => props.value || 'Tag',
				}),
				campaign: fields.text({ label: 'Campaign' }),
				status: fields.select({
					label: 'Status',
					options: [
						{ label: 'Draft', value: 'draft' },
						{ label: 'Published', value: 'published' },
						{ label: 'Unlisted', value: 'unlisted' },
						{ label: 'Archived', value: 'archived' },
					],
					defaultValue: 'published',
				}),
				theme: fields.select({
					label: 'Theme',
					description: 'Leave as site default to inherit the global theme.',
					options: [
						{ label: 'Site default', value: '' },
						{ label: 'Dark', value: 'dark' },
						{ label: 'Light', value: 'light' },
					],
					defaultValue: '',
				}),
				cover: fields.image({
					label: 'Cover',
					directory: 'src/assets/releases',
					publicPath: '../../assets/releases/',
				}),
				background: fields.image({
					label: 'Background',
					directory: 'src/assets/releases',
					publicPath: '../../assets/releases/',
				}),
				featured: fields.object(
					{
						headline: fields.text({ label: 'Headline' }),
						summary: fields.array(
							fields.text({ label: 'Passage', multiline: true }),
							{
								label: 'Summary',
								itemLabel: (props) => props.value || 'Passage',
							},
						),
					},
					{
						label: 'Featured',
						description: 'Optional landing copy for this release.',
					},
				),
				music: fields.object(
					{
						trackId: fields.text({ label: 'Track ID' }),
						title: fields.text({ label: 'Track title' }),
						artist: fields.text({ label: 'Artist' }),
						audioUrl: fields.url({ label: 'Audio URL' }),
						coverUrl: fields.url({ label: 'Cover URL' }),
					},
					{
						label: 'Music',
						description: 'Optional audio player track. Leave blank to omit.',
					},
				),
				links: fields.object(
					{
						small: fields.array(linkItem, {
							label: 'Small links',
							itemLabel: (props) =>
								props.fields.label.value ||
								props.fields.id.value ||
								'Link',
						}),
						large: fields.array(linkItem, {
							label: 'Large links',
							itemLabel: (props) =>
								props.fields.label.value ||
								props.fields.id.value ||
								'Link',
						}),
					},
					{ label: 'Links' },
				),
				content: fields.mdx({
					label: 'Content',
					extension: 'md',
				}),
			},
		}),
	},
});
