import path from "node:path";
import { fileURLToPath } from "node:url";

import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";
import eslintLocalRules from "@local/eslint-local-rules";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import { defineConfig, globalIgnores } from "eslint/config";
import importPlugin from "eslint-plugin-import";
import noRelativeImportPaths from "eslint-plugin-no-relative-import-paths";
import prettier from "eslint-plugin-prettier";
import promise from "eslint-plugin-promise";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import unusedImports from "eslint-plugin-unused-imports";
import globals from "globals";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default defineConfig([
  globalIgnores(["**/*.config.js", "**/dist/**", "**/node_modules/**"]),
  {
    extends: compat.extends(
      "plugin:@typescript-eslint/recommended",
      "prettier",
    ),

    plugins: {
      "@typescript-eslint": typescriptEslint,
      "no-relative-import-paths": noRelativeImportPaths,
      import: importPlugin,
      prettier,
      promise,
      react,
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      "simple-import-sort": simpleImportSort,
      "unused-imports": unusedImports,
      "@local/eslint-local-rules": eslintLocalRules,
    },

    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parser: tsParser,
      sourceType: "module",
    },

    rules: {
      ...reactHooks.configs.recommended.rules,
      "@local/eslint-local-rules/api-middleware": "error",
      "@local/eslint-local-rules/api-validation": "error",
      "@local/eslint-local-rules/response-parse": "error",
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      "@typescript-eslint/explicit-function-return-type": [
        "error",
        {
          allowExpressions: true,
        },
      ],

      "@typescript-eslint/explicit-module-boundary-types": [
        "error",
        {
          allowDirectConstAssertionInArrowFunctions: true,
        },
      ],

      "@typescript-eslint/no-explicit-any": "error",

      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],

      "import/first": "error",
      "import/newline-after-import": "error",
      "import/no-duplicates": "error",
      "no-console": ["error"],

      "no-relative-import-paths/no-relative-import-paths": [
        "error",
        {
          allowSameFolder: true,
        },
      ],

      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@heroui/react",
              message:
                "Please use components from the `@app/components/` library",
            },
            {
              name: "tailwind-merge",
              message: "Please use `cn` from `@app/utils/cn`",
            },
          ],
          patterns: [
            {
              group: ["@supabase/*"],
              message:
                "Please use `@app/api/lib/supabase` instead of `@supabase/*`",
            },
            {
              group: ["drizzle-orm", "postgres"],
              message: "Please use `@app/api/db` for database utilities",
            },
          ],
        },
      ],

      "prettier/prettier": "error",
      "promise/catch-or-return": "error",
      "react/function-component-definition": [
        2,
        {
          namedComponents: "arrow-function",
          unnamedComponents: "arrow-function",
        },
      ],
      "react/prop-types": "error",
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",
      "unused-imports/no-unused-imports": "error",
    },
    settings: {
      react: {
        version: "detect",
      },
    },
  },
  {
    files: ["components/ui/**/*"],
    rules: {
      "no-restricted-imports": "off",
    },
  },
]);
