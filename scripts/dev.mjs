#!/usr/bin/env node
/**
 * Run Astro dev + private-content auto-migrate watcher together.
 */
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_ROOT = path.resolve(__dirname, "..");

const children = [];

function start(command, args, name) {
	const child = spawn(command, args, {
		cwd: APP_ROOT,
		stdio: "inherit",
		env: process.env,
		shell: process.platform === "win32",
	});
	child.on("exit", (code, signal) => {
		if (signal) return;
		shutdown(code ?? 0);
	});
	children.push({ child, name });
	return child;
}

function shutdown(code) {
	for (const { child } of children) {
		if (!child.killed) child.kill("SIGTERM");
	}
	process.exit(code);
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

start("node", [path.join(APP_ROOT, "scripts", "watch-private-content.mjs")], "content:watch");
start("astro", ["dev", ...process.argv.slice(2)], "astro");
