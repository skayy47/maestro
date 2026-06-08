import { defineConfig } from "vitest/config";
import path from "node:path";

/**
 * Vitest config — fast unit tests for MAESTRO's pure logic.
 * The `@/*` alias mirrors tsconfig so tests import like the app does.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    globals: true,
  },
});
