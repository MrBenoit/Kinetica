import { describe, it, expect } from "vitest";
import { compileExpression } from "../src/expression";
import { template } from "../src/templates";
import { translator } from "../src/i18n";
import {
  clone,
  parseMotion,
  replaceBlock,
  toBlock,
  validateMotion,
} from "../src/model";
const t = translator("en");
describe("formula interpreter", () => {
  it.each([
    ["-2^2", -4],
    ["2^3^2", 512],
    ["2^-2", 0.25],
    ["2+3*4", 14],
    ["sin(pi/2)", 1],
    ["max(2, 5)", 5],
    [".5 + 1e-2", 0.51],
    ["sqrt(9)+abs(-2)", 5],
  ])("%s uses mathematical precedence", (formula, expected) => {
    expect(compileExpression(formula, [])({})).toBeCloseTo(expected);
  });
  it("binds parameters without interpreting source code", () =>
    expect(
      compileExpression("a*sin(b*x)", ["a", "b"])({
        a: 2,
        b: 1,
        x: Math.PI / 2,
      }),
    ).toBe(2));
  it.each([
    "window.alert(1)",
    "constructor(1)",
    "__proto__(1)",
    "x=2",
    "[1][0]",
    "sin()",
    "sin(1,2)",
    "foo+x",
    "1;2",
    "1e999",
    "2 3",
    "2**2",
    "(".repeat(40) + "1" + ")".repeat(40),
  ])("rejects %s", (source) => {
    expect(() => compileExpression(source, [])).toThrow();
  });
  it("leaves undefined mathematical values non-finite for the plotter to skip", () => {
    expect(compileExpression("1/x", [])({ x: 0 })).toBe(Infinity);
    expect(compileExpression("sqrt(x)", [])({ x: -1 })).toBeNaN();
  });
});
describe("portable documents", () => {
  it.each([
    "flow",
    "array",
    "wave",
    "growth",
    "blank-scene",
    "blank-plot",
  ] as const)("%s round-trips", (kind) => {
    const m = template(kind, t);
    expect(parseMotion(JSON.stringify(m))).toEqual(m);
  });
  it("rejects duplicate nodes and dangling arrows", () => {
    const m = template("flow", t);
    if (m.type !== "scene") throw Error();
    m.steps[0]!.nodes.push(clone(m.steps[0]!.nodes[0]!));
    expect(() => validateMotion(m)).toThrow(/duplicate/);
    m.steps[0]!.nodes.pop();
    m.steps[0]!.edges.push({ from: "missing", to: "sender", label: "" });
    expect(() => validateMotion(m)).toThrow(/Arrow/);
  });
  it("rejects invalid ranges, reserved parameters and future versions", () => {
    const m = template("wave", t);
    if (m.type !== "plot") throw Error();
    expect(() => validateMotion({ ...m, xMax: m.xMin })).toThrow(/Axis/);
    const bad = clone(m);
    bad.parameters[0]!.name = "constructor";
    expect(() => validateMotion(bad)).toThrow(/parameter/);
    expect(() => validateMotion({ ...m, version: 4 })).toThrow(/version/);
  });
  it("preserves other content changed while the editor was open", () => {
    const m = template("wave", t);
    const updated = { ...m, title: "Changed" };
    const text = `# Note\nNew unrelated content\n\n${toBlock(m)}\n\nTail\n`;
    expect(replaceBlock(text, m, updated)).toBe(
      text.replace(toBlock(m), toBlock(updated)),
    );
  });
  it("refuses to overwrite a concurrent visualization edit or duplicate ID", () => {
    const m = template("wave", t);
    const updated = { ...m, title: "Changed" };
    expect(() => replaceBlock(toBlock(updated), m, m)).toThrow(/changed/);
    expect(() => replaceBlock(`${toBlock(m)}\n${toBlock(m)}`, m, m)).toThrow(
      /duplicate/,
    );
    expect(() => replaceBlock("unrelated note", m, m)).toThrow(/deleted/);
  });
  it("escapes embedded fences, preserves CRLF, and supports multiple independent blocks", () => {
    const m = template("flow", t);
    m.description = "\n```\n<script>alert(1)</script>";
    const other = template("wave", t);
    const text = (toBlock(m) + "\n\n" + toBlock(other)).replace(/\n/g, "\r\n");
    const updated = { ...m, title: "New" };
    const result = replaceBlock(text, m, updated);
    expect(result).toContain("\\u0060");
    expect(result).toContain(toBlock(other).replace(/\n/g, "\r\n"));
    expect(result.replace(/\r\n/g, "")).not.toContain("\n");
  });
});
