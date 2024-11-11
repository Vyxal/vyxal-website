import typescriptEslint from "@typescript-eslint/eslint-plugin";
import stylistic from "@stylistic/eslint-plugin";
import stylisticJsx from "@stylistic/eslint-plugin-jsx";
import tsParser from "@typescript-eslint/parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all,
});

export default [
    ...compat.extends("eslint:recommended", "plugin:@typescript-eslint/recommended", "plugin:react-hooks/recommended"),
    {
        ignores: ["*.cjs", "src/**/historic/*", "dist/*"],
    },
    {
        files: ["**/*.ts", "**/*.tsx"],        
        plugins: {
            "@typescript-eslint": typescriptEslint,
            "@stylistic": stylistic,
            "@stylistic/jsx": stylisticJsx,
        },

        languageOptions: {
            parser: tsParser,
        },

        rules: {
            camelcase: "warn",
            curly: "warn",
            "@typescript-eslint/no-unused-vars": "warn",

            "@stylistic/member-delimiter-style": ["warn", {
                multiline: {
                    delimiter: "comma",
                },

                singleline: {
                    delimiter: "comma",
                },
            }],

            "@stylistic/semi": "warn",
            "@stylistic/jsx-child-element-spacing": "error",
            "@stylistic/jsx-closing-bracket-location": "error",
            "@stylistic/jsx-tag-spacing": "warn",
            "@stylistic/jsx-first-prop-new-line": ["warn", "multiline"],
            "@stylistic/indent": ["error", 4],
            "@stylistic/comma-dangle": ["error", "always-multiline"],
            "@stylistic/brace-style": "error",
            "@stylistic/space-before-function-paren": ["error", "never"],
            "@stylistic/keyword-spacing": "error",
        },
    },
];