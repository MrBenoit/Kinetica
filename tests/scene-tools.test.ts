// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import { template } from "../src/templates";
import { translator } from "../src/i18n";
import { validateMotion, parseMotion, toBlock, type Scene } from "../src/model";
import { compileStep, ease, stepTiming } from "../src/scene-runtime";
import { Editor } from "../src/editor";
import { Player } from "../src/player";
const t = translator("en");
function example(): Scene {
  const scene = template("flow", t);
  if (scene.type !== "scene") throw Error();
  scene.version = 3;
  scene.parameters = [
    { name: "speed", label: "Speed", min: 0, max: 10, step: 1, value: 2 },
  ];
  scene.steps[0]!.nodes[0]!.bindings = { x: "speed * 40" };
  scene.steps[0]!.nodes[0]!.value = "Distance {{speed * 2}}";
  scene.plot = {
    xMin: 0,
    xMax: 10,
    yMin: 0,
    yMax: 100,
    xLabel: "Time",
    yLabel: "Distance",
    curves: [{ label: "Distance", formula: "speed*x", color: "blue" }],
  };
  return scene;
}
afterEach(() => {
  vi.useRealTimers();
  document.body.replaceChildren();
});
it("round trips shared parameters, bindings and timing", () => {
  const scene = example();
  scene.steps[0]!.timing = { transition: 600, hold: 1400, easing: "linear" };
  const parsed = parseMotion(
    toBlock(scene).split("\n").slice(1, -1).join("\n"),
  );
  expect(parsed).toEqual(validateMotion(scene));
  expect(parsed).toMatchObject({
    parameters: scene.parameters,
    plot: scene.plot,
    steps: [{ timing: scene.steps[0]!.timing }, {}, {}],
  });
});
it("resolves positions and text without changing source or other players", () => {
  const s = example().steps[0]!;
  const original = structuredClone(s);
  const resolve = compileStep(s, ["speed"]);
  expect(resolve({ speed: 2 }).nodes[0]).toMatchObject({
    x: 80,
    value: "Distance 4",
  });
  expect(resolve({ speed: 9 }).nodes[0]).toMatchObject({
    x: 360,
    value: "Distance 18",
  });
  expect(s).toEqual(original);
});
it.each(["fetch(speed)", "x + 1", "missing", "speed.constructor"])(
  "rejects unsafe or unknown binding %s",
  (formula) => {
    const s = example();
    s.steps[0]!.nodes[0]!.bindings = { x: formula };
    expect(() => validateMotion(s)).toThrow();
  },
);
it("requires version 3 and rejects broken templates and timing", () => {
  const s = example();
  s.version = 2;
  expect(() => validateMotion(s)).toThrow(/version 3/);
  s.version = 3;
  s.steps[0]!.nodes[0]!.value = "{{speed";
  expect(() => validateMotion(s)).toThrow(/template/i);
  s.steps[0]!.nodes[0]!.value = "ok";
  s.steps[0]!.timing = { transition: -1, hold: 1000, easing: "linear" };
  expect(() => validateMotion(s)).toThrow();
});
it("handles undefined formulas and clamps positions", () => {
  const s = example().steps[0]!;
  s.nodes[0]!.bindings = { x: "1/speed", y: "speed * 1000" };
  s.nodes[0]!.value = "{{1 / speed}}";
  const resolve = compileStep(s, ["speed"]);
  expect(resolve({ speed: 0 }).nodes[0]).toMatchObject({
    x: s.nodes[0]!.x,
    value: "?",
  });
  expect(resolve({ speed: 10 }).nodes[0]!.y).toBe(350);
});
it("preserves legacy durations and implements easing endpoints", () => {
  const s = example();
  expect(
    stepTiming(s, s.steps[0]!).transition + stepTiming(s, s.steps[0]!).hold,
  ).toBe(s.duration);
  for (const kind of [
    "linear",
    "ease-in",
    "ease-out",
    "ease-in-out",
  ] as const) {
    expect(ease(kind, 0)).toBe(0);
    expect(ease(kind, 1)).toBe(1);
  }
  expect(ease("ease-in", 0.5)).toBeLessThan(0.5);
});
it("uses each step duration and cancels playback on destroy", () => {
  vi.useFakeTimers();
  window.matchMedia = vi.fn().mockReturnValue({ matches: true });
  const s = example();
  s.steps[0]!.timing = { transition: 0, hold: 500, easing: "linear" };
  s.steps[1]!.timing = { transition: 200, hold: 800, easing: "linear" };
  const root = document.createElement("div");
  document.body.append(root);
  const player = new Player(root, s, t);
  [...root.querySelectorAll("button")]
    .find((b) => b.textContent === "Play")!
    .click();
  vi.advanceTimersByTime(499);
  expect(root.querySelector(".mn-caption strong")!.textContent).toContain(
    "1 / 3",
  );
  vi.advanceTimersByTime(1);
  expect(root.querySelector(".mn-caption strong")!.textContent).toContain(
    "2 / 3",
  );
  vi.advanceTimersByTime(999);
  expect(root.querySelector(".mn-caption strong")!.textContent).toContain(
    "2 / 3",
  );
  vi.advanceTimersByTime(1);
  expect(root.querySelector(".mn-caption strong")!.textContent).toContain(
    "3 / 3",
  );
  player.destroy();
  expect(vi.getTimerCount()).toBe(0);
});
it("updates the scene, caption and plot with one slider then resets", () => {
  window.matchMedia = vi.fn().mockReturnValue({ matches: true });
  const s = example();
  const root = document.createElement("div");
  document.body.append(root);
  const player = new Player(root, s, t);
  const before = root.querySelector(".mn-curve")!.getAttribute("d");
  const slider = root.querySelector<HTMLInputElement>("input[type=range]")!;
  slider.value = "5";
  slider.dispatchEvent(new Event("input"));
  expect(
    root.querySelector("[data-node=sender]")!.getAttribute("transform"),
  ).toBe("translate(200 155)");
  expect(root.querySelector(".mn-node-value")!.textContent).toBe("Distance 10");
  expect(root.querySelector(".mn-curve")!.getAttribute("d")).not.toBe(before);
  [...root.querySelectorAll("button")]
    .find((b) => b.textContent === "Reset parameters")!
    .click();
  expect(root.querySelector(".mn-curve")!.getAttribute("d")).toBe(before);
  expect(s.parameters![0]!.value).toBe(2);
  player.destroy();
});

it.each(["motion", "stack", "bubble-sort"] as const)(
  "creates valid independent %s examples",
  (kind) => {
    const first = validateMotion(template(kind, t)),
      second = validateMotion(template(kind, t));
    expect(first.id).not.toBe(second.id);
    expect(first.version).toBe(3);
    if (first.type !== "scene" || second.type !== "scene") throw Error();
    first.steps[0]!.nodes[0]!.label = "changed";
    expect(second.steps[0]!.nodes[0]!.label).not.toBe("changed");
  },
);
it("filters gallery, previews and creates an editable copy", async () => {
  window.matchMedia = vi.fn().mockReturnValue({ matches: true });
  const root = document.createElement("div");
  document.body.append(root);
  const save = vi.fn().mockResolvedValue(undefined);
  const editor = new Editor(root, t, save, () => {});
  const search = root.querySelector<HTMLInputElement>(
    ".mn-gallery-filters input",
  )!;
  search.value = "motion";
  search.dispatchEvent(new Event("input"));
  const visible = [
    ...root.querySelectorAll<HTMLButtonElement>(".mn-template"),
  ].filter((b) => !b.hidden);
  expect(visible).toHaveLength(1);
  visible[0]!.click();
  expect(
    root.querySelector(".mn-gallery-preview .mn-linked-plot"),
  ).not.toBeNull();
  expect(editor.draft).toBeUndefined();
  [...root.querySelectorAll("button")]
    .find((b) => b.textContent === "Use this example")!
    .click();
  expect(editor.draft?.title).toBe("Motion and distance");
  [...root.querySelectorAll("button")]
    .find((b) => b.textContent === "Save to note")!
    .click();
  await Promise.resolve();
  expect(save).toHaveBeenCalledOnce();
  expect(save.mock.calls[0]![0].parameters).toHaveLength(2);
  editor.destroy();
});
it("edits timing, keeps version 3 when adding learning tools and supports undo", async () => {
  const root = document.createElement("div");
  document.body.append(root);
  const save = vi.fn().mockResolvedValue(undefined);
  const editor = new Editor(root, t, save, () => {}, example());
  const change = (label: string, value: string) => {
    const wrapper = [...root.querySelectorAll("label")].find(
      (l) => l.querySelector("span")?.textContent === label,
    )!;
    const input = wrapper.querySelector<HTMLInputElement>("input")!;
    input.value = value;
    input.dispatchEvent(new Event("change"));
  };
  change("Transition (ms)", "1200");
  change("Hold (ms)", "2000");
  change("Active lines (comma separated)", "1");
  expect(editor.draft?.version).toBe(3);
  [...root.querySelectorAll("button")]
    .find((b) => b.textContent === "Save to note")!
    .click();
  await Promise.resolve();
  expect(save.mock.calls[0]![0].steps[0].timing).toMatchObject({
    transition: 1200,
    hold: 2000,
  });
  [...root.querySelectorAll("button")]
    .find((b) => b.textContent === "Undo")!
    .click();
  if (editor.draft?.type !== "scene") throw Error();
  expect(editor.draft.steps[0]!.activeLines).toBeUndefined();
  editor.destroy();
});
it("does not leak gallery playback when switching examples", () => {
  vi.useFakeTimers();
  window.matchMedia = vi.fn().mockReturnValue({ matches: true });
  const root = document.createElement("div");
  document.body.append(root);
  const editor = new Editor(
    root,
    t,
    async () => {},
    () => {},
  );
  [...root.querySelectorAll("button")]
    .find((b) => b.textContent === "Play")!
    .click();
  expect(vi.getTimerCount()).toBe(1);
  [...root.querySelectorAll<HTMLButtonElement>(".mn-template")]
    .find((b) => b.textContent?.includes("Bubble sort"))!
    .click();
  expect(vi.getTimerCount()).toBe(0);
  editor.destroy();
});

it("uses the configured transition duration for movement", () => {
  vi.useFakeTimers();
  window.matchMedia = vi.fn().mockReturnValue({ matches: false });
  const s = template("flow", t);
  if (s.type !== "scene") throw Error();
  s.version = 3;
  s.steps[1]!.timing = { transition: 1000, hold: 500, easing: "linear" };
  const root = document.createElement("div");
  document.body.append(root);
  const player = new Player(root, s, t);
  [...root.querySelectorAll("button")]
    .find((b) => b.textContent === "Next")!
    .click();
  vi.advanceTimersByTime(500);
  const transform = root
    .querySelector('[data-node="message"]')!
    .getAttribute("transform")!;
  const x = Number(transform.match(/translate\(([^ ]+)/)![1]);
  expect(x).toBeGreaterThan(315);
  expect(x).toBeLessThan(345);
  vi.advanceTimersByTime(600);
  expect(
    root.querySelector('[data-node="message"]')!.getAttribute("transform"),
  ).toBe("translate(385 260)");
  player.destroy();
  expect(vi.getTimerCount()).toBe(0);
});
