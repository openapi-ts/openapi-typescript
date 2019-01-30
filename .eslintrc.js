module.exports = {
  parser: '@typescript-eslint/parser',
  extends: ['prettier/react', 'airbnb'],
  plugins: ['prettier', 'import'],
  env: {
    jest: true,
  },
  rules: {
    'arrow-parens': 0,
    'comma-dangle': 0,
    'function-paren-newline': 0, // let Prettier handle it
    'implicit-arrow-linebreak': 0, // let Prettier handle it
    'import/no-extraneous-dependencies': 0,
    'object-curly-newline': 0, // let Prettier handle it
    'no-underscore-dangle': 0,
    'react/jsx-filename-extension': 0,
    'react/destructuring-assignment': 0,
    'space-before-function-paren': 0, // let Prettier handle it
  },
};
