# scripts/

This directory contains utility scripts for deployment and development.

## Available Scripts

### `generate-deploy-key.sh`
Generates SSH key pair for GitHub Actions deployment.

**Usage:**
```bash
./scripts/generate-deploy-key.sh
```

**What it does:**
- Creates a new ED25519 SSH key pair
- Displays public key (for GitHub Deploy Keys)
- Displays base64-encoded private key (for GitHub Secrets)
- Provides step-by-step instructions

**When to use:**
- Setting up SSH-based deployment (advanced)
- Rotating deploy keys
- Setting up multiple deployment environments

**Note:** The current workflow uses `GITHUB_TOKEN` by default, which is simpler and doesn't require SSH keys.

## Adding More Scripts

When adding new scripts:
1. Make them executable: `chmod +x scripts/your-script.sh`
2. Add shebang line: `#!/bin/bash`
3. Include usage documentation
4. Update this README
