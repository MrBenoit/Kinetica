import { test } from "node:test";
import assert from "node:assert/strict";
import { assertPlotlyContract } from "./plotly-contract.mjs";

const full = {
  traces: { scatter: { x: { valType: "data_array" } }, scattergeo: {} },
  layout: {
    layoutAttributes: { geo: {}, map: {}, title: { valType: "string" } },
  },
  animation: { duration: { dflt: 500 } },
  frames: { name: { valType: "string" } },
};
const offline = () => ({
  traces: {
    scatter: { x: { valType: "data_array", description: "X values" } },
  },
  layout: { layoutAttributes: { title: { valType: "string" } } },
  animation: { duration: { dflt: 500 } },
  frames: { name: { valType: "string" } },
});
test("accepts removal of map traces and documentation differences", () => {
  assert.doesNotThrow(() =>
    assertPlotlyContract(full, offline(), ["scattergeo"]),
  );
});
for (const [name, mutate] of [
  [
    "missing supported trace",
    (schema) => {
      delete schema.traces.scatter;
    },
  ],
  [
    "changed trace attribute",
    (schema) => {
      schema.traces.scatter.x.valType = "number";
    },
  ],
  [
    "changed animation",
    (schema) => {
      schema.animation.duration.dflt = 0;
    },
  ],
  [
    "unexpected trace",
    (schema) => {
      schema.traces.scattergeo = {};
    },
  ],
]) {
  test(`rejects ${name}`, () => {
    const changed = offline();
    mutate(changed);
    assert.throws(() => assertPlotlyContract(full, changed, ["scattergeo"]));
  });
}
