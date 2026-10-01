import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const testsOnly = {
  group: ["**/__tests__/**"],
  message: "Lo de __tests__/ solo lo importan las pruebas.",
};

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    files: ["**/*.{ts,tsx}"],
    ignores: ["**/__tests__/**", "e2e/**"],
    rules: {
      "no-restricted-imports": ["error", { patterns: [testsOnly] }],
    },
  },
  {
    files: ["features/*/lib/**/*.{ts,tsx}"],
    ignores: ["**/__tests__/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            { name: "server-only", message: "lib/ es puro: lo de servidor va en server/." },
            { name: "next/headers", message: "lib/ es puro: lo de servidor va en server/." },
          ],
          patterns: [
            {
              group: ["**/server/**"],
              message: "lib/ no importa de server/: debe poder usarse desde un Client Component.",
            },
            {
              group: ["@/lib/marketplace/client", "@/lib/marketplace/http"],
              message: "lib/ no habla con posveapi: eso va en server/.",
            },
            testsOnly,
          ],
        },
      ],
    },
  },
]);

export default eslintConfig;
