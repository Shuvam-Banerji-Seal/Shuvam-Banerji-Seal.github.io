#!/bin/bash

# 🔐 SSH Deploy Key Generator for GitHub Actions
# This script generates SSH keys for GitHub Pages deployment

set -e

echo "🔐 GitHub Actions Deploy Key Generator"
echo "======================================"
echo ""

# Configuration
KEY_NAME="github_deploy_key"
KEY_TYPE="ed25519"
KEY_COMMENT="deploy-key@github-actions"
OUTPUT_DIR="$HOME/.ssh"

# Create .ssh directory if it doesn't exist
mkdir -p "$OUTPUT_DIR"

# Check if key already exists
if [ -f "$OUTPUT_DIR/$KEY_NAME" ]; then
    echo "⚠️  Warning: Deploy key already exists at $OUTPUT_DIR/$KEY_NAME"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Cancelled. Existing key preserved."
        exit 0
    fi
fi

echo "📝 Generating SSH key pair..."
ssh-keygen -t "$KEY_TYPE" -C "$KEY_COMMENT" -f "$OUTPUT_DIR/$KEY_NAME" -N ""

echo ""
echo "✅ SSH key pair generated successfully!"
echo ""
echo "Files created:"
echo "  - Private key: $OUTPUT_DIR/$KEY_NAME"
echo "  - Public key:  $OUTPUT_DIR/$KEY_NAME.pub"
echo ""

# Display public key
echo "📋 Public Key (add this to GitHub Deploy Keys):"
echo "================================================"
cat "$OUTPUT_DIR/$KEY_NAME.pub"
echo "================================================"
echo ""

# Base64 encode private key
echo "🔒 Private Key (base64 encoded for GitHub Secrets):"
echo "===================================================="
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    base64 -i "$OUTPUT_DIR/$KEY_NAME"
else
    # Linux
    base64 -w 0 "$OUTPUT_DIR/$KEY_NAME"
fi
echo ""
echo "===================================================="
echo ""

# Instructions
echo "📚 Next Steps:"
echo ""
echo "1. Add PUBLIC key to GitHub Deploy Keys:"
echo "   → Go to: https://github.com/Shuvam-Banerji-Seal/Shuvam-Banerji-Seal.github.io/settings/keys"
echo "   → Click 'Add deploy key'"
echo "   → Title: 'GitHub Actions Deploy Key'"
echo "   → Key: (paste the public key above)"
echo "   → ✅ Check 'Allow write access'"
echo "   → Click 'Add key'"
echo ""
echo "2. Add PRIVATE key to GitHub Secrets (if using SSH method):"
echo "   → Go to: https://github.com/Shuvam-Banerji-Seal/Shuvam-Banerji-Seal.github.io/settings/secrets/actions"
echo "   → Click 'New repository secret'"
echo "   → Name: DEPLOY_SSH_KEY"
echo "   → Value: (paste the base64 encoded private key above)"
echo "   → Click 'Add secret'"
echo ""
echo "3. Update .env file:"
echo "   → Open .env in your project"
echo "   → Add the base64 encoded key to DEPLOY_SSH_KEY="
echo ""
echo "⚠️  SECURITY NOTES:"
echo "   - Keep the private key secure"
echo "   - Never commit private keys to git"
echo "   - The .env file is already in .gitignore"
echo "   - Consider using GitHub Token (GITHUB_TOKEN) instead - it's simpler!"
echo ""
echo "✨ Setup complete! Your deploy key is ready."
echo ""

# Optional: Copy to clipboard (if available)
if command -v xclip &> /dev/null; then
    cat "$OUTPUT_DIR/$KEY_NAME.pub" | xclip -selection clipboard
    echo "📋 Public key copied to clipboard!"
elif command -v pbcopy &> /dev/null; then
    cat "$OUTPUT_DIR/$KEY_NAME.pub" | pbcopy
    echo "📋 Public key copied to clipboard!"
fi

echo ""
echo "🎉 Done!"
