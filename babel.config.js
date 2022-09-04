module.exports = {
  presets: [['module:metro-react-native-babel-preset', {
    unstable_disableES6Transforms: true
  }]],
  plugins: [
    ['react-native-reanimated/plugin'],
    [
      'babel-plugin-root-import',
      {
        rootPathPrefix: '~',
        rootPathSuffix: 'src'
      }
    ]
  ]
};
