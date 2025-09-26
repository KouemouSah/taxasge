const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = mergeConfig(getDefaultConfig(__dirname), {
  resolver: {
    alias: {
      '@': './src',
      '@assets': './src/assets',
      '@components': './src/components',
      '@screens': './src/screens',
      '@services': './src/services',
      '@utils': './src/utils',
      '@types': './src/types',
      '@navigation': './src/navigation',
      '@store': './src/store',
      '@hooks': './src/hooks',
      '@constants': './src/constants',
      '@ml': './src/assets/ml'
    },
    assetExts: [
      // Default assets
      'bmp', 'gif', 'jpg', 'jpeg', 'png', 'psd', 'svg', 'webp',
      'm4v', 'mov', 'mp4', 'mpeg', 'mpg', 'webm',
      'aac', 'aiff', 'caf', 'm4a', 'mp3', 'wav',
      'html', 'pdf', 'yaml', 'yml',
      // ML and AI assets
      'tflite', 'json', 'bin', 'pb',
      // Font assets
      'ttf', 'otf', 'woff', 'woff2'
    ],
    sourceExts: [
      'js', 'jsx', 'ts', 'tsx', 'json',
      'mjs', 'cjs'
    ]
  },
  transformer: {
    // Enable Hermes for better performance
    hermesCommand: 'hermesc',

    // Asset transformer optimizations
    assetPlugins: ['react-native-asset-transformer'],

    // Enable inline requires for better performance
    inlineRequires: true,

    // TypeScript support
    babelTransformerPath: require.resolve('metro-react-native-babel-transformer'),

    // SVG transformer
    svgAssetPlugin: {
      httpServerLocation: '/assets/',
      getTransformCacheKeyFn: () => {
        return 'svgAssetPlugin';
      }
    }
  },
  serializer: {
    config: {
      // Enable tree shaking for smaller bundle size
      unstable_allowRequireContext: true
    }
  },
  server: {
    // Enhanced development server settings
    port: 8081,
    enhanceMiddleware: (middleware) => {
      return (req, res, next) => {
        // Add CORS headers for development
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        return middleware(req, res, next);
      };
    }
  },
  watchFolders: [
    // Watch ML assets folder for changes
    './src/assets/ml',
    // Watch shared data folder
    '../../data'
  ],
  resetCache: false
});

// Apply NativeWind configuration
module.exports = withNativeWind(config, {
  input: './src/styles/global.css',
  configPath: './tailwind.config.js'
});