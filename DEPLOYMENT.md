# Deployment Guide

## Quick Start

Your portfolio is now ready for deployment with a modern build system!

## Development Server (Local Testing)

```bash
# Start development server
npm run dev

# Access at: http://localhost:8080
# Mobile testing: http://192.168.1.2:8080 (on same network)
```

## Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview

# Clean build directory
npm run clean
```

## Automatic Deployment (Recommended)

### Setup GitHub Pages

1. Go to your repository settings on GitHub
2. Navigate to Pages section
3. Set Source to "GitHub Actions"
4. Done! The workflow will handle everything

### How It Works

Every time you push to the `main` branch:
1. GitHub Actions triggers automatically
2. Installs dependencies (`npm ci`)
3. Builds the project (`npm run build`)
4. Deploys to GitHub Pages

### Monitor Deployment

- Go to Actions tab in your repository
- See real-time build status
- Check logs if there are any issues

## Manual Deployment (If Needed)

If you need to deploy manually without GitHub Actions:

```bash
# Build the project
npm run build

# The dist/ folder contains production files
# Upload dist/ contents to your hosting provider
```

## Testing Before Deployment

### Local Testing Checklist

- [ ] Run `npm run dev` - Site works locally
- [ ] Test mobile view in browser DevTools
- [ ] Check menu opens/closes on mobile
- [ ] Verify no horizontal scrolling
- [ ] Test all navigation links
- [ ] Check forms work properly
- [ ] Test on actual mobile device (optional)

### Build Testing

```bash
# Build and preview
npm run build
npm run preview

# Check output
ls -lh dist/

# Should see:
# - index.html
# - pages/ directory
# - assets/ directory with CSS/JS
```

## Configuration

### GitHub Pages Settings

In `.github/workflows/deploy.yml`:
- Triggers on push to `main`
- Uses Node.js 20
- Builds with Vite
- Deploys to GitHub Pages

### Domain Setup (Optional)

To use a custom domain:

1. Add `CNAME` file to `public/` folder with your domain
2. Configure DNS settings with your provider
3. Update GitHub Pages settings

## Troubleshooting

### Build Fails

```bash
# Clear cache and reinstall
npm run clean
rm -rf node_modules package-lock.json
npm install

# Try building again
npm run build
```

### Deployment Fails

1. Check GitHub Actions logs
2. Ensure GitHub Pages is enabled
3. Verify source is set to "GitHub Actions"
4. Check repository permissions

### Site Not Updating

1. Clear browser cache (Ctrl+F5)
2. Wait 1-2 minutes for deployment
3. Check GitHub Actions completed successfully

### Mobile Issues

If mobile view still has issues:

```bash
# Check browser console for errors
# Verify mobile-fixes.css is loading
# Test in different browsers
# Check DevTools responsive design mode
```

## Performance

### Build Output

The build process:
- Minifies HTML, CSS, JavaScript
- Optimizes images
- Bundles assets efficiently
- Adds cache headers

### Expected Sizes

```
dist/
├── index.html (16 KB)
├── pages/ (various sizes)
└── assets/ (35 KB CSS bundled)
```

## Maintenance

### Regular Updates

```bash
# Update dependencies
npm update

# Check for security issues
npm audit

# Fix security issues
npm audit fix
```

### Code Quality

```bash
# Format all code
npm run format

# Lint CSS
npm run lint:css
```

## Next Steps

1. ✅ Push changes to GitHub
2. ✅ Verify GitHub Actions runs successfully
3. ✅ Test deployed site on mobile devices
4. ✅ Monitor performance and analytics

## Support

If you encounter issues:

1. Check `MOBILE_FIX_SUMMARY.md` for detailed fixes
2. Review GitHub Actions logs
3. Test locally with `npm run dev`
4. Check browser console for errors

## Success Criteria

Your deployment is successful when:

- ✅ Site loads at https://shuvam-banerji-seal.github.io
- ✅ No horizontal scrolling on mobile
- ✅ Mobile menu works properly
- ✅ All pages are accessible
- ✅ Content fits properly on all screen sizes
- ✅ Forms and interactions work smoothly

## Commands Reference

```bash
# Development
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
npm run serve        # Simple HTTP server (alternative)

# Code Quality
npm run format       # Format code with Prettier
npm run lint:css     # Lint CSS files

# Maintenance
npm run clean        # Clean build directory
npm update           # Update dependencies
npm audit            # Check security issues
```

## Congratulations! 🎉

Your portfolio is now:
- ✅ Fully responsive and mobile-friendly
- ✅ Using modern build tools (Vite)
- ✅ Automatically deployed via GitHub Actions
- ✅ Optimized for performance
- ✅ Ready for production!
