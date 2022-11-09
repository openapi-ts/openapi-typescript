/** @type {import('@types/eslint').Linter.BaseConfig} */
module.exports = {
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: ["./tsconfig.json"],
  },
  extends: ["plugin:prettier/recommended", "eslint:recommended", "plugin:@typescript-eslint/recommended"],
  plugins: ["@typescript-eslint"],
  overrides: [
    {
      files: ["**/*.test.*"],
      rules: {
        "@typescript-eslint/ban-ts-comment": "off", // allow @ts-ignore only in tests
        "@typescript-eslint/no-empty-function": "off", // don’t enforce this in tests
      },
    },
  ],
};
