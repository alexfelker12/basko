/**
 * Ergänzt `app.json` je EAS-Profil. Preview-APKs werden direkt installiert und enthalten sonst die
 * nativen Bibliotheken für alle vier Architekturen (armeabi-v7a, arm64-v8a, x86, x86_64) – das
 * waren rund drei Viertel der 110 MB. Für Preview daher nur arm64-v8a (praktisch alle Handys der
 * letzten Jahre). Production geht als App Bundle in den Play Store, der je Gerät nur die passende
 * Architektur ausliefert; Entwicklung bleibt bei allen (Emulatoren laufen auf x86_64).
 */
module.exports = ({ config }) => {
  // if (process.env.EAS_BUILD_PROFILE !== 'preview') return config;
  if (process.env.EAS_BUILD_PROFILE !== 'production') return config;

  return {
    ...config,
    plugins: config.plugins.map((plugin) =>
      Array.isArray(plugin) && plugin[0] === 'expo-build-properties'
        ? [
          plugin[0],
          { ...plugin[1], android: { ...plugin[1].android, buildArchs: ['arm64-v8a'] } },
        ]
        : plugin
    ),
  };
};
