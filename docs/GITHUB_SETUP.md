# GitHub Repository Setup

After creating your GitHub repository, follow these steps to optimize it for discoverability:

## 1. Add Repository Topics

Go to your repository on GitHub and add these topics (tags):

```
typescript
mapping
type-safe
field-mapping
data-transformation
api
dto
domain-model
type-inference
bidirectional-mapping
zero-dependencies
```

**How to add topics:**
1. Go to https://github.com/kylebrodeur/type-safe-mapping
2. Click the gear icon ⚙️ next to "About" (top right)
3. Add topics in the "Topics" field
4. Click "Save changes"

## 2. Update Repository Description

Set the repository description to:
```
Zero-duplication field mapping for TypeScript with full type safety and inference. Transform data between different shapes (API ↔ Domain) without writing boilerplate.
```

## 3. Enable Discussions (Optional)

1. Go to repository Settings
2. Scroll to "Features" section
3. Check "Discussions"

This allows users to ask questions and share use cases.

## 4. Add Status Badges

The README already includes badge placeholders. After publishing to npm, they will automatically work.

## 5. Create a Release

To create your first release:

```bash
# Make sure everything is committed
git add .
git commit -m "feat: initial release v0.1.0"
git push

# Create and push a tag
git tag v0.1.0
git push origin v0.1.0
```

Then on GitHub:
1. Go to "Releases" → "Create a new release"
2. Choose the tag `v0.1.0`
3. Title: "Initial Release v0.1.0"
4. Description: Copy from CHANGELOG.md
5. Click "Publish release"

## 6. Publish to npm

```bash
# Make sure you're logged in to npm
npm login

# Build the package
npm run build

# Publish (the prepublishOnly script will run tests automatically)
npm publish
```

## 7. Add to npm Package Registries

After publishing, your package will appear on:
- https://www.npmjs.com/package/@kylebrodeur/type-safe-mapping
- https://www.jsdelivr.com/package/npm/@kylebrodeur/type-safe-mapping

## 8. Share Your Package

Share on:
- Twitter/X with hashtags: #TypeScript #JavaScript #OpenSource
- Reddit: r/typescript, r/javascript
- Dev.to: Write a blog post about your package
- TypeScript Discord communities

## 9. Monitor and Maintain

- Watch for GitHub issues
- Review pull requests
- Update dependencies periodically
- Add new features based on user feedback
- Keep the CHANGELOG.md up to date

## GitHub CLI Commands (Optional)

If you use GitHub CLI (`gh`), you can set topics programmatically:

```bash
gh repo edit kylebrodeur/type-safe-mapping \
  --add-topic typescript \
  --add-topic mapping \
  --add-topic type-safe \
  --add-topic field-mapping \
  --add-topic data-transformation
```

## Optional Automation

Consider setting up:

- **Automated releases**: Use semantic-release for automated versioning
- **Dependency updates**: Enable Dependabot in repository settings
- **Code coverage**: Upload coverage reports to Codecov
- **Documentation**: Auto-generate and deploy docs to GitHub Pages

Note: This package is part of a workspace and doesn't include standalone CI workflows.
