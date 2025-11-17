# TaxasGE Mobile - App Icon Generation Guide

## Overview

This guide explains how to generate and install the TaxasGE app icon from the source `taxasge.png` file for Android devices.

**Source File:** `packages/mobile/src/assets/images/taxasge.png`

---

## 📱 Android Icon Requirements

Android requires multiple icon sizes for different screen densities (DPI):

| Density | Folder | Size | Usage |
|---------|--------|------|-------|
| MDPI | `mipmap-mdpi` | 48x48 px | ~160 DPI devices |
| HDPI | `mipmap-hdpi` | 72x72 px | ~240 DPI devices |
| XHDPI | `mipmap-xhdpi` | 96x96 px | ~320 DPI devices |
| XXHDPI | `mipmap-xxhdpi` | 144x144 px | ~480 DPI devices |
| XXXHDPI | `mipmap-xxxhdpi` | 192x192 px | ~640 DPI devices |

**Installation Location:**
```
packages/mobile/android/app/src/main/res/
├── mipmap-mdpi/ic_launcher.png (48x48)
├── mipmap-hdpi/ic_launcher.png (72x72)
├── mipmap-xhdpi/ic_launcher.png (96x96)
├── mipmap-xxhdpi/ic_launcher.png (144x144)
└── mipmap-xxxhdpi/ic_launcher.png (192x192)
```

---

## 🛠️ Method 1: Using ImageMagick (Recommended)

### Prerequisites
```bash
# Install ImageMagick
# Ubuntu/Debian:
sudo apt-get install imagemagick

# macOS:
brew install imagemagick

# Windows:
# Download from https://imagemagick.org/script/download.php
```

### Generate All Sizes
```bash
cd packages/mobile

# Navigate to source image directory
cd src/assets/images

# Create temporary output directory
mkdir -p icon_output

# Generate all required sizes
convert taxasge.png -resize 48x48 icon_output/ic_launcher_mdpi.png
convert taxasge.png -resize 72x72 icon_output/ic_launcher_hdpi.png
convert taxasge.png -resize 96x96 icon_output/ic_launcher_xhdpi.png
convert taxasge.png -resize 144x144 icon_output/ic_launcher_xxhdpi.png
convert taxasge.png -resize 192x192 icon_output/ic_launcher_xxxhdpi.png

# Copy to Android resource folders
cp icon_output/ic_launcher_mdpi.png ../../android/app/src/main/res/mipmap-mdpi/ic_launcher.png
cp icon_output/ic_launcher_hdpi.png ../../android/app/src/main/res/mipmap-hdpi/ic_launcher.png
cp icon_output/ic_launcher_xhdpi.png ../../android/app/src/main/res/mipmap-xhdpi/ic_launcher.png
cp icon_output/ic_launcher_xxhdpi.png ../../android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png
cp icon_output/ic_launcher_xxxhdpi.png ../../android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png

# Clean up
rm -rf icon_output

echo "✅ App icons generated and installed successfully!"
```

### Single Command Script
```bash
# From packages/mobile directory
cd packages/mobile

# Create and run generation script
cat > generate_icon.sh << 'EOF'
#!/bin/bash
set -e

echo "🎨 Generating TaxasGE app icons..."

SOURCE="src/assets/images/taxasge.png"
BASE_DIR="android/app/src/main/res"

# Check if source exists
if [ ! -f "$SOURCE" ]; then
  echo "❌ Error: Source file not found: $SOURCE"
  exit 1
fi

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
  echo "❌ Error: ImageMagick not installed. Install with:"
  echo "  Ubuntu/Debian: sudo apt-get install imagemagick"
  echo "  macOS: brew install imagemagick"
  exit 1
fi

# Generate icons for each density
echo "📐 Generating MDPI (48x48)..."
convert "$SOURCE" -resize 48x48 "$BASE_DIR/mipmap-mdpi/ic_launcher.png"

echo "📐 Generating HDPI (72x72)..."
convert "$SOURCE" -resize 72x72 "$BASE_DIR/mipmap-hdpi/ic_launcher.png"

echo "📐 Generating XHDPI (96x96)..."
convert "$SOURCE" -resize 96x96 "$BASE_DIR/mipmap-xhdpi/ic_launcher.png"

echo "📐 Generating XXHDPI (144x144)..."
convert "$SOURCE" -resize 144x144 "$BASE_DIR/mipmap-xxhdpi/ic_launcher.png"

echo "📐 Generating XXXHDPI (192x192)..."
convert "$SOURCE" -resize 192x192 "$BASE_DIR/mipmap-xxxhdpi/ic_launcher.png"

echo "✅ All app icons generated successfully!"
echo "📱 Icons installed in: $BASE_DIR/mipmap-*/"
EOF

chmod +x generate_icon.sh
./generate_icon.sh
```

---

## 🛠️ Method 2: Using @bam.tech/react-native-make

### Install Package
```bash
cd packages/mobile
npm install --save-dev @bam.tech/react-native-make
# or
yarn add -D @bam.tech/react-native-make
```

### Generate Icons
```bash
# From packages/mobile directory
npx react-native set-icon --path src/assets/images/taxasge.png
```

**Note:** This tool automatically generates all required sizes and updates AndroidManifest.xml if needed.

---

## 🛠️ Method 3: Online Tools (No Installation)

### Using AppIcon.co
1. Visit: https://www.appicon.co/
2. Upload `taxasge.png`
3. Select "Android" platform
4. Download generated ZIP file
5. Extract and copy contents to respective `mipmap-*` folders

### Using MakeAppIcon.com
1. Visit: https://makeappicon.com/
2. Upload `taxasge.png`
3. Click "Generate"
4. Download Android icons
5. Extract and install manually

---

## 🛠️ Method 4: Manual Resize (Any Image Editor)

If you have Photoshop, GIMP, or any image editor:

1. Open `taxasge.png`
2. Create 5 copies and resize each:
   - 48x48 → Save to `mipmap-mdpi/ic_launcher.png`
   - 72x72 → Save to `mipmap-hdpi/ic_launcher.png`
   - 96x96 → Save to `mipmap-xhdpi/ic_launcher.png`
   - 144x144 → Save to `mipmap-xxhdpi/ic_launcher.png`
   - 192x192 → Save to `mipmap-xxxhdpi/ic_launcher.png`

---

## ✅ Verification

After generating and installing icons:

### 1. Check Files Exist
```bash
cd packages/mobile/android/app/src/main/res

# Should show ic_launcher.png in each folder
ls -lh mipmap-mdpi/ic_launcher.png
ls -lh mipmap-hdpi/ic_launcher.png
ls -lh mipmap-xhdpi/ic_launcher.png
ls -lh mipmap-xxhdpi/ic_launcher.png
ls -lh mipmap-xxxhdpi/ic_launcher.png
```

### 2. Verify Sizes
```bash
# Using ImageMagick identify
identify mipmap-mdpi/ic_launcher.png    # Should be 48x48
identify mipmap-hdpi/ic_launcher.png    # Should be 72x72
identify mipmap-xhdpi/ic_launcher.png   # Should be 96x96
identify mipmap-xxhdpi/ic_launcher.png  # Should be 144x144
identify mipmap-xxxhdpi/ic_launcher.png # Should be 192x192
```

### 3. Clean Build
```bash
cd packages/mobile/android

# Clean previous builds
./gradlew clean

# Rebuild APK
./gradlew assembleDebug

# Generated APK will include new icons
# Location: android/app/build/outputs/apk/debug/app-debug.apk
```

### 4. Test on Device
1. Uninstall old app: `adb uninstall com.taxasge.app`
2. Install new APK: `adb install android/app/build/outputs/apk/debug/app-debug.apk`
3. Check launcher - icon should now show TaxasGE logo instead of default Android icon

---

## 🚀 Quick Start (Recommended)

For fastest setup, use **Method 1 (ImageMagick)** with the single command script:

```bash
# From repository root
cd packages/mobile

# Download and run the generation script
curl -O https://raw.githubusercontent.com/YOUR_REPO/scripts/generate_icon.sh
chmod +x generate_icon.sh
./generate_icon.sh

# Clean and rebuild
cd android
./gradlew clean assembleDebug
```

---

## 📝 Notes

- **Round Icons**: Android 8.0+ supports adaptive icons with `ic_launcher_round.png`. For now, we use standard icons.
- **Future Enhancement**: Consider creating `ic_launcher_foreground.xml` and `ic_launcher_background.xml` for adaptive icons
- **Vector Icons**: For best quality, consider using SVG source and `android:icon="@mipmap/ic_launcher"` in AndroidManifest.xml

---

## 🐛 Troubleshooting

### Icon Still Shows Android Default
**Solution:** Clear app cache and storage:
```bash
adb shell pm clear com.taxasge.app
adb uninstall com.taxasge.app
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

### Icons Look Blurry
**Solution:** Ensure source `taxasge.png` is high resolution (at least 512x512px recommended)

### ImageMagick Not Found
**Solution:** Install ImageMagick or use Method 2 or 3 instead

---

## 📚 Resources

- [Android Icon Guidelines](https://developer.android.com/guide/practices/ui_guidelines/icon_design_launcher)
- [React Native App Icon Documentation](https://reactnative.dev/docs/signed-apk-android#enabling-proguard-to-reduce-the-size-of-the-apk-optional)
- [ImageMagick Documentation](https://imagemagick.org/index.php)

---

**Last Updated:** 2025-11-17
**Maintainer:** TaxasGE Development Team
