import coreWebVitals from "eslint-config-next/core-web-vitals";

/**
 * ESLint 9 flat config.
 * `next lint` was removed in Next 16 — the `lint` npm script calls the
 * eslint CLI against this file. eslint-config-next v16 exports native
 * flat-config arrays, so no FlatCompat shim is needed.
 */
const eslintConfig = [
  ...coreWebVitals,
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "out/**",
      "next-env.d.ts",
    ],
  },
];

export default eslintConfig;
