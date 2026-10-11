const { getDefaultConfig } = require('expo/metro-config');
const { withNativewind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Drizzle-Migrationen: .sql-Dateien werden per babel-plugin-inline-import eingebettet
config.resolver.sourceExts.push('sql');

module.exports = withNativewind(config, { inlineRem: 16 });
