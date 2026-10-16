import assert from "node:assert/strict";
import { JSDOM, VirtualConsole } from "jsdom";
import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
const require = createRequire(import.meta.url);

function readSchema(source) {
  const dom = new JSDOM("<!doctype html>", {
    runScripts: "outside-only",
    virtualConsole: new VirtualConsole(),
  });
  try {
    // Schema registration needs DOM globals but does not render a canvas
    dom.window.HTMLCanvasElement.prototype.getContext = () => null;
    dom.window.URL.createObjectURL = () => "blob:schema-check";
    dom.window.eval(source);
    return JSON.parse(JSON.stringify(dom.window.Plotly.PlotSchema.get()));
  } finally {
    dom.window.close();
  }
}

function withoutMetadata(value) {
  if (Array.isArray(value)) return value.map(withoutMetadata);
  if (value === null || typeof value !== "object") return value;
  // The official minified bundle omits these documentation fields
  const metadata = [
    "description",
    "requiredOpts",
    "otherOpts",
    "role",
    "hrName",
  ];
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !metadata.includes(key))
      .map(([key, item]) => [key, withoutMetadata(item)]),
  );
}

export function assertPlotlyContract(full, offline, excludedTraces) {
  const expected = structuredClone(full);
  for (const name of excludedTraces) delete expected.traces[name];
  delete expected.layout.layoutAttributes.geo;
  delete expected.layout.layoutAttributes.map;
  assert.deepEqual(
    withoutMetadata(offline),
    withoutMetadata(expected),
    "Offline Plotly must preserve all non-map trace, layout, frame and animation attributes",
  );
}

export async function checkPlotlyContract(source, excludedTraces) {
  const full = await readFile(
    require.resolve("plotly.js/dist/plotly.min.js"),
    "utf8",
  );
  const fullSchema = readSchema(full);
  const offlineSchema = readSchema(source);
  assertPlotlyContract(fullSchema, offlineSchema, excludedTraces);
  console.log(
    `Plotly contract: ${Object.keys(offlineSchema.traces).length} trace types match the full distribution`,
  );
}
