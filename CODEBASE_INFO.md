# Shuvam Banerji Seal - Portfolio Codebase Documentation

This document serves as the single source of truth for all information regarding the portfolio codebase, including features, architecture, deployment, and development guides.

---

## 1. Project Overview & Features

Shuvam Banerji Seal's portfolio is a modern, responsive website highlighting research, projects, and skills in computational chemistry and computer science.

### Core Features
- **Professional Structure**: Organized directory structure with separated concerns.
- **Enhanced Performance**: Optimized CSS and JS with lazy loading and code splitting.
- **Mobile-First Design**: Fully responsive layout with touch-optimized interactions.
- **Dynamic Animations**: Smooth transitions using CSS animations and a custom JavaScript Animation Controller.
- **Accessibility**: Screen reader friendly, keyboard navigable, and respects motion preferences.
- **Theme System**: Integrated Dark/Light mode with persistence.
- **Mermaid Editor**: Professional-grade diagram editor with live preview and multi-format export.

---

## 2. Technical Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript, React 19.
- **Build Tool**: Vite.
- **Libraries**:
  - **3D**: Three.js
  - **Animations**: Animejs, GSAP
  - **Icons**: Lucide React
  - **Editor**: Monaco Editor
  - **Diagrams**: Mermaid.js
- **Services**: Formspree (Contact Form), GitHub Actions (Deployment).

---

## 3. Directory Structure

```
Shuvam-Banerji-Seal.github.io/
├── index.html                 # Main landing page
├── assets/                    # All static assets
│   ├── css/
│   │   ├── main.css          # Core styles
│   │   ├── animations.css    # Animation library
│   │   └── mobile.css        # Mobile utilities
│   ├── js/
│   │   ├── main.js          # Core functionality
│   │   └── enhanced.js      # Advanced features
│   └── documents/            # CVs and other PDFs
├── pages/                    # Secondary pages
│   ├── resume.html
│   ├── gallery.html
│   ├── blog.html
│   ├── music.html
│   └── mermaid-tool.html     # Mermaid Editor entry point
├── src/                      # Source code for React apps
│   └── mermaid-tool/         # Mermaid Editor React app
└── EFAML_WEB/               # Submodule for experimental project
```

---

## 4. Mermaid Diagram Editor

Integrated professional diagram editor allowing users to create, preview, and export Mermaid diagrams.

### Access
- Live URL: `https://shuvam-banerji-seal.github.io/pages/mermaid-tool.html`
- Navbar: Click the "Mermaid" link.

### Supported Diagrams
Flowcharts, Sequence Diagrams, Class Diagrams, State Diagrams, ER Diagrams, Gantt Charts, Pie Charts, Git Graphs, Mindmaps, Timelines, and more.

### Key Capabilities
- **Split View**: Desktop split-pane; Mobile tabbed interface.
- **Export**: SVG, PNG, PDF, JSON, and Markdown formats.
- **Persistence**: Auto-saves code and preferences to browser `localStorage`.
- **Keyboard Shortcuts**: `Ctrl+K` (Format), `Ctrl+/` (Comment), `Ctrl+Z` (Undo).

---

## 5. Audio Studio

A professional web-based audio recording and editing suite.

### Access
- Live URL: `https://shuvam-banerji-seal.github.io/pages/tools/audio-studio.html`
- Navbar: Click "Tools" -> "Audio Studio".

### Key Capabilities
- **Recording**: Multi-source input (Microphone, System Audio).
- **Editing**: Waveform visualization, Cut/Copy/Paste, Trim, Split.
- **Effects**: Equalizer (10-band), Compressor, Reverb, Delay, Pitch Shift, Noise Reduction.
- **Tools**: Integrated Instrument Tuner.
- **Export**: WAV, MP3, OGG, WebM with quality controls.

---

## 6. Music Library Management

The music library is managed via a Git submodule (`assets_for_my_website`).

### Update Workflow
1. Add files to the media repository.
2. Update the submodule: `git submodule update --remote --merge`.
3. Generate the manifest: `npm run generate:music`.
4. Commit and push: Includes `music-library.json` updates.

---

## 7. Deployment & Development

### Local Setup
```bash
npm install     # Install dependencies
npm run dev     # Start local development server (Vite)
npm run build   # Production build (dist/ folder)
npm run preview # Preview production build
```

### GitHub Pages Deployment
Automated via GitHub Actions. Every push to the `main` branch triggers:
1. Dependency installation.
2. Production build with optimization.
3. Pulse to the `gh-pages` branch.

### Manual Actions
- **Formatting**: `npm run format` (Prettier)
- **Linting**: `npm run lint:css` (Stylelint)
- **Security**: `npm audit`

---

## 8. Security & Best Practices

- **Privacy**: All processing is client-side. No data is sent to external servers (except API calls).
- **Sanitization**: Inputs are validated and sanitized to prevent XSS.
- **CDN Usage**: Reputable CDNs (cdnjs, unpkg) are used for large libraries.
- **Accessibility**: ARIA landmarks, roles, and labels are rigorously implemented.

---

## 9. Author Contact

**Shuvam Banerji Seal**
- Email: [sbs22ms076@iiserkol.ac.in](mailto:sbs22ms076@iiserkol.ac.in)
- GitHub: [Shuvam-Banerji-Seal](https://github.com/Shuvam-Banerji-Seal)
- LinkedIn: [mastersbs](https://linkedin.com/in/mastersbs)
- ORCID: [0009-0000-0714-569X](https://orcid.org/0009-0000-0714-569X)

---
*Last updated: January 2026*
