/**
 * Project: GitWarp
 * Description: ESLint v9 Flat Configuration for code quality.
 *
 * Author: B.A. Umberger (Old Man Umby)
 * Website: https://oldmanumby.com
 * GitHub: https://github.com/oldmanumby
 *
 * Copyright (c) 2026 B.A. Umberger.
 * Released under the MIT License.
 */
import js from '@eslint/js';

export default [
  { ignores: ['dist/', 'docs_temp/', 'docs/', 'test-blume.js'] },
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        document: 'readonly',
        window: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        URL: 'readonly',
        navigator: 'readonly',
        fetch: 'readonly',
        MutationObserver: 'readonly',
        performance: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': 'warn',
      'no-console': 'off',
      'no-useless-assignment': 'off',
      'no-empty': 'off',
      'no-useless-escape': 'off',
    },
  },
];
