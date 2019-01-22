module.exports = {
  parser: 'babel-eslint',
  extends: ['prettier/react', 'airbnb'],
  plugins: ['prettier', 'import'],
  env: {
    jest: true,
  },
  rules: {
    'arrow-parens': 0,
    'comma-dangle': 0,
    'import/no-extraneous-dependencies': 0,
    'no-underscore-dangle': 0,
    'react/jsx-filename-extension': 0,
    'react/destructuring-assignment': 0,
  },
};
