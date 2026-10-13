// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Player } from "../src/player";
import { Editor } from "../src/editor";
import { template } from "../src/templates";
import { translator } from "../src/i18n";
import { curvePath, sampleCurve } from "../src/plot";
const t = translator("en");
let root: HTMLElement;
const click = (label: string) => {
  const target = [...root.querySelectorAll("button")].find(
    (b) => b.textContent === label,
  );
  expect(target, label).toBeTruthy();
  target!.click();
};
function change(label: string, value: string) {
  const wrapper = [...root.querySelectorAll("label")].find(
    (l) => l.querySelector("span")?.textContent === label,
  );
  const input = wrapper?.querySelector<HTMLInputElement>("input, textarea");
  expect(input, label).toBeTruthy();
  input!.value = value;
  input!.dispatchEvent(new Event("change", { bubbles: true }));
}
beforeEach(() => {
  root = document.createElement("div");
  document.body.append(root);
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      disconnect() {}
    },
  );
  window.matchMedia = vi.fn().mockReturnValue({ matches: true });
});
afterEach(() => {
  root.remove();
  vi.restoreAllMocks();
  vi.useRealTimers();
});
describe("scene playback", () => {
  it("steps, restarts, reaches the end and disposes timers", () => {
    vi.useFakeTimers();
    const scene = template("flow", t);
    if (scene.type !== "scene") throw Error();
    const player = new Player(root, scene, t);
    expect(root.querySelector(".mn-caption strong")?.textContent).toContain(
      "1 / 3",
    );
    click("Next");
    expect(root.querySelector(".mn-caption strong")?.textContent).toContain(
      "2 / 3",
    );
    click("Restart");
    click("Play");
    vi.advanceTimersByTime(scene.duration * 2);
    expect(root.querySelector(".mn-caption strong")?.textContent).toContain(
      "3 / 3",
    );
    expect(vi.getTimerCount()).toBe(0);
    click("Play");
    expect(vi.getTimerCount()).toBe(1);
    player.destroy();
    expect(vi.getTimerCount()).toBe(0);
  });
  it("treats note text as text, not HTML", () => {
    const scene = template("flow", t);
    scene.description = "<img src=x onerror=alert(1)>";
    const player = new Player(root, scene, t);
    expect(root.querySelector("img")).toBeNull();
    expect(root.textContent).toContain("<img");
    player.destroy();
  });
});
describe("plot playback", () => {
  it("updates curves from sliders, resets and isolates player instances", () => {
    const m = template("wave", t);
    const other = document.createElement("div");
    document.body.append(other);
    const first = new Player(root, m, t),
      second = new Player(other, m, t);
    const before = root.querySelector(".mn-curve")!.getAttribute("d");
    const slider = root.querySelector<HTMLInputElement>("input[type=range]")!;
    slider.value = "4";
    slider.dispatchEvent(new Event("input"));
    expect(root.querySelector(".mn-curve")!.getAttribute("d")).not.toBe(before);
    expect(other.querySelector(".mn-curve")!.getAttribute("d")).toBe(before);
    click("Reset");
    expect(root.querySelector(".mn-curve")!.getAttribute("d")).toBe(before);
    first.destroy();
    second.destroy();
    other.remove();
  });
  it("skips undefined points and breaks across poles instead of joining infinities", () => {
    const points = sampleCurve((x) => 1 / x, -1, 1, 100);
    const d = curvePath(
      points,
      (x) => x,
      (y) => y,
      -5,
      5,
    );
    expect(d).not.toMatch(/NaN|Infinity/);
    expect(d.split("M").length).toBeGreaterThan(2);
    expect(
      curvePath(
        [
          { x: 0, y: NaN },
          { x: 1, y: Infinity },
        ],
        (x) => x,
        (y) => y,
        0,
        1,
      ),
    ).toBe("");
  });
});
describe("visual editing", () => {
  it("creates a scene from a template, edits a block, duplicates a step, undoes and saves", async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    const editor = new Editor(root, t, save, () => {});
    root.querySelector<HTMLButtonElement>(".mn-template")!.click();
    click("Add block");
    change("Label", "Cache");
    change("Value", "hit");
    click("Duplicate step");
    expect(
      root.querySelectorAll(".mn-editor-grid .mn-step-button"),
    ).toHaveLength(4);
    click("Undo");
    expect(
      root.querySelectorAll(".mn-editor-grid .mn-step-button"),
    ).toHaveLength(3);
    click("Save to note");
    await Promise.resolve();
    expect(save).toHaveBeenCalledOnce();
    const saved = save.mock.calls[0]![0];
    expect(saved.steps[0].nodes.at(-1)).toMatchObject({
      label: "Cache",
      value: "hit",
    });
    editor.destroy();
  });
  it("blocks invalid formulas and lets the user correct and save", async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    const editor = new Editor(root, t, save, () => {}, template("wave", t));
    change("y =", "fetch(x)");
    expect(root.querySelector(".mn-error")!.textContent).toContain(
      "Unknown function",
    );
    expect(
      [...root.querySelectorAll("button")].find(
        (b) => b.textContent === "Save to note",
      )?.disabled,
    ).toBe(true);
    change("y =", "a*x");
    click("Save to note");
    await Promise.resolve();
    expect(save.mock.calls[0]![0].curves[0].formula).toBe("a*x");
    editor.destroy();
  });
  it("keeps a failed save open and permits a retry", async () => {
    const save = vi
      .fn()
      .mockRejectedValueOnce(new Error("Concurrent edit"))
      .mockResolvedValue(undefined);
    const editor = new Editor(root, t, save, () => {}, template("wave", t));
    click("Save to note");
    await Promise.resolve();
    await Promise.resolve();
    expect(root.querySelector(".mn-error")!.textContent).toContain(
      "Concurrent edit",
    );
    click("Save to note");
    await Promise.resolve();
    expect(save).toHaveBeenCalledTimes(2);
    editor.destroy();
  });
});

describe("Obsidian tooltip compatibility", () => {
  it.each(["flow", "wave"] as const)(
    "labels %s SVG through title references instead of HTML-only tooltips",
    (kind) => {
      const player = new Player(root, template(kind, t), t);
      expect(
        root.querySelector("svg[aria-label], svg [aria-label]"),
      ).toBeNull();
      const canvas = root.querySelector("svg")!;
      const title = root.ownerDocument.getElementById(
        canvas.getAttribute("aria-labelledby")!,
      );
      expect(title?.textContent).toBeTruthy();
      player.destroy();
    },
  );
  it("keeps accessible names on keyboard-operable editor nodes", () => {
    const editor = new Editor(
      root,
      t,
      async () => {},
      () => {},
      template("flow", t),
    );
    const node = root.querySelector<SVGGElement>(".mn-canvas [data-node]")!;
    expect(node.getAttribute("role")).toBe("button");
    expect(node.getAttribute("aria-label")).toBeNull();
    expect(
      document.getElementById(node.getAttribute("aria-labelledby")!)
        ?.textContent,
    ).toContain("Sender");
    editor.destroy();
  });
});
