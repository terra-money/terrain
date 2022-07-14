module.exports = {
  env: {
    browser: true,
    es2021: true,
    'jest/globals': true,
  },
  extends: [
    'airbnb-base',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: [
    '@typescript-eslint',
    'jest',
  ],
  rules: {
    'import/extensions': 0,
    'import/no-unresolved': 0,
    'no-underscore-dangle': 0,
    'no-shadow': 0,
    'import/prefer-default-export': 0,
    '@typescript-eslint/ban-ts-comment': 'warn',
    '@typescript-eslint/no-var-requires': 'warn',
    '@typescript-eslint/ban-types': 'warn',
  },
  ignorePatterns: ['/packages/**', 'jest.config.ts'],
};
