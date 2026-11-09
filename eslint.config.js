import globals from "globals";

export default [
  {
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
        document: "readonly",
        window: "readonly",
        console: "readonly",
        localStorage: "readonly",
        confirm: "readonly",
        alert: "readonly"
      }
    },
    rules: {
      "no-unused-vars": "warn",
      "no-undef": "error",
      "semi": ["error", "always"],
      "eqeqeq": ["error", "always"]
    }
  }
];
