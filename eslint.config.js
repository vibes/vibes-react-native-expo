const { defineConfig } = require('eslint/config');
const baseConfig = require('expo-module-scripts/eslint.config.base');
const universeWebConfig = require('eslint-config-universe/flat/web');

module.exports = defineConfig([
  ...baseConfig,
  ...universeWebConfig,
  {
    ignores: ['build/**', 'plugin/build/**'],
  },
]);
