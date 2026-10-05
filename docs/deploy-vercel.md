# Deploy on Vercel

Lander is designed to use Vercel to deploy builds after any commits are made in a public or private GitHub repo that hosts your content. By deploying with Vercel + Keystatic in Github Mode, you get an easy workflow that doesn't need to be maintained locally, making your admin panel (`/keystatic`) the place where you review, edit, and create new posts for your site.

After a Keystatic save in GitHub mode, Vercel rebuilds from the new commit. The live site updates when that deploy finishes.

## 1a. Fork the template

Fork this repository on GitHub so you own `your-user/your-fork`.

## 1b. or, Make your own repo

You can also make your own repo instead of forking the template. This currently needs work in order to allow for any folder in any repo to be used as a root, but you'll want to make sure your repo has a `/src` folder.

## 2. Create a GitHub App for Keystatic

Easiest path (local wizard):

1. Put your fork in `.env` as `PUBLIC_KEYSTATIC_GITHUB_REPO=your-user/your-fork`.
2. Run `npm run dev` and open `http://127.0.0.1:4321/keystatic`.
3. Use **Log in with GitHub** → **Create GitHub App** and follow the prompts.
4. Keystatic writes the App credentials into `.env`. Copy those to Vercel.

Manual path: [Keystatic GitHub mode](https://keystatic.com/docs/github-mode).

You will end up with:

- Client ID / Client secret / App slug
- A random `KEYSTATIC_SECRET`
- App installed on **your fork**


## 3. Import on Vercel

1. [Import](https://vercel.com/new) your fork into Vercel.
2. Framework preset: Astro (or leave auto-detect).
3. Add Environment Variables (Production + Preview):

| Variable | Example |
|----------|---------|
| `PUBLIC_KEYSTATIC_GITHUB_REPO` | `your-user/your-fork` |
| `KEYSTATIC_GITHUB_CLIENT_ID` | from the GitHub App |
| `KEYSTATIC_GITHUB_CLIENT_SECRET` | from the GitHub App |
| `KEYSTATIC_SECRET` | long random string |
| `PUBLIC_KEYSTATIC_GITHUB_APP_SLUG` | your GitHub App slug |

4. Deploy.

Use **Node 22.x** (see `engines` in `package.json`).

## 4. Open Keystatic

Visit:

```text
https://your-project.vercel.app/keystatic
```

Sign in with GitHub (you need write access to your repo). Create or edit a release starting from `template.md`.

## 5. Local development

```bash
npm install
npm run dev
```

Without the GitHub env vars, Keystatic uses **local** storage (`http://localhost:4321/keystatic`). Commit changes with git when you are ready.

To test GitHub mode locally, copy [`.env.example`](../.env.example) to `.env`, fill in the same values as Vercel, and restart `npm run dev`.

## Template vs your content

This repo ships as a template for your usage only. Everything you create in Keystatic is committed to your fork and is not part of the upstream template remote.