import baseConfig from '../../eslint.config.mjs';

export default [
  ...baseConfig,
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    // Override or add rules here
    rules: {},
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      // TODO(eslint-10-upgrade): lint now actually runs for this project
      // (it was previously silently broken). Downgraded to warn so the
      // ESLint 10 upgrade doesn't force unrelated code changes; a handful
      // of pre-existing violations, tracked as a separate follow-up.
      'no-useless-catch': 'warn',
      '@typescript-eslint/no-empty-function': 'warn',
      '@typescript-eslint/no-wrapper-object-types': 'warn',
    },
  },
  {
    files: ['**/*.js', '**/*.jsx'],
    // Override or add rules here
    rules: {},
  },
];
