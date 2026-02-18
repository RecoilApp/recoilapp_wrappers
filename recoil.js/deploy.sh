#!/usr/bin/env bash
#
# deploy.sh — Build and publish recoil.js to npmjs.com
#
# Usage:
#   ./deploy.sh [patch|minor|major]   (default: patch)
#   ./deploy.sh --dry-run [patch|minor|major]
#
# Environment variables:
#   NPM_TOKEN        — npm auth token (optional if already logged in)
#   NPM_OTP          — one-time password for 2FA-enabled accounts
#   SKIP_GIT_TAG     — set to "1" to skip git tagging
#
set -euo pipefail

# ─── Colours ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Colour

# ─── Helpers ──────────────────────────────────────────────────────────────────
info()    { echo -e "${CYAN}ℹ ${NC}$*"; }
success() { echo -e "${GREEN}✔ ${NC}$*"; }
warn()    { echo -e "${YELLOW}⚠ ${NC}$*"; }
error()   { echo -e "${RED}✖ ${NC}$*" >&2; }
step()    { echo -e "\n${BOLD}── $* ──${NC}"; }

# ─── Navigate to package root ────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"
info "Working directory: $SCRIPT_DIR"

# ─── Parse args ───────────────────────────────────────────────────────────────
DRY_RUN=false
BUMP="patch"

for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=true ;;
    patch|minor|major) BUMP="$arg" ;;
    -h|--help)
      echo "Usage: $0 [--dry-run] [patch|minor|major]"
      exit 0
      ;;
    *)
      error "Unknown argument: $arg"
      echo "Usage: $0 [--dry-run] [patch|minor|major]"
      exit 1
      ;;
  esac
done

if $DRY_RUN; then
  warn "Dry-run mode — nothing will be published or tagged."
fi

# ─── Pre-flight checks ───────────────────────────────────────────────────────
step "Pre-flight checks"

# Node & npm
command -v node >/dev/null 2>&1 || { error "node is not installed"; exit 1; }
command -v npm  >/dev/null 2>&1 || { error "npm is not installed";  exit 1; }
info "Node $(node -v) / npm $(npm -v)"

# Ensure dependencies are installed
if [ ! -d "node_modules" ]; then
  warn "node_modules not found — installing dependencies…"
  npm install
fi

# npm authentication
if [ -n "${NPM_TOKEN:-}" ]; then
  info "Using NPM_TOKEN from environment"
  echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" > .npmrc_deploy
  NPM_FLAGS="--userconfig .npmrc_deploy"
else
  NPM_FLAGS=""
  # Verify the user is already logged in
  if ! npm whoami $NPM_FLAGS >/dev/null 2>&1; then
    error "Not logged in to npm. Run 'npm login' first or set NPM_TOKEN."
    exit 1
  fi
fi

NPM_USER=$(npm whoami $NPM_FLAGS 2>/dev/null || echo "unknown")
success "Authenticated as ${BOLD}${NPM_USER}${NC}"

# Check for uncommitted changes
if command -v git >/dev/null 2>&1 && [ -d .git ] || git rev-parse --git-dir >/dev/null 2>&1; then
  if ! git diff --quiet --exit-code 2>/dev/null; then
    warn "You have uncommitted changes in the working tree."
    read -rp "Continue anyway? [y/N] " yn
    case "$yn" in [yY]*) ;; *) echo "Aborted."; exit 1 ;; esac
  fi
fi

# ─── Lint / type-check ───────────────────────────────────────────────────────
step "Type-checking"
npx tsc --noEmit
success "Type-check passed"

# ─── Clean previous build ────────────────────────────────────────────────────
step "Cleaning dist/"
rm -rf dist
success "Cleaned"

# ─── Build ────────────────────────────────────────────────────────────────────
step "Building"
npx tsc
success "Build complete → dist/"

# ─── Verify build output ─────────────────────────────────────────────────────
if [ ! -f "dist/index.js" ] || [ ! -f "dist/index.d.ts" ]; then
  error "Build output missing — expected dist/index.js and dist/index.d.ts"
  exit 1
fi
FILE_COUNT=$(find dist -type f | wc -l)
success "Build output verified (${FILE_COUNT} files)"

# ─── Version bump ────────────────────────────────────────────────────────────
step "Version bump (${BUMP})"

OLD_VERSION=$(node -p "require('./package.json').version")
info "Current version: ${OLD_VERSION}"

if $DRY_RUN; then
  # Calculate what the new version would be without writing
  IFS='.' read -r v_major v_minor v_patch <<< "$OLD_VERSION"
  case "$BUMP" in
    major) NEW_VERSION="$((v_major + 1)).0.0" ;;
    minor) NEW_VERSION="${v_major}.$((v_minor + 1)).0" ;;
    patch) NEW_VERSION="${v_major}.${v_minor}.$((v_patch + 1))" ;;
  esac
  info "(dry-run) Would bump to: ${NEW_VERSION}"
else
  npm version "$BUMP" --no-git-tag-version --allow-same-version
  NEW_VERSION=$(node -p "require('./package.json').version")
  success "Bumped to: ${NEW_VERSION}"
fi

# ─── Publish ──────────────────────────────────────────────────────────────────
step "Publishing to npmjs.com"

PUBLISH_ARGS="$NPM_FLAGS"
if [ -n "${NPM_OTP:-}" ]; then
  PUBLISH_ARGS="$PUBLISH_ARGS --otp $NPM_OTP"
fi

if $DRY_RUN; then
  info "(dry-run) Running: npm publish --access=public --dry-run ${PUBLISH_ARGS}"
  npm publish --dry-run $PUBLISH_ARGS
  success "(dry-run) Publish dry-run complete"
else
  info "Publishing recoil.js@${NEW_VERSION}…"
  npm publish $PUBLISH_ARGS --access public
  success "Published recoil.js@${NEW_VERSION} 🚀"
fi

# ─── Git tag ──────────────────────────────────────────────────────────────────
if [ "${SKIP_GIT_TAG:-}" != "1" ] && command -v git >/dev/null 2>&1; then
  if git rev-parse --git-dir >/dev/null 2>&1; then
    step "Git tagging"
    TAG="v${NEW_VERSION:-$OLD_VERSION}"
    if $DRY_RUN; then
      info "(dry-run) Would create tag: ${TAG}"
    else
      git add package.json package-lock.json 2>/dev/null || true
      git commit -m "release: recoil.js@${NEW_VERSION}" --allow-empty 2>/dev/null || true
      git tag -a "$TAG" -m "recoil.js ${NEW_VERSION}"
      success "Tagged ${TAG}"
      info "Push with: git push origin main --tags"
    fi
  fi
fi

# ─── Cleanup ──────────────────────────────────────────────────────────────────
[ -f .npmrc_deploy ] && rm -f .npmrc_deploy

# ─── Done ─────────────────────────────────────────────────────────────────────
echo ""
success "${BOLD}All done!${NC}"
if ! $DRY_RUN; then
  info "View on npm: https://www.npmjs.com/package/recoil.js"
fi
