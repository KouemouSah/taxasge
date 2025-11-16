#!/bin/bash

# ============================================================================
# TaxasGE Mobile - Standalone APK Build Script
# ============================================================================
# This script builds a standalone APK with bundled JavaScript and assets
# that can be installed offline without Metro server dependency
# ============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ANDROID_DIR="$PROJECT_DIR/android"
ASSETS_DIR="$ANDROID_DIR/app/src/main/assets"
BUNDLE_FILE="index.android.bundle"
SOURCE_MAP_FILE="index.android.bundle.map"

echo -e "${BLUE}============================================================================${NC}"
echo -e "${BLUE}TaxasGE Mobile - Building Standalone APK${NC}"
echo -e "${BLUE}============================================================================${NC}"
echo ""

# Step 1: Clean previous builds
echo -e "${YELLOW}[1/5] Cleaning previous builds...${NC}"
cd "$ANDROID_DIR"
./gradlew clean
rm -rf "$ASSETS_DIR"
echo -e "${GREEN}✓ Clean completed${NC}"
echo ""

# Step 2: Create assets directory
echo -e "${YELLOW}[2/5] Creating assets directory...${NC}"
mkdir -p "$ASSETS_DIR"
echo -e "${GREEN}✓ Assets directory created at: $ASSETS_DIR${NC}"
echo ""

# Step 3: Generate JavaScript bundle
echo -e "${YELLOW}[3/5] Generating JavaScript bundle...${NC}"
cd "$PROJECT_DIR"

# Use the offline environment if specified
ENV_FILE="${ENVFILE:-.env.offline}"
echo -e "${BLUE}Using environment file: $ENV_FILE${NC}"

npx react-native bundle \
  --platform android \
  --dev false \
  --entry-file index.js \
  --bundle-output "$ASSETS_DIR/$BUNDLE_FILE" \
  --assets-dest "$ASSETS_DIR" \
  --sourcemap-output "$ASSETS_DIR/$SOURCE_MAP_FILE" \
  --reset-cache

echo -e "${GREEN}✓ JavaScript bundle generated${NC}"
echo -e "${BLUE}  Bundle: $ASSETS_DIR/$BUNDLE_FILE${NC}"
echo -e "${BLUE}  Source map: $ASSETS_DIR/$SOURCE_MAP_FILE${NC}"
echo ""

# Step 4: Verify bundle creation
echo -e "${YELLOW}[4/5] Verifying bundle...${NC}"
if [ -f "$ASSETS_DIR/$BUNDLE_FILE" ]; then
    BUNDLE_SIZE=$(du -h "$ASSETS_DIR/$BUNDLE_FILE" | cut -f1)
    echo -e "${GREEN}✓ Bundle verified (Size: $BUNDLE_SIZE)${NC}"
else
    echo -e "${RED}✗ Error: Bundle file not found!${NC}"
    exit 1
fi

# List generated assets
echo -e "${BLUE}Generated assets:${NC}"
ls -lh "$ASSETS_DIR"
echo ""

# Step 5: Build APK
echo -e "${YELLOW}[5/5] Building release APK...${NC}"
cd "$ANDROID_DIR"

# Build release APK
./gradlew assembleRelease

echo -e "${GREEN}✓ APK build completed${NC}"
echo ""

# Display APK information
echo -e "${BLUE}============================================================================${NC}"
echo -e "${GREEN}Build Successful!${NC}"
echo -e "${BLUE}============================================================================${NC}"
echo ""
echo -e "${YELLOW}APK Location:${NC}"
APK_PATH="$ANDROID_DIR/app/build/outputs/apk/release/app-release.apk"
if [ -f "$APK_PATH" ]; then
    APK_SIZE=$(du -h "$APK_PATH" | cut -f1)
    echo -e "${GREEN}  $APK_PATH${NC}"
    echo -e "${BLUE}  Size: $APK_SIZE${NC}"
    echo ""
    echo -e "${YELLOW}SHA256:${NC}"
    sha256sum "$APK_PATH"
    echo ""
    echo -e "${YELLOW}Installation Instructions:${NC}"
    echo -e "${BLUE}  1. Copy the APK to your tablet${NC}"
    echo -e "${BLUE}  2. Enable 'Install from Unknown Sources' in Settings${NC}"
    echo -e "${BLUE}  3. Open the APK file to install${NC}"
    echo -e "${BLUE}  4. The app will run completely offline without Metro server${NC}"
else
    echo -e "${RED}  Error: APK file not found!${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}All done! Your standalone APK is ready for offline installation.${NC}"
echo -e "${BLUE}============================================================================${NC}"
