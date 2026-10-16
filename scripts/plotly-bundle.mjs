import { build } from "esbuild";
import { glsl } from "esbuild-plugin-glsl";
import inlineCSS from "esbuild-plugin-inline-css";
import { createRequire } from "node:module";
import { dirname } from "node:path";
import assert from "node:assert/strict";
import { checkPlotlyContract } from "./plotly-contract.mjs";

const require = createRequire(import.meta.url);
const policy = require("../src/plotly-policy.json");
const schema = require("plotly.js/dist/plot-schema.json");
export const plotlyVersion = require("plotly.js/package.json").version;
export const supportedTraces = Object.keys(schema.traces)
  .filter((name) => !policy.excludedTraces.includes(name))
  .sort();

export async function buildPlotly() {
  const modules = [...supportedTraces, "calendars"];
  const contents = `const Plotly = require("plotly.js/lib/core");
Plotly.register([${modules.map((name) => `require("plotly.js/lib/${name}")`).join(",")}]);
Plotly.register(require("plotly.js-locales/ru"));
module.exports = Plotly;`;
  const result = await build({
    absWorkingDir: dirname(require.resolve("../package.json")),
    stdin: {
      contents,
      resolveDir: dirname(require.resolve("../package.json")),
    },
    bundle: true,
    write: false,
    metafile: true,
    format: "iife",
    globalName: "Plotly",
    platform: "browser",
    target: "es2022",
    minify: true,
    charset: "utf8",
    legalComments: "inline",
    plugins: [inlineCSS(), glsl({ minify: true })],
    alias: { regl: "@plotly/regl", stream: "stream-browserify" },
    define: {
      global: "window",
      "define.amd": "false",
      "process.env.NODE_DEBUG": "false",
    },
  });
  const inputs = Object.keys(result.metafile.inputs);
  for (const name of supportedTraces) {
    assert.ok(
      inputs.some((path) => path.endsWith(`/src/traces/${name}/index.js`)),
      `Missing Plotly trace: ${name}`,
    );
  }
  for (const name of policy.excludedTraces) {
    assert.ok(
      !inputs.some((path) => path.includes(`/src/traces/${name}/`)),
      `Excluded Plotly trace is bundled: ${name}`,
    );
  }
  assert.ok(
    !inputs.some((path) =>
      /maplibre[^/]*\/.*\.js$|\/plots\/(geo|map)\//.test(path),
    ),
    "Offline Plotly bundle includes a map engine",
  );
  const source = result.outputFiles[0].text;
  await checkPlotlyContract(source, policy.excludedTraces);
  return source;
}
