module.exports = {
  presets: [
    ['@babel/preset-env', {
      targets: {
        node: 'current'
      }
    }],
    ['@babel/preset-typescript', {
      allowNamespaces: true,
      allowDeclareFields: true
    }]
  ],
  plugins: [
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
        '@constants': './src/constants'
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

    // React JSX optimization
    ['@babel/plugin-transform-react-jsx', {
      runtime: 'automatic'
    }]
  ],
  env: {
    test: {
      plugins: [
        '@babel/plugin-transform-modules-commonjs'
      ]
    }
  }
};