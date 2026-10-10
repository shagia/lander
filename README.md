# Lander (Working name)

Lander is a link aggregator and landing page template for artists, built with Astro and Keystatic.

## Deploy with Vercel

![Deploy with Vercel](https://vercel.com/button)

Lander is designed to use Vercel for deploying builds after any commits are made in a public or private GitHub repo that hosts your content. It could be this very repo, or you could create a separate repo dedicated to just your content in a /src/content folder.

By deploying with Vercel, setting Keystatic in Github Mode is a default, granting you an easy workflow dedicated to making new pages, editing them or reviewing them after deploying and logging into `/keystatic` to sign into your GitHub account.

The Deploy button on this section clones this template to your GitHub account, creates a Vercel project, and ships a live site for you.

---

Read the Vercel walkthrough here for more information, including setup instructions for the one-time GitHub App installation: **[docs/deploy-vercel.md](./docs/deploy-vercel.md)**

To get started with making your own separate content repo to pass to Vercel instead of saving content onto this repo, read the walkthrough here: [link]

## Quick start (local)

No Vercel account or GitHub account is required for local hosting and development. Content is stored on disk, you commit wherever or whenever you'd like.

```sh
npm install
npm run dev
```

Open `http://localhost:4321` and the admin at `http://localhost:4321/keystatic`.

Leave the Keystatic GitHub env vars empty (see `[.env.example](./.env.example)`) to keep Keystatic in local mode.

## Customization

Content and assets are easy to replace, either by utilizing `/Keystatic`, or dropping your files into the assets folder. Read the customize walkthrough here: **[docs/customize.md](./docs/customize.md)**

## Commands


| Command             | Action                            |
| ------------------- | --------------------------------- |
| `npm install`       | Install dependencies              |
| `npm run dev`       | Astro + Keystatic (local storage) |
| `npm run build`     | Production build (Vercel / Node)  |
| `npm run preview`   | Preview the production build      |
| `npm run astro ...` | Astro CLI                         |


