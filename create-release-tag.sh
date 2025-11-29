#!/bin/bash

# Team Pulse - Git Tag Creation for v1.0.0
# Run this to properly tag the production release

set -e

echo "🏷️  Team Pulse - Production Release Tagging"
echo "==========================================="
echo ""

VERSION="1.0.0"
TAG="v$VERSION"

echo "📦 Version: $VERSION"
echo "🏷️  Tag: $TAG"
echo ""

# Check if tag already exists
if git rev-parse "$TAG" >/dev/null 2>&1; then
    echo "⚠️  Tag $TAG already exists"
    read -p "Delete existing tag and recreate? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git tag -d "$TAG"
        git push origin ":refs/tags/$TAG" 2>/dev/null || true
        echo "✅ Deleted existing tag"
    else
        echo "❌ Aborted"
        exit 1
    fi
fi

# Ensure we're on main branch
CURRENT_BRANCH=$(git branch --show-current)
if [[ "$CURRENT_BRANCH" != "main" ]]; then
    echo "⚠️  Warning: Not on main branch (current: $CURRENT_BRANCH)"
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Aborted"
        exit 1
    fi
fi

# Check for uncommitted changes
if [[ -n $(git status --porcelain) ]]; then
    echo "⚠️  Warning: Uncommitted changes detected"
    git status --short
    echo ""
    read -p "Commit these changes first? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git add .
        git commit -m "chore: prepare for v$VERSION release"
        echo "✅ Changes committed"
    else
        echo "❌ Aborted - please commit or stash changes first"
        exit 1
    fi
fi

# Create annotated tag
echo ""
echo "📝 Creating annotated tag..."
git tag -a "$TAG" -m "Release v$VERSION - Production Ready

Features:
- GitLab integration for code metrics
- Jira integration for sprint management
- Optional Firebase integration for mobile metrics
- Developer performance analytics
- Sprint tracking and velocity analysis
- Multi-project filtering
- Historical data analysis
- Docker deployment ready
- Production deployment guides

Documentation:
- Comprehensive README.md
- Production deployment guide (PRODUCTION.md)
- Production checklist (PRODUCTION-CHECKLIST.md)
- Release notes (RELEASE.md)
- Contributing guidelines
- Security policy
- Code of conduct

CI/CD:
- GitHub Actions workflows
- Multi-node version testing
- Security audit automation
- Docker build testing
- Automated release creation

Status: Production Ready ✅
"

echo "✅ Tag created: $TAG"
echo ""

# Show tag details
echo "📋 Tag Details:"
git show "$TAG" --no-patch

echo ""
echo "✅ Tag creation complete!"
echo ""
echo "Next steps:"
echo "  1. Push tag to GitHub:"
echo "     git push origin $TAG"
echo ""
echo "  2. GitHub Actions will automatically create a release"
echo ""
echo "  3. Or manually create release at:"
echo "     https://github.com/CrashBytes/team-pulse/releases/new?tag=$TAG"
echo ""
echo "  4. Promote the release:"
echo "     - Announce on social media"
echo "     - Update documentation sites"
echo "     - Notify users and contributors"
echo ""
