import { build, context } from "esbuild";
import { mkdir, copyFile, readFile } from "node:fs/promises";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const plotly =
  (await readFile(require.resolve("plotly.js-dist-min"), "utf8")) +
  "\nPlotly.register(" +
  JSON.stringify(require("plotly.js-locales/ru")) +
  ");";
const options = {
  entryPoints: ["src/main.ts"],
  bundle: true,
  external: ["obsidian"],
  format: "cjs",
  target: "es2022",
  platform: "browser",
  outfile: "dist/main.js",
  minify: true,
  logLevel: "info",
  define: { PLOTLY_SOURCE: JSON.stringify(plotly) },
};
await mkdir("dist", { recursive: true });
for (const file of ["manifest.json", "styles.css"])
  await copyFile(file, `dist/${file}`);
const plugin = async () => {
  const runtime = await readFile("dist/kinetica.js", "utf8");
  await build({
    ...options,
    define: { ...options.define, KINETICA_RUNTIME: JSON.stringify(runtime) },
  });
};
const webOptions = {
  ...options,
  entryPoints: ["src/embed.ts"],
  external: [],
  format: "iife",
  outfile: "dist/kinetica.js",
  loader: { ".css": "text" },
};
await copyFile("examples/embed.html", "dist/kinetica-example.html");
if (process.argv.includes("--watch")) {
  let pluginContext;
  webOptions.plugins = [
    {
      name: "plugin-build",
      setup(builder) {
        builder.onEnd(async (result) => {
          if (!result.errors.length) {
            await pluginContext?.dispose();
            const runtime = await readFile("dist/kinetica.js", "utf8");
            for (const file of ["manifest.json", "styles.css"])
              await copyFile(file, `dist/${file}`);
            pluginContext = await context({
              ...options,
              define: {
                ...options.define,
                KINETICA_RUNTIME: JSON.stringify(runtime),
              },
            });
            await pluginContext.watch();
          }
        });
      },
    },
  ];
  await (await context(webOptions)).watch();
} else {
  await build(webOptions);
  await plugin();
}
