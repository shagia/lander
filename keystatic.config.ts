import { config, fields, collection } from '@keystatic/core';

const linkItem = fields.object({
	id: fields.text({ label: 'ID', validation: { isRequired: true } }),
	label: fields.text({ label: 'Label', validation: { isRequired: true } }),
	href: fields.url({ label: 'URL', validation: { isRequired: true } }),
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
