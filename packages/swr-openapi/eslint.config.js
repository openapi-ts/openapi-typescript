import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import vitest from "@vitest/eslint-plugin";
import prettier from "eslint-config-prettier";

export default tseslint.config(
  { files: ["**/*.{js,mjs,cjs,ts}"] },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ["**/*.{js,ts}"],
    rules: {
      // openapi-fetch uses `{}` as Paths type
      "@typescript-eslint/no-empty-object-type": "off",
      // Allow `_` prefix for unused variables
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
        },
      ],
      // Allow throwing anything
      "@typescript-eslint/only-throw-error": "off",
    },
  },
  {
    files: ["**/__test__/**"],
    plugins: {
      vitest,
    },
    settings: {
      vitest: {
        typecheck: true,
      },
    },
    languageOptions: {
      globals: {
        ...vitest.environments.env.globals,
      },
    },
    rules: {
      ...vitest.configs.all.rules,
      "vitest/no-hooks": "off",
      "vitest/padding-around-expect-groups": "off",
      "vitest/prefer-lowercase-title": "off",
      "vitest/prefer-expect-assertions": "off",
      "vitest/prefer-to-be-falsy": "off",
      "vitest/prefer-to-be-truthy": "off",
      "vitest/require-hook": "off",
    },
  },
  prettier,
);
