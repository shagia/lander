# Lander (Working name)

Lander is a link aggregator and landing page for artists, built with Astro and Keystatic.

## Quick start (local)

```sh
npm install
npm run dev
```

Open `http://localhost:4321` and the admin at `http://localhost:4321/keystatic`.  

Without any Keystatic GitHub environment variables, you'll be expected to provide content locally.

## Deploy on Vercel

Fork this repo, create a Keystatic GitHub App, set your environment variables, deploy. Then edit at `/keystatic`.

Full walkthrough: **[docs/deploy-vercel.md](./docs/deploy-vercel.md)**

Copy [`.env.example`](./.env.example) for the variable list.

## Commands

| Command | Action |
| :------ | :----- |
| `npm install` | Install dependencies |
| `npm run dev` | Astro + Keystatic (local storage) |
| `npm run build` | Production build (Vercel / Node) |
| `npm run preview` | Preview the production build |
| `npm run astro ...` | Astro CLI |
