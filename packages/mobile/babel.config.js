module.exports = {
  presets: [
    ['module:metro-react-native-babel-preset', {
      unstable_transformProfile: 'hermes-stable'
    }],
    ['@babel/preset-typescript', {
      allowNamespaces: true,
      allowDeclareFields: true
    }]
  ],
  plugins: [
    // React Native Reanimated (must be first)
    'react-native-reanimated/plugin',

    // Module alias resolution
    ['module-resolver', {
      root: ['./src'],
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
      }
    }],

    // Transform runtime for better tree shaking
    ['@babel/plugin-transform-runtime', {
      helpers: true,
      regenerator: false
    }],

    // Optional chaining and nullish coalescing
    '@babel/plugin-proposal-optional-chaining',
    '@babel/plugin-proposal-nullish-coalescing-operator',

    // Class properties and private methods
    '@babel/plugin-proposal-class-properties',
    '@babel/plugin-proposal-private-methods',

    // Decorators support (for MobX, etc.)
    ['@babel/plugin-proposal-decorators', {
      legacy: true
    }],

    // NativeWind support
    'nativewind/babel',

    // React Native SVG transformer
    'react-native-svg-transformer/react-native',

    // Firebase optimization
    ['@babel/plugin-transform-react-jsx', {
      runtime: 'automatic'
    }]
  ],
  env: {
    production: {
      plugins: [
        // Remove console statements in production
        'transform-remove-console',

        // Dead code elimination
        '@babel/plugin-transform-dead-code-elimination',

        // Minification
        'minify-dead-code-elimination'
      ]
    },
    development: {
      plugins: [
        // Flipper support in development
        ['@babel/plugin-transform-react-jsx-development', {
          runtime: 'automatic'
        }]
      ]
    },
    test: {
      plugins: [
        // Jest transformations for testing
        '@babel/plugin-transform-modules-commonjs'
      ]
    }
  }
};