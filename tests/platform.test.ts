// @vitest-environment jsdom
import { expect, it, vi } from "vitest";
import { runInNewContext } from "node:vm";
import { createHTML, createSVG } from "../src/dom-obsidian";
import { browserRuntime } from "../src/browser-runtime";

it("uses the Obsidian HTML helper on the supplied parent", () => {
  const parent = document.createElement("div");
  const child = document.createElement("button");
  const helper = vi.fn().mockReturnValue(child);
  parent.createEl = helper;
  expect(createHTML(parent, "button")).toBe(child);
  expect(helper).toHaveBeenCalledExactlyOnceWith("button");
});

it("uses the Obsidian SVG helper on the supplied parent", () => {
  const parent = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  const child = document.createElementNS("http://www.w3.org/2000/svg", "path");
  const helper = vi.fn().mockReturnValue(child);
  parent.createSvg = helper;
  expect(createSVG(parent, "path")).toBe(child);
  expect(helper).toHaveBeenCalledExactlyOnceWith("path");
});

it("passes the shared Plotly source to the exported browser factory", () => {
  const context = { window: { runtimeSource: "" } };
  runInNewContext(browserRuntime(), context, { timeout: 1000 });
  expect(context.window.runtimeSource).toBe(
    "window.Plotly = {}; // test fixture",
  );
});
