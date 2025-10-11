# Shuvam Banerji Seal - Portfolio Website

A modern, responsive portfolio website showcasing research, projects, and skills in computational chemistry and computer science.

## 🚀 Features

### Professional Structure
- **Modern Directory Organization**: Professional file structure with separated concerns
- **Enhanced Performance**: Optimized CSS and JavaScript for fast loading
- **Mobile-First Design**: Responsive layout that looks great on all devices
- **Dynamic Animations**: Smooth, performance-optimized animations and transitions
- **Accessibility**: Screen reader friendly with proper ARIA labels and keyboard navigation

### Technical Stack
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Build Tool**: Vite for development and production builds
- **Icons**: Lucide React Icons
- **Fonts**: Inter & Source Code Pro from Google Fonts
- **3D Graphics**: Three.js for interactive elements
- **Forms**: Formspree integration for contact form
- **Deployment**: GitHub Actions with automated builds

### Enhanced Features
- **Theme System**: Dark/Light mode with system preference detection
- **Animation Controller**: Advanced intersection observer-based animations
- **Performance Monitor**: Automatic optimization for low-end devices
- **Lazy Loading**: Optimized image loading for better performance
- **Mobile Navigation**: Smooth mobile menu with backdrop blur

## 📁 Directory Structure

```
Shuvam-Banerji-Seal.github.io/
├── index.html                 # Main landing page
├── assets/                    # All static assets
│   ├── css/
│   │   ├── main.css          # Core styles (formerly style.css)
│   │   ├── animations.css    # Advanced animations and transitions
│   │   └── mobile.css        # Mobile-first responsive utilities
│   ├── js/
│   │   ├── main.js          # Core functionality (formerly script.js)
│   │   └── enhanced.js      # Advanced features and animations
│   ├── images/              # Image assets (future)
│   ├── fonts/               # Custom fonts (future)
│   └── documents/
│       └── Shuvam_Banerji_Seal__CV.pdf
├── pages/                    # Secondary pages
│   ├── resume.html
│   ├── gallery.html
│   ├── blog.html
│   ├── music.html
│   ├── blog-post-sample.html
│   └── index_gform.html
├── components/               # Reusable components (future)
└── EFAML_WEB/               # External project
```

## 🎨 Animation System

### CSS Animation Classes
```css
/* Entrance animations */
.staggerFadeIn    /* Fade in with stagger effect */
.slideInLeft      /* Slide from left */
.slideInRight     /* Slide from right */
.scaleUp         /* Scale up animation */
.rotateIn        /* Rotate entrance */

/* Interactive effects */
.advanced-hover   /* Enhanced hover states */
.magnetic        /* Magnetic mouse attraction */
.pulse-on-hover  /* Pulse animation on hover */
.float-on-hover  /* Floating animation */

/* Utility classes */
.parallax-element /* Parallax scrolling effect */
.typewriter      /* Typewriter text effect */
```

### JavaScript Animation Controller
- **Intersection Observer**: Trigger animations when elements enter viewport
- **Performance Optimization**: Reduces animations on low-end devices
- **Mobile Optimization**: Touch-friendly interactions
- **Accessibility**: Respects user's motion preferences

## 📱 Mobile Optimization

### Responsive Design
- **Breakpoints**: Mobile-first approach with logical breakpoints
- **Touch Targets**: Minimum 44px touch targets for accessibility
- **Safe Areas**: Support for notched devices and safe areas
- **Performance**: Reduced animations and optimized rendering

### Enhanced Mobile Features
```css
/* Mobile-specific optimizations */
.mobile-optimized     /* Enhanced mobile interactions */
.touch-friendly       /* Better touch responsiveness */
.safe-area-padding   /* Device safe area support */
.reduced-motion      /* Accessibility for motion sensitivity */
```

## 🛠️ Development

### Prerequisites
- Node.js 18+ (for build tools)
- npm or yarn

### Installation
```bash
# Clone the repository
git clone https://github.com/Shuvam-Banerji-Seal/Shuvam-Banerji-Seal.github.io.git

# Navigate to directory
cd Shuvam-Banerji-Seal.github.io

# Install dependencies
npm install
```

### Local Development
```bash
# Start development server with Vite (recommended)
npm run dev

# Alternative: Start simple HTTP server
npm run serve

# Open browser
open http://localhost:8080
```

### Building for Production
```bash
# Build optimized production files
npm run build

# Preview production build locally
npm run preview

# Clean build directory
npm run clean
```

### Code Quality
```bash
# Format code with Prettier
npm run format

# Lint CSS files
npm run lint:css
```

### File Organization Principles
1. **Separation of Concerns**: CSS, JS, and HTML are properly separated
2. **Scalability**: Structure allows easy addition of new features
3. **Maintainability**: Clear naming conventions and organization
4. **Performance**: Optimized asset loading and caching strategies

## 🎯 Key Sections

### Homepage (`index.html`)
- **Hero Section**: Dynamic introduction with typewriter effect
- **About Section**: Personal information with animated elements
- **Projects Section**: Featured research and development projects
- **GitHub Integration**: Live repository statistics
- **Contact Form**: Integrated Formspree contact system

### Resume Page (`pages/resume.html`)
- **Professional Layout**: Clean, printable resume format
- **Timeline Design**: Visual timeline for experience
- **Skills Visualization**: Interactive skill displays
- **Download Options**: PDF resume available

### Additional Pages
- **Gallery**: Project showcases and visual content
- **Blog**: Technical writing and insights
- **Music**: Personal interests and hobbies

## 🔧 Customization

### Theme System
```javascript
// Theme Controller supports:
- System preference detection
- Manual theme switching
- Local storage persistence
- Animated transitions
```

### Animation Customization
```css
/* Customize animation timing */
:root {
  --animation-duration: 0.6s;
  --animation-easing: cubic-bezier(0.4, 0, 0.2, 1);
}

/* Disable animations for accessibility */
@media (prefers-reduced-motion: reduce) {
  * { animation: none !important; }
}
```

## 🌟 Performance Features

- **Lazy Loading**: Images load only when needed
- **Code Splitting**: JavaScript features load progressively
- **CSS Optimization**: Efficient selectors and minimal reflows
- **Mobile Optimization**: Reduced complexity on touch devices
- **Caching Strategy**: Proper HTTP headers for static assets

## 📈 SEO & Accessibility

- **Semantic HTML**: Proper heading hierarchy and landmarks
- **Meta Tags**: Comprehensive social media and search engine optimization
- **ARIA Labels**: Screen reader accessibility
- **Keyboard Navigation**: Full keyboard accessibility
- **Performance**: Lighthouse score optimization

## 🚀 Deployment

The website is automatically deployed to GitHub Pages using GitHub Actions.

### Quick Start
```bash
# Enable GitHub Pages (one-time setup)
# Go to: Settings → Pages → Source: gh-pages branch

# Deploy (automatic on push to main)
git add .
git commit -m "Update site"
git push origin main
```

### Deployment Features
- ✅ **Automatic Builds**: Triggered on push to main
- ✅ **Vite Optimization**: Production-ready builds
- ✅ **Custom Domain Support**: Optional CNAME configuration
- ✅ **Zero Downtime**: Seamless updates
- ✅ **Build Status**: Real-time deployment monitoring

### Documentation
- 📘 [Quick Start Guide](./DEPLOY_QUICK_START.md) - Get started in 3 steps
- 📚 [Full Deployment Guide](./DEPLOYMENT_GUIDE.md) - Comprehensive setup instructions
- 🔐 [SSH Key Generation](./scripts/generate-deploy-key.sh) - Optional advanced setup

**Live URL**: [https://shuvam-banerji-seal.github.io](https://shuvam-banerji-seal.github.io)

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the issues page.

## 📞 Contact

**Shuvam Banerji Seal**
- Email: sbs22ms076@iiserkol.ac.in
- GitHub: [@Shuvam-Banerji-Seal](https://github.com/Shuvam-Banerji-Seal)
- LinkedIn: [mastersbs](https://linkedin.com/in/mastersbs)

---
*Built with ❤️ using modern web technologies*