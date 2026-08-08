import globals from "globals";
import pluginNext from "@next/eslint-plugin-next";
import reactHooks from "eslint-plugin-react-hooks";

import { config as baseConfig } from "./base.js";

/**
 * ESLint flat config for Next.js apps.
 *
 * @type {import("eslint").Linter.Config[]}
 */
export const config = [
  ...baseConfig,
  reactHooks.configs.flat["recommended-latest"],
  {
    plugins: {
      "@next/next": pluginNext,
    },
    rules: {
      ...pluginNext.configs.recommended.rules,
      ...pluginNext.configs["core-web-vitals"].rules,
    },
  },
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.serviceworker,
      },
    },
  },
];
