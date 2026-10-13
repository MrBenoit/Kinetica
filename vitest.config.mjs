import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
export default defineConfig({
  define: {
    PLOTLY_SOURCE: JSON.stringify("window.Plotly = {}; // test fixture"),
    KINETICA_RUNTIME: JSON.stringify(
      "function(source){window.runtimeSource=source;}",
    ),
  },
  test: {
    alias: {
      "#dom": fileURLToPath(new URL("./src/dom-browser.ts", import.meta.url)),
      obsidian: fileURLToPath(
        new URL("./tests/fixtures/obsidian.ts", import.meta.url),
      ),
    },
  },
});
