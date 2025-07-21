// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from 'eslint-plugin-storybook'

import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import security from 'eslint-plugin-security'
import importPlugin from 'eslint-plugin-import'

export default tseslint.config(
  [
    {
      ignores: ['dist/**', 'node_modules/**', '.storybook/**'],
    },
    {
      files: ['**/*.{ts,tsx}'],
      ignores: ['vite.config.ts'],
      extends: [
        js.configs.recommended,
        ...tseslint.configs.recommended,
        security.configs.recommended,
      ],
      plugins: {
        'react-hooks': reactHooks,
        'react-refresh': reactRefresh,
        security,
        import: importPlugin,
      },
      languageOptions: {
        ecmaVersion: 2020,
        globals: globals.browser,
        parser: tseslint.parser,
        parserOptions: {
          project: './tsconfig.app.json',
        },
      },
      rules: {
        // Code Style Rules (CLAUDE.md requirements)
        semi: ['error', 'never'],
        'no-console': ['error', { allow: ['warn', 'error'] }],

        // TypeScript Rules
        '@typescript-eslint/no-explicit-any': 'error',
        '@typescript-eslint/no-floating-promises': 'error',
        '@typescript-eslint/no-unsafe-call': 'off', // Disabled for Redux compatibility
        '@typescript-eslint/no-unsafe-member-access': 'off', // Disabled for Redux compatibility
        '@typescript-eslint/no-unsafe-argument': 'off', // Disabled for Redux compatibility
        '@typescript-eslint/restrict-template-expressions': [
          'error',
          { allowNumber: true, allowBoolean: true },
        ],

        // Import Order Rules
        'import/order': [
          'error',
          {
            groups: [
              'builtin',
              'external',
              'internal',
              'parent',
              'sibling',
              'index',
              'object',
              'type',
            ],
            'newlines-between': 'always',
            alphabetize: { order: 'asc', caseInsensitive: true },
            pathGroups: [
              {
                pattern: '@/**',
                group: 'internal',
                position: 'before',
              },
            ],
            pathGroupsExcludedImportTypes: ['builtin'],
          },
        ],

        // Security Rules
        'security/detect-eval-with-expression': 'error',
        'security/detect-non-literal-require': 'error',

        // React Rules
        ...reactHooks.configs.recommended.rules,
        'react-refresh/only-export-components': [
          'warn',
          { allowConstantExport: true },
        ],
      },
    },
    {
      files: ['vite.config.ts', '.storybook/*.ts'],
      extends: [js.configs.recommended, ...tseslint.configs.recommended],
      languageOptions: {
        ecmaVersion: 2020,
        globals: globals.node,
        parser: tseslint.parser,
      },
      rules: {
        semi: ['error', 'never'],
      },
    },
  ],
  storybook.configs['flat/recommended']
)
