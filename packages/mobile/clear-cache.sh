#!/bin/bash
echo "🧹 Cleaning Metro bundler cache..."

# Kill any running Metro processes
pkill -f "react-native" || true
pkill -f "metro" || true

# Clear Metro cache
rm -rf $TMPDIR/react-* 2>/dev/null || true
rm -rf $TMPDIR/metro-* 2>/dev/null || true
rm -rf $TMPDIR/haste-* 2>/dev/null || true

# Clear watchman
watchman watch-del-all 2>/dev/null || echo "Watchman not installed, skipping..."

# Clear node modules cache
rm -rf node_modules/.cache 2>/dev/null || true

# Clear React Native cache
npx react-native start --reset-cache &
METRO_PID=$!
sleep 3
kill $METRO_PID 2>/dev/null || true

# Clear Android build cache
rm -rf android/app/build 2>/dev/null || true
rm -rf android/build 2>/dev/null || true

# Clear iOS build cache
rm -rf ios/build 2>/dev/null || true
rm -rf ios/Pods 2>/dev/null || true

echo "✅ Cache cleared successfully!"
echo ""
echo "Next steps:"
echo "1. For Android: npx react-native run-android"
echo "2. For iOS: cd ios && pod install && cd .. && npx react-native run-ios"
