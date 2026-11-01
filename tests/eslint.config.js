const js = require('@eslint/js');
const globals = require('globals');

// The page loads data/content.js, data/content.en.js and app.js as classic scripts that
// share one global scope, so names declared in one file are globals in the next.
const content = Object.fromEntries(['commands', 'introNames', 'abbreviations', 'fullName', 'pipeScenarios', 'pipeFlagScenarios', 'professionalScenarios',
  'pipeTwoFlagScenarios', 'workflowScenarios', 'banditScenarios', 'BANDIT_MAP', 'guideUses', 'CONTENT',
  'Shell', 'ShellUnsupported', 'sameOutput', 'previewOutput', 'lessonFixture', 'banditFixture', 'MISSIONS', 'missionPassword',
  'COURSE', 'unitFixture', 'bossFixture', 'T', 'tr', 't', 'I18N', 'UNIT_2', 'UNIT_3', 'UNIT_4', 'UNIT_5', 'UNIT_6', 'READ', 'PARTS', 'RECORDED', 'WHAT', 'CHALLENGE', 'homeFixture', 'outputOf', 'printed', 'fileIs', 'Shell'].map(name => [name, 'readonly']));
// The prototype's i18n.js declares LANG and its app.js switches it.
content.LANG = 'writable';

module.exports = [
  {
    files: ['**/*.js'],
    ignores: ['**/sw.js'],
    languageOptions: { ecmaVersion: 2023, sourceType: 'script', globals: { ...globals.browser, ...content } },
    rules: {
      ...js.configs.recommended.rules,
      // Top-level functions are called from onclick attributes in index.html, and each
      // file's top-level names are used by the next file.
      'no-unused-vars': ['error', { vars: 'local', args: 'after-used' }],
      'no-redeclare': ['error', { builtinGlobals: false }],
      // localStorage can throw (private mode, blocked storage); the app then runs without saving.
      'no-empty': ['error', { allowEmptyCatch: true }],
    },
  },
  {
    files: ['**/sw.js'],
    languageOptions: { ecmaVersion: 2023, sourceType: 'script', globals: globals.serviceworker },
    rules: js.configs.recommended.rules,
  },
];
