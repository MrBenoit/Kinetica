import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
export default defineConfig({
  test: {
    alias: {
      obsidian: fileURLToPath(
        new URL("./tests/fixtures/obsidian.ts", import.meta.url),
      ),
    },
  },
});
