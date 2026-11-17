#!/usr/bin/env node
/**
 * Snapshot of public, non-fork GitHub repositories for the site.
 *
 *   node scripts/generate-github-data.mjs        → assets/data/github-repos.json
 *
 * Uses the `gh` CLI when it is installed and logged in, otherwise the public
 * REST API (set GITHUB_TOKEN to raise the rate limit, as the deploy workflow
 * does). If both fail, the existing snapshot is kept, so builds never break
 * on a network hiccup. Pages read this file for first paint and SEO; the
 * GitHub page refreshes star counts live when the API allows.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "assets/data/github-repos.json");
const USER = "Shuvam-Banerji-Seal";

function viaGh() {
  const raw = execFileSync(
    "gh",
    ["api", "--paginate", `users/${USER}/repos?per_page=100&type=owner`],
    { encoding: "utf8", maxBuffer: 64 * 1024 * 1024, stdio: ["ignore", "pipe", "ignore"] },
  );
  // --paginate concatenates JSON arrays: "][" between pages.
  return JSON.parse("[" + raw.trim().replace(/^\[|\]$/g, "").replace(/\]\s*\[/g, ",") + "]");
}

async function viaRest() {
  const headers = { Accept: "application/vnd.github+json", "User-Agent": "site-build" };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const all = [];
  for (let page = 1; page < 10; page++) {
    const r = await fetch(
      `https://api.github.com/users/${USER}/repos?per_page=100&type=owner&page=${page}`,
      { headers },
    );
    if (!r.ok) throw new Error(`GitHub API ${r.status}`);
    const batch = await r.json();
    all.push(...batch);
    if (batch.length < 100) break;
  }
  return all;
}

let repos;
try {
  repos = viaGh();
} catch {
  try {
    repos = await viaRest();
  } catch (e) {
    if (existsSync(OUT)) {
      console.warn(`github data: ${e.message}; keeping the existing snapshot`);
      process.exit(0);
    }
    throw e;
  }
}

const data = repos
  .filter((r) => !r.fork && !r.private)
  .map((r) => ({
    name: r.name,
    description: r.description || "",
    language: r.language || "",
    stars: r.stargazers_count || 0,
    forks: r.forks_count || 0,
    topics: r.topics || [],
    homepage: r.homepage || "",
    url: r.html_url,
    created: (r.created_at || "").slice(0, 10),
    pushed: (r.pushed_at || "").slice(0, 10),
    archived: !!r.archived,
  }))
  .sort((a, b) => b.pushed.localeCompare(a.pushed));

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(
  OUT,
  JSON.stringify({ user: USER, generated: new Date().toISOString().slice(0, 10), repos: data }, null, 1) + "\n",
);
console.log(`github data: ${data.length} public repositories → ${OUT.replace(ROOT + "/", "")}`);
