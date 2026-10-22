const js = require('@eslint/js');
const html = require('eslint-plugin-html');
const globals = require('globals');

module.exports = [
  {
    files: ['**/*.html'],
    plugins: { html },
    languageOptions: { ecmaVersion: 2023, sourceType: 'script', globals: globals.browser },
    rules: {
      ...js.configs.recommended.rules,
      // Top-level functions are called from onclick attributes in the markup.
      'no-unused-vars': ['error', { vars: 'local', args: 'after-used' }],
      // localStorage can throw (private mode, blocked storage); the app then runs without saving.
      'no-empty': ['error', { allowEmptyCatch: true }],
    },
  },
  {
    files: ['sw.js'],
    languageOptions: { ecmaVersion: 2023, sourceType: 'script', globals: globals.serviceworker },
    rules: js.configs.recommended.rules,
  },
];
