#!/usr/bin/env node
/**
 * At build time, pull collection content from a separate GitHub repo when
 * PUBLIC_KEYSTATIC_GITHUB_REPO points somewhere other than the site repo.
 */
import { spawnSync } from "node:child_process";
import {
	cpSync,
	existsSync,
	mkdtempSync,
	readdirSync,
	rmSync,
	statSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_ROOT = path.resolve(__dirname, "..");

const COLLECTIONS = ["releases", "performances", "projects"];
const PUBLIC_RELEASE_FILES = new Set([".gitkeep", "template.md", "sample.md"]);
const PUBLIC_PROJECT_FILES = new Set([".gitkeep", "sample.md"]);
const PUBLIC_PERFORMANCE_FILES = new Set([".gitkeep", "sample.md"]);
const PUBLIC_ASSET_ENTRIES = new Set([".gitkeep", "template", "sample-cover.svg"]);

/** Optional brand overlay paths mirrored from the content repo. */
const BRAND_PATHS = [
	"src/Site.yaml",
	"src/content/site/About.md",
	"src/assets/ui/logo.svg",
	"src/assets/ui/logo-dark.svg",
	"src/assets/ui/logo-white.svg",
	"src/assets/ui/banner.svg",
	"src/assets/ui/banner.jpeg",
	"src/assets/ui/banner2.jpeg",
	"src/assets/ui/icon.svg",
	"src/assets/ui/icon.png",
	"public/favicon.svg",
	"public/favicon.ico",
];

function log(msg) {
	console.log(`[content:pull] ${msg}`);
}

function fail(msg) {
	console.error(`[content:pull] ${msg}`);
	process.exit(1);
}

function parseGithubRepo(value) {
	if (!value?.trim()) return undefined;
	const [owner, name, ...rest] = value.trim().split("/");
	if (!owner || !name || rest.length > 0) return undefined;
	return { owner, name, full: `${owner}/${name}` };
}

function readContentRepo() {
	return parseGithubRepo(
		process.env.PUBLIC_KEYSTATIC_GITHUB_REPO ||
			process.env.KEYSTATIC_GITHUB_REPO,
	);
}

function readSiteRepo() {
	const owner = process.env.VERCEL_GIT_REPO_OWNER;
	const slug = process.env.VERCEL_GIT_REPO_SLUG;
	if (owner && slug) return parseGithubRepo(`${owner}/${slug}`);

	// Local / non-Vercel: allow forcing a pull with CONTENT_PULL=1
	if (process.env.CONTENT_PULL === "1") return undefined;
	return null;
}

function shouldSkip(contentRepo, siteRepo) {
	if (!contentRepo) {
		log("no PUBLIC_KEYSTATIC_GITHUB_REPO — skip");
		return true;
	}
	// siteRepo === null means we could not detect the site repo and CONTENT_PULL
	// was not set → skip (safe default for local `npm run build`).
	if (siteRepo === null) {
		log(
			"site repo unknown (not on Vercel); set CONTENT_PULL=1 to force a pull — skip",
		);
		return true;
	}
	// siteRepo === undefined means CONTENT_PULL=1 forced a pull
	if (siteRepo && siteRepo.full === contentRepo.full) {
		log(`content repo matches site repo (${contentRepo.full}) — skip`);
		return true;
	}
	return false;
}

function isPublicEntry(collection, name, kind) {
	if (name.startsWith(".")) return true;
	if (kind === "content") {
		if (collection === "releases") return PUBLIC_RELEASE_FILES.has(name);
		if (collection === "projects") return PUBLIC_PROJECT_FILES.has(name);
		if (collection === "performances") {
			return PUBLIC_PERFORMANCE_FILES.has(name);
		}
		return name === ".gitkeep";
	}
	if (collection === "releases" && PUBLIC_ASSET_ENTRIES.has(name)) {
		return true;
	}
	return name === ".gitkeep";
}

function copyBrandOverlay(cloneRoot) {
	let count = 0;
	for (const rel of BRAND_PATHS) {
		const from = path.join(cloneRoot, rel);
		if (!existsSync(from)) continue;
		const to = path.join(APP_ROOT, rel);
		cpSync(from, to, { recursive: true, force: true });
		count += 1;
	}
	return count;
}

function copyTreeEntries(srcDir, destDir, collection, kind) {
	if (!existsSync(srcDir)) return 0;
	let count = 0;
	for (const name of readdirSync(srcDir)) {
		if (isPublicEntry(collection, name, kind)) continue;
		const from = path.join(srcDir, name);
		const to = path.join(destDir, name);
		const st = statSync(from);
		if (!st.isFile() && !st.isDirectory()) continue;
		cpSync(from, to, { recursive: true, force: true });
		count += 1;
	}
	return count;
}

function shallowClone(repo, token, dest) {
	const url = `https://x-access-token:${token}@github.com/${repo.full}.git`;
	const result = spawnSync(
		"git",
		["clone", "--depth", "1", "--single-branch", url, dest],
		{
			stdio: ["ignore", "pipe", "pipe"],
			encoding: "utf8",
			env: {
				...process.env,
				GIT_TERMINAL_PROMPT: "0",
			},
		},
	);
	if (result.status !== 0) {
		const stderr = (result.stderr || result.stdout || "").trim();
		// Never echo the token-bearing URL
		fail(
			`git clone failed for ${repo.full} (exit ${result.status})${stderr ? `: ${stderr.replaceAll(token, "***")}` : ""}`,
		);
	}
}

function main() {
	const contentRepo = readContentRepo();
	const siteRepo = readSiteRepo();

	if (shouldSkip(contentRepo, siteRepo)) {
		process.exit(0);
	}

	const token = process.env.CONTENT_GITHUB_TOKEN?.trim();
	if (!token) {
		fail(
			`two-repo mode: content is ${contentRepo.full} but CONTENT_GITHUB_TOKEN is missing`,
		);
	}

	const tmp = mkdtempSync(path.join(tmpdir(), "lander-content-"));
	try {
		log(`cloning ${contentRepo.full}`);
		shallowClone(contentRepo, token, tmp);

		let copied = 0;
		for (const collection of COLLECTIONS) {
			const contentSrc = path.join(tmp, "src", "content", collection);
			const contentDest = path.join(APP_ROOT, "src", "content", collection);
			const assetsSrc = path.join(tmp, "src", "assets", collection);
			const assetsDest = path.join(APP_ROOT, "src", "assets", collection);

			copied += copyTreeEntries(
				contentSrc,
				contentDest,
				collection,
				"content",
			);
			copied += copyTreeEntries(assetsSrc, assetsDest, collection, "assets");
		}
		const brandCopied = copyBrandOverlay(tmp);
		copied += brandCopied;

		log(
			`copied ${copied} entries from ${contentRepo.full} (${brandCopied} brand overlays)`,
		);
		if (copied === 0) {
			log(
				"warning: no files found — check that the content repo mirrors src/ and public/favicon*",
			);
		}
	} finally {
		rmSync(tmp, { recursive: true, force: true });
	}
}

main();
