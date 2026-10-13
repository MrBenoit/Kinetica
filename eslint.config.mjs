import js from "@eslint/js";
import ts from "typescript-eslint";
import obsidian from "eslint-plugin-obsidianmd";
export default ts.config(
  js.configs.recommended,
  ...ts.configs.recommended,
  {
    files: ["**/*.ts"],
    rules: { "@typescript-eslint/no-explicit-any": "error" },
  },
  {
    files: ["src/**/*.ts"],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/only-throw-error": "error",
      "@typescript-eslint/no-unnecessary-type-assertion": "error",
    },
  },
  {
    files: ["src/**/*.ts"],
    ignores: ["src/dom-browser.ts"],
    plugins: { obsidianmd: obsidian },
    rules: { "obsidianmd/prefer-create-el": "error" },
  },
);
