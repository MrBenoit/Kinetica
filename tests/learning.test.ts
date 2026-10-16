// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { template } from "../src/templates";
import { translator } from "../src/i18n";
import {
  validateMotion,
  validateFigure,
  toBlock,
  parseMotion,
  type PlotlyDocument,
} from "../src/model";
import { simulateQueue } from "../src/queue";
import { Player } from "../src/player";
import { Editor } from "../src/editor";
import { plotlyHTML } from "../src/plotly-view";
import { standaloneHTML } from "../src/export";
import pythonFigure from "./fixtures/python-figure.json";
const t = translator("en");
let root: HTMLElement;
const players: { destroy(): void }[] = [];
const click = (text: string) => {
  const button = [...root.querySelectorAll("button")].find(
    (b) => b.textContent === text,
  );
  expect(button, text).toBeTruthy();
  button!.click();
};
const change = (label: string, value: string) => {
  const input = [...root.querySelectorAll("label")]
    .find((l) => l.querySelector("span")?.textContent === label)
    ?.querySelector<HTMLInputElement | HTMLTextAreaElement>("input,textarea");
  expect(input, label).toBeTruthy();
  input!.value = value;
  input!.dispatchEvent(new Event("change"));
};
beforeEach(() => {
  root = document.createElement("div");
  document.body.append(root);
  window.matchMedia = vi.fn().mockReturnValue({ matches: true });
  vi.stubGlobal("PLOTLY_SOURCE", "window.Plotly = {}; // fixture");
});
afterEach(() => {
  players.splice(0).forEach((p) => p.destroy());
  root.remove();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});
it.each([
  "code-trace",
  "prediction",
  "queue",
  "queue-compare",
  "comparison",
] as const)("round trips %s with version 2", (kind) => {
  const motion = template(kind, t);
  expect(motion.version).toBe(2);
  expect(parseMotion(toBlock(motion).slice(10, -4))).toEqual(
    validateMotion(motion),
  );
});
it("preserves jobs, bounds buffers and completes all allowed configurations", () => {
  for (const jobs of [1, 24, 60])
    for (const capacity of [0, 4, 20])
      for (const workers of [1, 3, 8])
        for (const arrival of [1, 6])
          for (const service of [1, 10]) {
            const config = { jobs, capacity, workers, arrival, service };
            const states = simulateQueue(config);
            for (const s of states) {
              expect(s.created).toBe(
                s.completed + s.buffered + s.blocked + s.running,
              );
              expect(s.buffered).toBeLessThanOrEqual(capacity);
              expect(s.running).toBeLessThanOrEqual(workers);
              expect(s.created).toBeLessThanOrEqual(jobs);
            }
            expect(states.at(-1)?.completed).toBe(jobs);
          }
});
it("increases throughput with workers without losing or inventing work", () => {
  const config = { jobs: 24, arrival: 3, workers: 1, capacity: 0, service: 4 };
  expect(simulateQueue({ ...config, workers: 4 }).length).toBeLessThan(
    simulateQueue(config).length,
  );
});
it("blocks skipping a question, reveals feedback, then updates lines and variables", () => {
  players.push(new Player(root, template("prediction", t), t));
  const next = [...root.querySelectorAll("button")].find(
    (b) => b.textContent === "Next",
  )!;
  expect(next.disabled).toBe(true);
  click("Yes");
  expect(root.textContent).toContain("Try again");
  expect(next.disabled).toBe(true);
  click("No");
  expect(next.disabled).toBe(false);
  click("Next");
  expect(root.querySelector(".mn-code-line.is-active")?.textContent).toContain(
    "append",
  );
  expect(
    root.querySelector(".mn-variables .is-changed")?.textContent,
  ).toContain("3");
  click("Restart");
  expect(next.disabled).toBe(true);
  click("Show answer");
  expect(next.disabled).toBe(false);
});
it("keeps both comparison scenes on the same step and cleans playback", () => {
  vi.useFakeTimers();
  const player = new Player(root, template("comparison", t), t);
  players.push(player);
  click("Next");
  expect(
    [...root.querySelectorAll(".mn-caption > strong")].map((e) =>
      e.textContent?.slice(0, 5),
    ),
  ).toEqual(["2 / 2", "2 / 2"]);
  click("Play");
  player.destroy();
  expect(vi.getTimerCount()).toBe(0);
});
it("updates linked chart and metrics from a parameter and timeline", () => {
  const player = new Player(root, template("queue-compare", t), t);
  players.push(player);
  const before = root.querySelector(".mn-series-1")!.getAttribute("d");
  const slider =
    root.querySelectorAll<HTMLInputElement>("input[type=range]")[2]!;
  slider.value = "6";
  slider.dispatchEvent(new Event("input"));
  expect(root.querySelector(".mn-series-1")!.getAttribute("d")).not.toBe(
    before,
  );
  click("Next");
  expect(root.querySelector(".mn-lab-metrics")?.textContent).toContain(
    "Created: 2",
  );
});
it("edits and saves code extras, queue defaults and a nested comparison", async () => {
  const save = vi.fn().mockResolvedValue(undefined);
  let editor = new Editor(root, t, save, () => {}, template("array", t));
  change("Active lines (comma separated)", "1");
  click("Add variable");
  change("Variable", "len(s)");
  change("Value", "2");
  click("Save to note");
  await Promise.resolve();
  expect(save.mock.calls.at(-1)![0]).toMatchObject({
    version: 2,
    steps: [
      { activeLines: [1], variables: [{ name: "len(s)", value: "2" }] },
      {},
    ],
  });
  editor.destroy();
  editor = new Editor(root, t, save, () => {}, template("queue", t));
  change("Workers", "5");
  click("Save to note");
  await Promise.resolve();
  expect(save.mock.calls.at(-1)![0].config.workers).toBe(5);
  editor.destroy();
  editor = new Editor(root, t, save, () => {}, template("comparison", t));
  players.push(editor);
  [...root.querySelectorAll("button")]
    .find((b) => b.textContent?.startsWith("Edit scene 1"))!
    .click();
  change("Title", "Changed left");
  click("Save to note");
  await Promise.resolve();
  click("Save to note");
  await Promise.resolve();
  expect(save.mock.calls.at(-1)![0].scenes[0].title).toBe("Changed left");
});
const figure = {
  data: [{ type: "bar", x: ["A", "B"], y: [2, 4] }],
  layout: { title: { text: "Bars" } },
};
const plotly = (): PlotlyDocument => ({
  version: 2,
  type: "plotly",
  id: "figure",
  title: "Plotly",
  description: "",
  figure: validateFigure(figure),
});
it("accepts heatmaps and Python templates but rejects remote data and map traces", () => {
  expect(
    validateFigure({
      data: [{ type: "heatmap", z: [[1, 2]] }],
      layout: {
        template: {
          layout: { geo: {}, mapbox: {} },
          data: { scattergeo: [{ type: "scattergeo" }], bar: [] },
        },
      },
    }),
  ).toHaveProperty("data");
  for (const data of [
    { type: "scattergeo" },
    { type: "scatter", xsrc: "remote" },
    { type: "scatter", text: "https://example.com" },
  ])
    expect(() => validateFigure({ data: [data] })).toThrow();
  expect(() =>
    validateFigure(JSON.parse('{"data":[{"__proto__":{}}]}')),
  ).toThrow();
});
it("keeps invalid Plotly edits unsaveable after editing another field", () => {
  const save = vi.fn();
  const editor = new Editor(root, t, save, () => {}, plotly());
  players.push(editor);
  change("Plotly JSON", "{invalid");
  change("Title", "New title");
  click("Save to note");
  expect(save).not.toHaveBeenCalled();
  change("Plotly JSON", JSON.stringify(figure));
  click("Save to note");
  expect(save).toHaveBeenCalledOnce();
});
it("imports a Plotly figure from the picker and saves normalized data", () => {
  const save = vi.fn();
  const editor = new Editor(root, t, save, () => {});
  players.push(editor);
  change("Plotly JSON", JSON.stringify(figure));
  click("Import figure");
  click("Save to note");
  expect(save.mock.calls[0]![0]).toMatchObject({
    version: 2,
    type: "plotly",
    figure: { data: figure.data },
  });
});
it("isolates Plotly, blocks network and times out instead of leaving a live frame", () => {
  vi.useFakeTimers();
  players.push(new Player(root, plotly(), t));
  const frame = root.querySelector("iframe")!;
  expect(frame.getAttribute("sandbox")).toBe("allow-scripts");
  expect(frame.srcdoc).toContain("connect-src 'none'");
  window.dispatchEvent(new MessageEvent("message", { data: { ok: true } }));
  vi.advanceTimersByTime(20001);
  expect(root.querySelector("iframe")).toBeNull();
  expect(root.textContent).toContain("too long");
});
it("exports self-contained HTML without letting document text escape a script", () => {
  const m = template("array", t);
  m.title = '</script><img src=x onerror="alert(1)">';
  const html = standaloneHTML(
    m,
    "/* </script> */ window.runtime=true;",
    "ru",
    true,
  );
  const parsed = new DOMParser().parseFromString(html, "text/html");
  expect(parsed.querySelector("img")).toBeNull();
  expect(parsed.querySelectorAll("script")).toHaveLength(2);
  expect(parsed.querySelector("script[src],link[href]")).toBeNull();
  expect(
    JSON.parse(
      parsed.querySelector('script[type="application/json"]')!.textContent!,
    ).title,
  ).toBe(m.title);
  expect(plotlyHTML(plotly(), true, "ru", "token")).toContain("frame");
});

it("imports the actual Python figure with binary NumPy arrays", () => {
  const clean = validateFigure(pythonFigure);
  expect(clean.data).toMatchObject([
    {
      type: "scatter",
      x: { bdata: expect.any(String) },
      y: { bdata: expect.any(String) },
    },
  ]);
});
it("rejects invalid learning contracts before rendering", () => {
  const scene = template("prediction", t);
  if (scene.type !== "scene") throw Error();
  expect(() => validateMotion({ ...scene, version: 1 })).toThrow(/version 2/);
  scene.steps[0]!.activeLines = [999];
  expect(() => validateMotion(scene)).toThrow(/line/);
  const lab = template("queue", t);
  if (lab.type !== "lab") throw Error();
  lab.config.workers = 1.5;
  expect(() => validateMotion(lab)).toThrow(/integer/);
  const comparison = template("comparison", t);
  if (comparison.type !== "comparison") throw Error();
  comparison.scenes[0] = template("prediction", t) as typeof scene;
  expect(() => validateMotion(comparison)).toThrow(/questions/);
});

it("rejects an export that its own HTML reader cannot reopen", () => {
  const m = template("array", t);
  if (m.type !== "scene") throw Error();
  m.steps = Array.from({ length: 100 }, () => ({
    ...m.steps[0]!,
    code: "x".repeat(4000),
    description: "x".repeat(2000),
  }));
  expect(() => standaloneHTML(m, "runtime", "en", false)).toThrow(/500,000/);
});

it.each([
  "scattergeo",
  "choropleth",
  "scattermap",
  "scattermapbox",
  "choroplethmap",
  "choroplethmapbox",
  "densitymap",
  "densitymapbox",
])("rejects excluded map trace %s in data and animation frames", (type) => {
  expect(() => validateFigure({ data: [{ type }] })).toThrow("Map traces");
  expect(() =>
    validateFigure({
      data: [{ type: "scatter", x: [1], y: [2] }],
      frames: [{ data: [{ type }] }],
    }),
  ).toThrow("Map traces");
});
