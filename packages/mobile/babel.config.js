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
    '@babel/plugin-transform-optional-chaining',
    '@babel/plugin-transform-nullish-coalescing-operator',

    // Class properties and private methods
    '@babel/plugin-transform-class-properties',
    '@babel/plugin-transform-private-methods',

    // NativeWind support (commented out - not installed)
    // 'nativewind/babel',

    // React Native SVG transformer (commented out - not installed)
    // 'react-native-svg-transformer/react-native',

    // Firebase optimization
    ['@babel/plugin-transform-react-jsx', {
      runtime: 'automatic'
    }]
  ],
  env: {
    test: {
      plugins: [
        // Jest transformations for testing
        '@babel/plugin-transform-modules-commonjs'
      ]
    }
  }
};