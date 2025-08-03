module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    ['react-native-reanimated/plugin'],
    [
      'module-resolver',
      {
        root: ['./src'],
        alias: {
          '~': './src',
          '~/components': './src/components',
          '~/global': './src/global',
          '~/store': './src/store',
        },
      },
    ],
  ]
};
