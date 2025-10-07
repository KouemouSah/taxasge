module.exports = {
  presets: ['@react-native/babel-preset'],
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
        '@constants': './src/constants',
        '@database': './src/database',
        '@config': './src/config'
      }
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