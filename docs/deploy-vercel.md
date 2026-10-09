# Deploy on Vercel

Get your own copy of Lander online, then edit it in the browser. Saves go to your GitHub repo, and Vercel rebuilds the site for you.

## 1. Deploy

Click **Deploy with Vercel** in the [README](../README.md), or open:

```text
https://vercel.com/new/clone?repository-url=https://github.com/shagia/lander
```

Sign in, pick a name for your new repo (something like `lander` is fine), and deploy. You can skip environment variables for now — the first deploy just needs the template.

When it’s done, hang on to:

- Your GitHub repo — e.g. `you/lander`
- Your site URL — e.g. `https://lander-xxx.vercel.app`

## 2. Connect Keystatic (one time)

To edit on the live site, Keystatic needs a small GitHub App tied to your repo. That setup runs best on your computer once, then you copy a few values into Vercel.

Clone the repo you just created:

```bash
git clone https://github.com/you/lander.git
cd lander
npm install
cp .env.example .env
```

In `.env`, set your repo (use your real GitHub username and repo name):

```bash
PUBLIC_KEYSTATIC_GITHUB_REPO=you/lander
```

Start the app:

```bash
npm run dev
```

Open [http://127.0.0.1:4321/keystatic](http://127.0.0.1:4321/keystatic), choose **Log in with GitHub**, then **Create GitHub App**.

When asked:

- Put your **Vercel site URL** in the deployed project field (so login works on the live site too)
- Point the App at the GitHub account that owns your repo

Install the App on your repo when prompted. Keystatic will fill the rest of `.env` for you (`KEYSTATIC_GITHUB_CLIENT_ID`, `KEYSTATIC_GITHUB_CLIENT_SECRET`, `KEYSTATIC_SECRET`, and `PUBLIC_KEYSTATIC_GITHUB_APP_SLUG`).

Prefer doing it by hand? See [Keystatic’s GitHub mode docs](https://keystatic.com/docs/github-mode).

## 3. Put those values on Vercel

In your Vercel project, open **Settings → Environment Variables**. Add these for Production and Preview, copying from your `.env`:

| Variable | Value |
|----------|--------|
| `PUBLIC_KEYSTATIC_GITHUB_REPO` | `you/lander` |
| `KEYSTATIC_GITHUB_CLIENT_ID` | from `.env` |
| `KEYSTATIC_GITHUB_CLIENT_SECRET` | from `.env` |
| `KEYSTATIC_SECRET` | from `.env` |
| `PUBLIC_KEYSTATIC_GITHUB_APP_SLUG` | from `.env` |

Redeploy from the **Deployments** tab so the new variables take effect.

## 4. Edit your site

Open `/keystatic` on your Vercel URL:

```text
https://your-project.vercel.app/keystatic
```

Sign in with GitHub, then create or edit a release (start from `template.md` if you like). When you save, Keystatic commits to your repo and Vercel picks up the change automatically.

## Working only on your machine

You don’t need Vercel or a GitHub App to try Lander locally:

```bash
npm install
npm run dev
```

Open [http://localhost:4321/keystatic](http://localhost:4321/keystatic). Leave the GitHub variables empty and Keystatic will save files on disk. Commit and push whenever you want your hosted site to update.

If you’ve already done steps 2–3, you can reuse that same `.env` locally to work in GitHub mode on your laptop too. See [`.env.example`](../.env.example) for the full list.

## Your content stays yours

The template is just a starting point. Everything you add in Keystatic lives in **your** repo, not in the upstream project.

## Separate content repo

Most people keep the site and content in one repo. If you want a private content repo instead, see [private-content.md](./private-content.md).
