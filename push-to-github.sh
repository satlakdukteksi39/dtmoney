#!/bin/bash
# Run this script to push to GitHub and trigger the Windows build
# Usage: ./push-to-github.sh YOUR_GITHUB_USERNAME YOUR_REPO_NAME

set -e

if [ $# -ne 2 ]; then
    echo "Usage: $0 <github_username> <repo_name>"
    echo "Example: $0 johndoe dtmoney"
    exit 1
fi

USERNAME=$1
REPO=$2

cd /root/dtmoney

echo "Initializing git repository..."
git init
git config user.name "Duktek AI"
git config user.email "ai@duktek.local"

echo "Adding all files..."
git add .

echo "Creating initial commit..."
git commit -m "dtmoney v1.0.0 - Complete personal finance manager with double-entry accounting, hierarchical accounts/categories, budgets, reports, and Windows installer"

echo "Adding GitHub remote..."
git remote add origin https://github.com/${USERNAME}/${REPO}.git

echo "Renaming branch to main..."
git branch -M main

echo "Pushing to GitHub..."
echo "You will be prompted for your GitHub credentials (username + personal access token)"
git push -u origin main

echo ""
echo "✅ Push complete!"
echo ""
echo "Next steps:"
echo "1. Go to https://github.com/${USERNAME}/${REPO}/actions"
echo "2. Watch the 'Build Windows Installer' workflow run"
echo "3. When complete, download the .exe from Artifacts or create a release tag:"
echo "   git tag v1.0.0 && git push origin v1.0.0"
echo "4. The .exe installer will be at: target/x86_64-pc-windows-msvc/release/bundle/nsis/dtmoney_1.0.0_x64-setup.exe"