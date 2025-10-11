# Quick Deployment Setup

## 🚀 Fastest Way to Deploy (Recommended)

Your GitHub Actions workflow is **already configured** to work automatically with `GITHUB_TOKEN`. No SSH keys needed!

### Just follow these 3 steps:

1. **Enable GitHub Pages**
   ```bash
   # Go to: https://github.com/Shuvam-Banerji-Seal/Shuvam-Banerji-Seal.github.io/settings/pages
   # Set Source to: gh-pages branch
   ```

2. **Push to main branch**
   ```bash
   git add .
   git commit -m "Setup deployment"
   git push origin main
   ```

3. **Done!** 🎉
   - Your site will deploy automatically
   - Visit: https://shuvam-banerji-seal.github.io

## 🔑 Optional: Custom SSH Deploy Key Setup

If you want to use SSH keys (advanced):

### Generate Key
```bash
./scripts/generate-deploy-key.sh
```

### Add to GitHub
1. **Public Key** → Repository Settings → Deploy Keys
2. **Private Key** → Repository Settings → Secrets → `DEPLOY_SSH_KEY`

## 🌐 Custom Domain (Optional)

Add repository secret `CUSTOM_DOMAIN`:
```
your-domain.com
```

## 📁 Important Files

- `.env` - Your local environment variables (NOT committed)
- `.env.example` - Template for environment variables
- `.github/workflows/deploy.yml` - Deployment workflow
- `DEPLOYMENT_GUIDE.md` - Full documentation

## 🔒 Security

✅ `.env` is in `.gitignore`  
✅ Never commit secrets  
✅ Use GitHub Secrets for sensitive data

## 🆘 Need Help?

Read the full guide: [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
