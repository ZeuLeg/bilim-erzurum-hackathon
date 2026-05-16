module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2023,
    sourceType: "module",
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: ["@typescript-eslint"],
  extends: [
    "next",
    "next/core-web-vitals",
    "plugin:@typescript-eslint/recommended",
    "prettier",
  ],
  env: {
    browser: true,
    node: true,
    es2023: true,
  },
  rules: {},
};
