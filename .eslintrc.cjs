/** @type {import('@types/eslint').Linter.BaseConfig} */
module.exports = {
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: ["./tsconfig.json"],
  },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/strict",
    "plugin:vitest/recommended",
  ],
  plugins: [
    "@typescript-eslint",
    "import",
    "no-only-tests",
    "prettier",
    "vitest",
  ],
  rules: {
    "@typescript-eslint/consistent-indexed-object-style": "off", // sometimes naming keys is more user-friendly
    "@typescript-eslint/consistent-type-imports": [
      "error",
      { prefer: "type-imports", fixStyle: "inline-type-imports" },
    ],
    "@typescript-eslint/no-dynamic-delete": "off", // delete is OK
    "@typescript-eslint/no-non-null-assertion": "off", // this is better than "as"
    "@typescript-eslint/no-shadow": "error",
    "@typescript-eslint/no-unnecessary-condition": "off", // this gives bad advice
    "arrow-body-style": ["error", "as-needed"],
    "dot-notation": "error",
    "import/newline-after-import": "error",
    "import/order": [
      "error",
      {
        alphabetize: {
          order: "asc",
          orderImportKind: "asc",
          caseInsensitive: true,
        },
        groups: [
          ["builtin", "external"],
          "internal",
          "parent",
          "index",
          "sibling",
        ],
      },
    ],
    curly: "error",
    "object-shorthand": "error", // don’t use foo["bar"]
    "no-console": "error",
    "no-global-assign": "error",
    "no-undef": "off", // handled by TS
    "no-unused-vars": "off",
  },
  overrides: [
    {
      files: ["**/*.test.*"],
      rules: {
        "@typescript-eslint/ban-ts-comment": "off", // allow @ts-ignore only in tests
        "@typescript-eslint/no-empty-function": "off", // don’t enforce this in tests
        "@typescript-eslint/no-explicit-any": "off", // tests sometimes need this
        "no-only-tests/no-only-tests": "error",
        "vitest/valid-title": "off", // doesn’t work?
      },
    },
  ],
};
