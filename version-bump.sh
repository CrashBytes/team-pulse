#!/bin/bash

# Team Pulse Version Bump Script
# Usage: ./version-bump.sh [major|minor|patch]

set -e

VERSION_TYPE="${1:-patch}"

if [[ ! "$VERSION_TYPE" =~ ^(major|minor|patch)$ ]]; then
    echo "Error: Version type must be 'major', 'minor', or 'patch'"
    echo "Usage: ./version-bump.sh [major|minor|patch]"
    exit 1
fi

echo "🔄 Bumping $VERSION_TYPE version..."

# Get current version from root package.json
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo "📌 Current version: $CURRENT_VERSION"

# Calculate new version
IFS='.' read -ra VERSION_PARTS <<< "$CURRENT_VERSION"
MAJOR=${VERSION_PARTS[0]}
MINOR=${VERSION_PARTS[1]}
PATCH=${VERSION_PARTS[2]}

case $VERSION_TYPE in
    major)
        MAJOR=$((MAJOR + 1))
        MINOR=0
        PATCH=0
        ;;
    minor)
        MINOR=$((MINOR + 1))
        PATCH=0
        ;;
    patch)
        PATCH=$((PATCH + 1))
        ;;
esac

NEW_VERSION="$MAJOR.$MINOR.$PATCH"
echo "📌 New version: $NEW_VERSION"

# Confirm with user
read -p "Bump version to $NEW_VERSION? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Version bump cancelled"
    exit 1
fi

# Update package.json files
echo "📝 Updating package.json files..."

# Root package.json
node -e "
const pkg = require('./package.json');
pkg.version = '$NEW_VERSION';
require('fs').writeFileSync('./package.json', JSON.stringify(pkg, null, 2) + '\n');
"

# Backend package.json
node -e "
const pkg = require('./backend/package.json');
pkg.version = '$NEW_VERSION';
require('fs').writeFileSync('./backend/package.json', JSON.stringify(pkg, null, 2) + '\n');
"

# Frontend package.json
node -e "
const pkg = require('./frontend/package.json');
pkg.version = '$NEW_VERSION';
require('fs').writeFileSync('./frontend/package.json', JSON.stringify(pkg, null, 2) + '\n');
"

echo "✅ Updated all package.json files to $NEW_VERSION"

# Update CHANGELOG.md
echo "📝 Updating CHANGELOG.md..."
DATE=$(date +%Y-%m-%d)
CHANGELOG_ENTRY="## [$NEW_VERSION] - $DATE\n\n### Added\n- \n\n### Changed\n- \n\n### Fixed\n- \n\n"

# Insert new version section after "## [Unreleased]"
sed -i.bak "/## \[Unreleased\]/a\\
$CHANGELOG_ENTRY" CHANGELOG.md && rm CHANGELOG.md.bak

echo "✅ Updated CHANGELOG.md"

# Git operations
echo "📝 Creating git commit..."
git add package.json backend/package.json frontend/package.json CHANGELOG.md
git commit -m "chore: bump version to $NEW_VERSION"

# Create git tag
echo "🏷️  Creating git tag..."
git tag -a "v$NEW_VERSION" -m "Release v$NEW_VERSION"

echo ""
echo "✅ Version bump complete!"
echo ""
echo "📦 Version: $NEW_VERSION"
echo "🏷️  Tag: v$NEW_VERSION"
echo ""
echo "Next steps:"
echo "  1. Edit CHANGELOG.md to document changes"
echo "  2. git push origin main"
echo "  3. git push origin v$NEW_VERSION"
echo "  4. Create GitHub release from tag"
echo ""
