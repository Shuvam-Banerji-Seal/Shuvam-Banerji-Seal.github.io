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
        // Primary Pages
        resume: resolve(__dirname, 'pages/resume.html'),
        gallery: resolve(__dirname, 'pages/gallery.html'),
        blog: resolve(__dirname, 'pages/blog.html'),
        music: resolve(__dirname, 'pages/music.html'),
        tools: resolve(__dirname, 'pages/tools.html'),
        'github-projects': resolve(__dirname, 'pages/github-projects.html'),
        'mermaid-tool': resolve(__dirname, 'pages/mermaid-tool.html'),
        notes: resolve(__dirname, 'pages/notes.html'),
        reader: resolve(__dirname, 'pages/reader.html'),
        thermodynamics: resolve(__dirname, 'pages/thermodynamics.html'),

        // Tool Pages
        'audio-studio': resolve(__dirname, 'pages/tools/audio-studio.html'),
        'equation-balancer': resolve(__dirname, 'pages/tools/equation-balancer.html'),
        games: resolve(__dirname, 'pages/tools/games.html'),
        'llm-chat': resolve(__dirname, 'pages/tools/llm-chat.html'),
        'mol-weight': resolve(__dirname, 'pages/tools/mol-weight.html'),
        'molecule-viz': resolve(__dirname, 'pages/tools/molecule-viz.html'),
        'paper-finder': resolve(__dirname, 'pages/tools/paper-finder.html'),
        'pdf-reducer': resolve(__dirname, 'pages/tools/pdf-reducer.html'),
        'pdf-to-jpg': resolve(__dirname, 'pages/tools/pdf-to-jpg.html'),
        'periodic-table': resolve(__dirname, 'pages/tools/periodic-table.html'),
        'ph-calculator': resolve(__dirname, 'pages/tools/ph-calculator.html'),
        'unit-converter': resolve(__dirname, 'pages/tools/unit-converter.html'),
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
