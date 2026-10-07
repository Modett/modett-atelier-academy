const js = require('@eslint/js');
const tseslint = require('typescript-eslint');

// Shared flat config for every @modett workspace.
module.exports = tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '**/coverage/**',
      '**/.turbo/**',
      '**/*.config.js',
      '**/*.config.cjs',
      '**/*.config.mjs',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.ts'],
    languageOptions: {
      parserOptions: {
        projectService: true,
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
    },
  },
);
