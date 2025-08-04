module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
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
    ['react-native-reanimated/plugin'],
  ],
};
