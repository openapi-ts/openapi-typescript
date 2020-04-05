module.exports = {
  parser: '@typescript-eslint/parser',
  extends: ['plugin:@typescript-eslint/recommended', 'prettier', 'prettier/@typescript-eslint'],
  plugins: ['@typescript-eslint', 'prettier'],
  rules: {
    '@typescript-eslint/camelcase': 'off',
    '@typescript-eslint/no-use-before-define': 'off',
    'prettier/prettier': 'error',
  },
  env: {
    jest: true,
  },
};
