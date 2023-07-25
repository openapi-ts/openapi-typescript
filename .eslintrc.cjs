/** @type {import('@types/eslint').Linter.BaseConfig} */
module.exports = {
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: ["./tsconfig.json"],
  },
  extends: ["eslint:recommended", "plugin:@typescript-eslint/strict", "plugin:vitest/recommended"],
  plugins: ["@typescript-eslint", "no-only-tests", "prettier", "vitest"],
  rules: {
    "@typescript-eslint/consistent-indexed-object-style": "off", // sometimes naming keys is more user-friendly
    "@typescript-eslint/no-dynamic-delete": "off", // delete is OK
    "@typescript-eslint/no-unnecessary-condition": "off", // this gives bad advice
    "no-console": "error",
    "no-unused-vars": "off",
  },
  overrides: [
    {
      files: ["**/*.test.*"],
      rules: {
        "@typescript-eslint/ban-ts-comment": "off", // allow @ts-ignore only in tests
        "@typescript-eslint/no-empty-function": "off", // don’t enforce this in tests
        "no-only-tests/no-only-tests": "error",
        "vitest/valid-title": "off", // doesn’t work?
      },
    },
  ],
};
