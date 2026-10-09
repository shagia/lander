# Private content (maintainer / author only)

**End users deploying the template should ignore this file.**  
Use [deploy-vercel.md](./deploy-vercel.md) instead (one repo, Vercel, hosted `/keystatic`).

This document is for the **template author**: keep a public template remote that only ships `template.md`, while developing (and optionally deploying) a full private catalog separately.

## Why this exists

- The **public** app remote should stay a clean starter.
- Keystatic **local mode skips gitignored files**, so ignoring private releases in this repo hides them from `/keystatic`.
- A **sibling git repo** + symlinks gives local versioning without putting catalog files on the public remote.
- On Vercel, Keystatic GitHub mode only edits via the API — Astro still builds from disk. A build-time `content:pull` clones the private content repo when it differs from the site repo.

## Layout

```
Development/
  lander-concept/                 ← public template remote (site)
    src/site/*.yaml               ← placeholder Site Settings (overlaid when linked)
    src/assets/ui/                ← placeholder logos/banner
    src/content/releases/
      sample.md / template.md     ← tracked in the app
      daytona-rotary-groove.md    ← symlink → sibling (local only)
  lander-concept-content/         ← private brand + catalog git repo
    src/site/*.yaml               ← artist / images / theme / socials / mods
    src/assets/ui/                ← your logos / banner / icon
    public/favicon.*
    src/content/releases/         ← mirrors Keystatic paths
    src/content/performances/
    src/content/projects/
    src/assets/{releases,performances,projects}/
```

Default sibling path: `../lander-concept-content`  
Override with `CONTENT_REPO=/absolute/path`.

On GitHub, the catalog remote is whatever you set as `PUBLIC_KEYSTATIC_GITHUB_REPO` (example: `shagia/devin-sg-content`). That repo should mirror the same `src/*` and `public/favicon*` paths used above.

`npm run content:link` overlays brand files from the sibling when they exist (replacing template placeholders with symlinks, after saving a local backup under `.lander/brand-backup/`). `npm run content:unlink` removes those overlays and restores the backed-up template files (falling back to `git restore` per path). Overlay-only files that are not part of the template (for example a personal `logo-white.svg`) are simply removed.

## Local author workflow

```bash
# One-shot: move non-template files into the sibling repo and symlink back
npm run content:migrate

# Day-to-day: Astro + auto-migrate watcher (new Keystatic files → sibling)
npm run dev:private

# Or separately
npm run content:watch
npm run content:link
npm run content:status
npm run content:unlink
```

Commit catalog history in the sibling repo:

```bash
cd ../lander-concept-content
git add -A && git commit -m "Update release"
```

Optional: add a **private** remote on the sibling only—do not push catalog files to the public template remote.

Use `.git/info/exclude` in the app if you want `git add .` to skip private symlinks on your machine (see note in `.gitignore`).

## Two-repo Vercel deployment

Keep the **site** on Vercel linked to the app repo. Point Keystatic at the **private content** repo. At build time, `npm run content:pull` (wired into `npm run build`) shallow-clones that content repo when it differs from `VERCEL_GIT_REPO_OWNER`/`VERCEL_GIT_REPO_SLUG`.

```text
Public template remote  →  starter for other people
Site repo on Vercel     →  app code + /keystatic UI
Private content repo    →  catalog files Keystatic commits to
```

### Environment variables (site project)

Same Keystatic vars as [deploy-vercel.md](./deploy-vercel.md), plus:

| Variable | Example | Notes |
|----------|---------|--------|
| `PUBLIC_KEYSTATIC_GITHUB_REPO` | `shagia/devin-sg-content` | Must be the **content** repo, not the site repo |
| `CONTENT_GITHUB_TOKEN` | fine-grained PAT | **Contents: Read** on the private content repo only |

Do not reuse `KEYSTATIC_GITHUB_CLIENT_SECRET` for cloning — that is OAuth for the Admin UI, not git.

### Checklist

1. Vercel project is linked to the **site** repo (not the content repo).
2. Install the Keystatic GitHub App on the **content** repo; set the Keystatic env vars on Vercel.
3. Create a fine-grained PAT with read access to the content repo; add `CONTENT_GITHUB_TOKEN` for Production + Preview.
4. Create a **Deploy Hook** on the site project (Settings → Git → Deploy Hooks) for your production branch.
5. In the **content** repo, add the workflow from [examples/content-repo-deploy-hook.yml](./examples/content-repo-deploy-hook.yml) and set secret `VERCEL_DEPLOY_HOOK_URL` to the hook URL.
6. Deploy the site once (site push or manual deploy) to confirm `content:pull` copies entries in the build logs.
7. Edit via `/keystatic` → content commit → hook fires → site rebuilds with fresh files.

If a content-only deploy looks stale, append `?buildCache=false` to the Deploy Hook URL.

### Local test of the pull

```bash
CONTENT_PULL=1 CONTENT_GITHUB_TOKEN=ghp_… npm run content:pull
```

## End users

They use the Deploy button (or clone) and the one-repo GitHub mode flow in [deploy-vercel.md](./deploy-vercel.md). No sibling repo, no `CONTENT_GITHUB_TOKEN`, and no Deploy Hook required — `content:pull` no-ops when the Keystatic repo matches the site repo.
