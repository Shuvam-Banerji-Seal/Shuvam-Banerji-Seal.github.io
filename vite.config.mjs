import { defineConfig } from 'vite';
import { resolve } from 'path';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  root: '.',
  base: '/',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        resume: resolve(__dirname, 'pages/resume.html'),
        gallery: resolve(__dirname, 'pages/gallery.html'),
        blog: resolve(__dirname, 'pages/blog.html'),
        music: resolve(__dirname, 'pages/music.html'),
        tools: resolve(__dirname, 'pages/tools.html'),
        'github-projects': resolve(__dirname, 'pages/github-projects.html'),
        'mermaid-tool': resolve(__dirname, 'pages/mermaid-tool.html'),
        'audio-studio': resolve(__dirname, 'pages/tools/audio-studio.html'),
      },
    },

    minify: 'esbuild',
    sourcemap: false,
    assetsInlineLimit: 4096,
  },
  server: {
    port: 8080,
    host: true,
    open: true,
    fs: {
      // Allow serving files from parent directory (for symlinked assets)
      allow: ['..'],
      strict: false,
    },
  },
  preview: {
    port: 8080,
    host: true,
    open: 'pages/mermaid-tool.html',
  },
  resolve: {
    preserveSymlinks: true,
  },
});
