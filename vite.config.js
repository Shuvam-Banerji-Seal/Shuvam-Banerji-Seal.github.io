import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: '.',
  base: '/',
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
        'github-projects': resolve(__dirname, 'pages/github-projects.html'),
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
  },
  preview: {
    port: 8080,
    host: true,
  },
});
