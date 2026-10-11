module.exports = function (api) {
  api.cache(true);

  return {
    presets: [['babel-preset-expo'], 'nativewind/babel'],

    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],

          alias: {
            '@': './src/',
            'tailwind.config': './tailwind.config.js',
          },
        },
      ],
      // Drizzle-Migrationen (.sql) werden beim Bündeln als Text eingebettet
      ['inline-import', { extensions: ['.sql'] }],
      'react-native-worklets/plugin',
    ],
  };
};
