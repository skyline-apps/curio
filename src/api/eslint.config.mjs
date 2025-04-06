import { defineConfig, globalIgnores } from "eslint/config";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import importPlugin from "eslint-plugin-import";
import noRelativeImportPaths from "eslint-plugin-no-relative-import-paths";
import prettier from "eslint-plugin-prettier";
import promise from "eslint-plugin-promise";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import unusedImports from "eslint-plugin-unused-imports";
import tsParser from "@typescript-eslint/parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";
import eslintLocalRules from "@local/eslint-local-rules";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default defineConfig([globalIgnores(["**/*.config.js"]), {
    extends: compat.extends("plugin:@typescript-eslint/recommended", "prettier"),

    plugins: {
        "@typescript-eslint": typescriptEslint,
        "no-relative-import-paths": noRelativeImportPaths,
        import: importPlugin,
        prettier,
        promise,
        "simple-import-sort": simpleImportSort,
        "unused-imports": unusedImports,
        "@local/eslint-local-rules": eslintLocalRules,
    },

    languageOptions: {
        parser: tsParser,
        ecmaVersion: "latest",
        sourceType: "module",

        parserOptions: {
            project: "./tsconfig.json",
        },
    },

    rules: {
        "@local/eslint-local-rules/api-middleware": "error",
        "@typescript-eslint/explicit-function-return-type": ["error", {
            allowExpressions: true,
        }],

        "@typescript-eslint/explicit-module-boundary-types": ["error", {
            allowDirectConstAssertionInArrowFunctions: true,
        }],

        "@typescript-eslint/no-explicit-any": "error",

        "@typescript-eslint/no-unused-vars": ["error", {
            argsIgnorePattern: "^_",
            varsIgnorePattern: "^_",
            caughtErrorsIgnorePattern: "^_",
        }],

        "import/first": "error",
        "import/newline-after-import": "error",
        "import/no-duplicates": "error",
        "no-console": ["error"],

        "no-relative-import-paths/no-relative-import-paths": ["error", {
            allowSameFolder: true,
        }],

        "no-restricted-imports": ["error", {
            patterns: [{
                group: ["@supabase/*"],
                message: "Please use `@api/lib/supabase` instead of `@supabase/*`",
            }, {
                group: ["drizzle-orm", "postgres"],
                message: "Please use `@api/db` for database utilities",
            }],
        }],

        "prettier/prettier": "error",
        "promise/catch-or-return": "error",
        "simple-import-sort/imports": "error",
        "simple-import-sort/exports": "error",
        "unused-imports/no-unused-imports": "error",
    },
}]);