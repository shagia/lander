#!/usr/bin/env node
/**
 * Watch collection dirs for new Keystatic writes (real files, not symlinks),
 * then migrate them into the sibling content repo and re-link.
 */
import { spawn } from "node:child_process";
import { watch } from "node:fs";
import { lstat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_ROOT = path.resolve(__dirname, "..");
const SCRIPT = path.join(APP_ROOT, "scripts", "link-private-content.sh");

const PUBLIC_NAMES = new Set([".gitkeep", "template.md", "template"]);
const WATCH_DIRS = [
	"src/content/releases",
	"src/content/performances",
	"src/content/projects",
	"src/assets/releases",
	"src/assets/performances",
	"src/assets/projects",
].map((p) => path.join(APP_ROOT, p));

const DEBOUNCE_MS = 900;
let timer = null;
let running = false;
let rerun = false;

function log(msg) {
	console.log(`[content:watch] ${msg}`);
}

function runMigrate() {
	return new Promise((resolve) => {
		const child = spawn("bash", [SCRIPT, "--migrate", "--quiet"], {
			cwd: APP_ROOT,
			stdio: "inherit",
			env: process.env,
		});
		child.on("exit", (code) => resolve(code ?? 0));
	});
}

async function flush() {
	if (running) {
		rerun = true;
		return;
	}
	running = true;
	try {
		log("new local files detected — migrate + link");
		await runMigrate();
	} finally {
		running = false;
		if (rerun) {
			rerun = false;
			schedule();
		}
	}
}

function schedule() {
	clearTimeout(timer);
	timer = setTimeout(() => {
		void flush();
	}, DEBOUNCE_MS);
}

async function isInteresting(watchDir, filePath) {
	const rel = path.relative(watchDir, filePath);
	if (!rel || rel.startsWith("..") || path.isAbsolute(rel)) return false;

	const topName = rel.split(path.sep)[0];
	if (!topName || PUBLIC_NAMES.has(topName) || topName.startsWith(".")) {
		return false;
	}

	const topPath = path.join(watchDir, topName);
	try {
		const st = await lstat(topPath);
		// Only act when Keystatic created a real top-level entry (not a symlink).
		if (st.isSymbolicLink()) return false;
		return st.isFile() || st.isDirectory();
	} catch {
		return false;
	}
}

async function hasPendingPrivateEntries() {
	for (const dir of WATCH_DIRS) {
		let entries;
		try {
			entries = await import("node:fs/promises").then((fs) => fs.readdir(dir));
		} catch {
			continue;
		}
		for (const name of entries) {
			if (PUBLIC_NAMES.has(name) || name.startsWith(".")) continue;
			try {
				const st = await lstat(path.join(dir, name));
				if (!st.isSymbolicLink() && (st.isFile() || st.isDirectory())) {
					return true;
				}
			} catch {
				// ignore
			}
		}
	}
	return false;
}

function onFsEvent(watchDir, filePath) {
	if (!filePath) {
		void hasPendingPrivateEntries().then((ok) => {
			if (ok) schedule();
		});
		return;
	}
	void isInteresting(watchDir, filePath).then((ok) => {
		if (ok) schedule();
	});
}

async function main() {
	log("initial migrate + link");
	await runMigrate();

	for (const dir of WATCH_DIRS) {
		watch(dir, { recursive: true }, (_event, filename) => {
			if (!filename) {
				// Ambiguous event — scan by scheduling; migrate is cheap/idempotent
				schedule();
				return;
			}
			onFsEvent(dir, path.join(dir, filename));
		});
		log(`watching ${path.relative(APP_ROOT, dir)}`);
	}

	log("auto-migrate armed — save a Keystatic entry to test");
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
