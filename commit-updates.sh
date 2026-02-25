#!/bin/bash

# Script to commit and push all changes to type-safe-mapping repository

set -e

echo "========================================="
echo "Committing updates to type-safe-mapping"
echo "========================================="

cd packages/type-safe-mapping

# Check if there are changes
if [ -z "$(git status --porcelain)" ]; then
    echo "No changes to commit"
    exit 0
fi

echo "Changes detected. Staging files..."
git add .

echo "Creating commit..."
git commit -m "docs: update README, add GitHub workflows, and improve discoverability

- Update package name from @workspace to @kylebrodeur
- Add badges for npm, license, TypeScript, and PRs
- Add CI/CD workflows for automated testing and publishing
- Add issue and PR templates
- Create comprehensive documentation (FAQ, ADVANCED.md, GITHUB_SETUP.md)
- Add examples directory with basic usage example
- Expand keywords for better npm discoverability
- Add CHANGELOG.md for version tracking
- Add CONTRIBUTING.md for contributors
- Configure .npmignore for clean npm package
- Add prepublishOnly script for safety
- Update README with table of contents and use cases"

echo "Pushing to GitHub..."
git push

echo "========================================="
echo "✓ Changes pushed successfully!"
echo "========================================="
echo ""
echo "Next steps:"
echo "1. Set repository topics on GitHub (see docs/GITHUB_SETUP.md)"
echo "2. Create a release tag: git tag v0.1.0 && git push origin v0.1.0"
echo "3. Publish to npm: npm publish"
echo ""
echo "Repository: https://github.com/kylebrodeur/type-safe-mapping"
