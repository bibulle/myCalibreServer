import nx from '@nx/eslint-plugin';
import baseConfig from '../../eslint.config.mjs';

export default [
  ...baseConfig,
  ...nx.configs['flat/angular'],
  ...nx.configs['flat/angular-template'],
  {
    files: ['**/*.ts'],
    rules: {
      '@angular-eslint/directive-selector': [
        'warn',
        {
          type: 'attribute',
          prefix: 'myCalibreServer',
          style: 'camelCase',
        },
      ],
      '@angular-eslint/component-selector': [
        'warn',
        {
          type: 'element',
          prefix: 'my-calibre-server',
          style: 'kebab-case',
        },
      ],
      '@angular-eslint/prefer-standalone': 'off',
      // TODO(eslint-10-upgrade): newly-enforced rule now that lint actually
      // runs (it was previously silently broken) — 94 pre-existing call
      // sites still use constructor injection. Downgraded to warn so the
      // ESLint 10 upgrade doesn't force an unrelated mass refactor; migrate
      // via `ng generate @angular/core:inject` as a separate follow-up.
      '@angular-eslint/prefer-inject': 'warn',
      '@typescript-eslint/no-empty-function': 'warn',
      'no-useless-assignment': 'warn',
    },
  },
  {
    // TODO(eslint-10-upgrade): angular-eslint's templateAccessibility config
    // (now correctly wired via flat config) surfaces pre-existing a11y gaps
    // across the templates. Downgraded to warn — fixing these needs actual
    // UX/keyboard-interaction judgment, tracked as a separate follow-up.
    files: ['**/*.html'],
    rules: {
      '@angular-eslint/template/interactive-supports-focus': 'warn',
      '@angular-eslint/template/click-events-have-key-events': 'warn',
      '@angular-eslint/template/elements-content': 'warn',
      '@angular-eslint/template/alt-text': 'warn',
    },
  },
];
