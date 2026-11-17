import { defineConfig } from "vite";
import { resolve } from "path";
import react from "@vitejs/plugin-react";
import { readdirSync, statSync } from "fs";

function htmlEntries() {
  const entries = { main: resolve(__dirname, "index.html") };
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      const p = resolve(dir, name);
      if (statSync(p).isDirectory()) walk(p);
      else if (name.endsWith(".html")) {
        const rel = p.slice(resolve(__dirname, "pages").length + 1).replace(/\\/g, "/");
        const key = rel.replace(/\.html$/, "").replace(/\//g, "-");
        entries[key] = p;
      }
    }
  };
  walk(resolve(__dirname, "pages"));
  return entries;
}

export default defineConfig({
  plugins: [react()],
  root: ".",
  base: "/",
  publicDir: "public",
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      // Every HTML file under pages/ is an entry, plus the homepage, so new
      // pages and generated blog articles are built without editing this file.
      input: htmlEntries(),
    },

    minify: "esbuild",
    sourcemap: false,
    assetsInlineLimit: 4096,
    // Measured 2026-09-18 (after making mermaid a lazy import in
    // src/mermaid-tool/components/Preview.jsx, which cut the editor entry
    // chunk from 880 kB to 253 kB):
    //   cynefin 675 kB, mermaid.core 621 kB — both THIRD-PARTY engines that
    //   load on demand, only when that diagram type is rendered; they cannot
    //   be shrunk without dropping diagram support. Our own largest chunk is
    //   253 kB.
    // 700 kB keeps the guard meaningful: any chunk we produce that grows past
    // it (or a further third-party regression) trips the warning again.
    chunkSizeWarningLimit: 700,
  },
  server: {
    port: 8080,
    host: true,
    open: true,
    fs: {
      // Allow serving files from parent directory (for symlinked assets)
      allow: [".."],
      strict: false,
    },
  },
  preview: {
    port: 8080,
    host: true,
    open: "pages/mermaid-tool.html",
  },
  resolve: {
    preserveSymlinks: true,
  },
});
