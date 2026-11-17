#!/usr/bin/env node
/**
 * Tell search engines that pages changed, through IndexNow
 * (https://www.indexnow.org). Bing, Yandex, Seznam and Naver share
 * submissions; Bing's index also feeds ChatGPT search and Copilot.
 *
 *   node scripts/indexnow.mjs              # pages whose lastmod is within 2 days
 *   node scripts/indexnow.mjs --days 7
 *   node scripts/indexnow.mjs --all        # every URL in the sitemap
 *   node scripts/indexnow.mjs --dry-run    # print, do not send
 *
 * Needs the key file public/<32 hex>.txt (served at the site root) to be
 * live before submitting, so the deploy workflow runs this after deploy.
 * Never fails the build: network or API errors only print a warning.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SITE = "https://shuvam-banerji-seal.github.io";
const args = process.argv.slice(2);
const all = args.includes("--all");
const dry = args.includes("--dry-run");
const days = Number(args[args.indexOf("--days") + 1]) || 2;

const keyFile = readdirSync(join(ROOT, "public")).find((f) => /^[0-9a-f]{32}\.txt$/.test(f));
if (!keyFile) {
  console.warn("indexnow: no key file in public/, nothing sent");
  process.exit(0);
}
const key = keyFile.slice(0, -4);

const xml = readFileSync(join(ROOT, "public/sitemap.xml"), "utf8");
const since = new Date(Date.now() - days * 864e5).toISOString().slice(0, 10);
const urls = [...xml.matchAll(/<url><loc>([^<]+)<\/loc><lastmod>([^<]+)<\/lastmod>/g)]
  .filter(([, , lastmod]) => all || lastmod >= since)
  .map(([, loc]) => loc);

if (!urls.length) {
  console.log(`indexnow: no pages changed since ${since}`);
  process.exit(0);
}
console.log(`indexnow: ${urls.length} URL(s)${all ? "" : ` changed since ${since}`}`);
if (dry) {
  urls.forEach((u) => console.log("  " + u));
  process.exit(0);
}

try {
  const live = await fetch(`${SITE}/${keyFile}`);
  if (!live.ok || (await live.text()).trim() !== key) {
    console.warn(`indexnow: key file not live yet (${live.status}); nothing sent`);
    process.exit(0);
  }
  const r = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({ host: new URL(SITE).host, key, keyLocation: `${SITE}/${keyFile}`, urlList: urls }),
  });
  // 200 OK and 202 Accepted both mean the submission was received.
  console.log(`indexnow: HTTP ${r.status}${r.ok ? " (received)" : " " + (await r.text()).slice(0, 200)}`);
} catch (e) {
  console.warn(`indexnow: ${e.message}; nothing sent`);
}
