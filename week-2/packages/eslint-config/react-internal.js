import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";

import { config as baseConfig } from "./base.js";

/**
 * ESLint flat config for internal React libraries (e.g. @repo/ui).
 *
 * @type {import("eslint").Linter.Config[]}
 */
export const config = [
  ...baseConfig,
  reactHooks.configs.flat["recommended-latest"],
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.serviceworker,
      },
    },
  },
];
