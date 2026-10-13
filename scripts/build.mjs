import { build, context, transform } from "esbuild";
import { mkdir, copyFile, readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url);
const rawPlotly =
  (await readFile(require.resolve("plotly.js-dist-min"), "utf8")) +
  "\nPlotly.register(" +
  JSON.stringify(require("plotly.js-locales/ru")) +
  ");";
const header = `plotly.js v${require("plotly.js-dist-min/package.json").version}`;
const plotly =
  `/*! ${header}, MIT license, Copyright Plotly, Inc. */\n` +
  (
    await transform(rawPlotly, {
      minify: true,
      target: "es2022",
      charset: "utf8",
      legalComments: "inline",
    })
  ).code;
const options = {
  entryPoints: ["src/main.ts"],
  bundle: true,
  external: ["obsidian"],
  format: "cjs",
  target: "es2022",
  platform: "browser",
  outfile: "dist/main.js",
  minify: true,
  charset: "utf8",
  logLevel: "info",
  define: { PLOTLY_SOURCE: JSON.stringify(plotly) },
};
await mkdir("dist", { recursive: true });
const copyAssets = async () => {
  for (const file of ["manifest.json", "styles.css"])
    await copyFile(file, `dist/${file}`);
  await copyFile("examples/embed.html", "dist/kinetica-example.html");
};
const checkSize = async () => {
  const source = await readFile("dist/main.js", "utf8");
  assert.equal(
    source.split(header).length - 1,
    1,
    "Bundle must contain exactly one Plotly source",
  );
  assert.ok(
    Buffer.byteLength(source) < 5_000_000,
    "Plugin exceeds the 5 MB sync budget",
  );
  console.log(
    `Plugin size: ${Buffer.byteLength(source)} bytes, one Plotly copy`,
  );
};
const webOptions = {
  ...options,
  entryPoints: ["src/embed.ts"],
  external: [],
  format: "iife",
  write: false,
  outfile: "dist/kinetica.js",
  loader: { ".css": "text" },
  alias: { "#dom": "./src/dom-browser.ts" },
  define: { PLOTLY_SOURCE: "__kineticaPlotlySource" },
};
function factory(result) {
  return `function(__kineticaPlotlySource){${result.outputFiles[0].text}}`;
}
async function writeWeb(runtime) {
  await copyAssets();
  await writeFile(
    "dist/kinetica.js",
    `(${runtime})(${JSON.stringify(plotly)});`,
  );
}
if (process.argv.includes("--watch")) {
  let pluginContext;
  webOptions.plugins = [
    {
      name: "plugin-build",
      setup(builder) {
        builder.onEnd(async (result) => {
          if (result.errors.length) return;
          await pluginContext?.dispose();
          const runtime = factory(result);
          await writeWeb(runtime);
          pluginContext = await context({
            ...options,
            define: {
              ...options.define,
              KINETICA_RUNTIME: JSON.stringify(runtime),
            },
          });
          await pluginContext.watch();
        });
      },
    },
  ];
  await (await context(webOptions)).watch();
} else {
  const runtime = factory(await build(webOptions));
  await writeWeb(runtime);
  await build({
    ...options,
    define: { ...options.define, KINETICA_RUNTIME: JSON.stringify(runtime) },
  });
  await checkSize();
}
