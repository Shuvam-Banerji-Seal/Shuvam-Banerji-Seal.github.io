# 🚀 GitHub Pages Deployment Setup Guide

## Overview
This guide will help you set up automated deployment of your portfolio website to GitHub Pages using GitHub Actions.

## Prerequisites
- GitHub repository with main branch
- Node.js and npm installed locally
- Basic knowledge of SSH keys

## 📋 Step-by-Step Setup

### 1. Generate SSH Deploy Key (Optional - for advanced setups)

```bash
# Generate a new SSH key pair
ssh-keygen -t ed25519 -C "deploy-key@github-actions" -f ~/.ssh/deploy_key

# This creates:
# - deploy_key (private key)
# - deploy_key.pub (public key)
```

### 2. Configure GitHub Repository

#### Option A: Using GitHub Token (Recommended - Simple)
The workflow is already configured to use `GITHUB_TOKEN` which is automatically provided by GitHub Actions. **No additional setup needed!**

#### Option B: Using SSH Deploy Key (Advanced)
If you want to use SSH keys:

1. Go to your repository settings: `https://github.com/Shuvam-Banerji-Seal/Shuvam-Banerji-Seal.github.io/settings/keys`
2. Click "Add deploy key"
3. Title: `GitHub Actions Deploy Key`
4. Key: Paste contents of `deploy_key.pub`
5. ✅ Check "Allow write access"
6. Click "Add key"

Then add the private key as a secret:
1. Go to: `https://github.com/Shuvam-Banerji-Seal/Shuvam-Banerji-Seal.github.io/settings/secrets/actions`
2. Click "New repository secret"
3. Name: `DEPLOY_SSH_KEY`
4. Value: Paste contents of `deploy_key` (private key)

### 3. Configure Environment Variables (Optional)

Create a `.env` file in your project root (already created):

```bash
cp .env.example .env
```

Edit `.env` and add your values:
```env
GITHUB_REPOSITORY=Shuvam-Banerji-Seal/Shuvam-Banerji-Seal.github.io
DEPLOY_BRANCH=gh-pages
DEPLOY_USER_NAME=Shuvam Banerji Seal
DEPLOY_USER_EMAIL=sbs22ms076@iiserkol.ac.in
```

### 4. Add Custom Domain (Optional)

If you have a custom domain:

1. Go to repository secrets: `https://github.com/Shuvam-Banerji-Seal/Shuvam-Banerji-Seal.github.io/settings/secrets/actions`
2. Add new secret:
   - Name: `CUSTOM_DOMAIN`
   - Value: `your-domain.com` (without https://)

### 5. Enable GitHub Pages

1. Go to repository settings: `https://github.com/Shuvam-Banerji-Seal/Shuvam-Banerji-Seal.github.io/settings/pages`
2. Under "Source", select:
   - **Branch:** `gh-pages`
   - **Folder:** `/ (root)`
3. Click "Save"

### 6. Trigger First Deployment

```bash
# Commit and push changes
git add .
git commit -m "Configure GitHub Pages deployment"
git push origin main
```

The GitHub Action will automatically:
1. ✅ Install dependencies
2. ✅ Build the project with Vite
3. ✅ Deploy to `gh-pages` branch
4. ✅ Make site available at: `https://shuvam-banerji-seal.github.io`

## 🔍 Monitoring Deployments

### View Deployment Status
1. Go to the "Actions" tab in your repository
2. Click on the latest workflow run
3. View logs and deployment status

### Deployment URL
- **Default:** `https://shuvam-banerji-seal.github.io`
- **Custom domain:** `https://your-custom-domain.com` (if configured)

## 🛠️ Workflow Features

### Automatic Triggers
- ✅ Pushes to `main` branch
- ✅ Manual trigger via "Actions" tab

### Build Process
- Node.js 20
- npm ci (clean install)
- Vite production build
- Optimized assets

### Deployment
- Deploys to `gh-pages` branch
- Force orphan (clean history)
- Jekyll disabled (SPA mode)
- Custom commit messages

### Security
- Minimal permissions
- Secure token handling
- Environment isolation

## 📝 Configuration Files

### `.github/workflows/deploy.yml`
Main deployment workflow configuration

### `.env.example`
Template for environment variables

### `.env`
Your local environment variables (not committed to git)

### `.gitignore`
Ensures `.env` is never committed

## 🔧 Troubleshooting

### Deployment fails with permissions error
**Solution:** Ensure GitHub Pages is enabled and set to `gh-pages` branch

### Build fails
**Solution:** 
```bash
# Test build locally
npm run build

# Check for errors
npm run lint:css
```

### Site shows 404
**Solution:** 
- Wait 1-2 minutes for GitHub Pages to update
- Check that `gh-pages` branch exists
- Verify repository settings

### Custom domain not working
**Solution:**
- Add `CUSTOM_DOMAIN` secret in repository settings
- Configure DNS records with your domain provider:
  - Add A records pointing to GitHub's IPs:
    - 185.199.108.153
    - 185.199.109.153
    - 185.199.110.153
    - 185.199.111.153
  - Or add CNAME record pointing to: `shuvam-banerji-seal.github.io`

## 🚦 Testing Deployment

### Local Testing
```bash
# Build locally
npm run build

# Preview build
npm run preview

# Serve with Python
npm run serve
```

### Manual Deployment Trigger
1. Go to "Actions" tab
2. Select "Deploy Portfolio to GitHub Pages"
3. Click "Run workflow"
4. Select branch: `main`
5. Click "Run workflow"

## 🔒 Security Best Practices

1. ✅ Never commit `.env` file
2. ✅ Use GitHub Secrets for sensitive data
3. ✅ Rotate SSH keys periodically (if using)
4. ✅ Use minimal permissions in workflow
5. ✅ Review deployment logs regularly

## 📚 Additional Resources

- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
- [peaceiris/actions-gh-pages](https://github.com/peaceiris/actions-gh-pages)

## 💡 Quick Commands

```bash
# Install dependencies
npm ci

# Build project
npm run build

# Preview build locally
npm run preview

# Clean build directory
npm run clean

# Format code
npm run format

# Lint CSS
npm run lint:css
```

## ✅ Deployment Checklist

- [ ] SSH key generated (if using SSH method)
- [ ] Deploy key added to GitHub (if using SSH method)
- [ ] GitHub Pages enabled in repository settings
- [ ] Source set to `gh-pages` branch
- [ ] `.env` file created and configured
- [ ] `.env` listed in `.gitignore`
- [ ] Custom domain secret added (if applicable)
- [ ] First deployment triggered
- [ ] Site accessible at deployment URL
- [ ] All pages loading correctly
- [ ] Animations working properly
- [ ] Mobile responsiveness verified

## 🎉 Success!

Once setup is complete, every push to `main` will automatically:
1. Build your portfolio
2. Deploy to GitHub Pages
3. Make it live at your URL

Your portfolio is now automatically deployed! 🚀
