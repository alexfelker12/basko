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
      // lucide-Icons einzeln importieren, statt alle ~1.900 ins Bundle zu laden
      './babel/lucide-imports.js',
      'react-native-worklets/plugin',
    ],
  };
};
