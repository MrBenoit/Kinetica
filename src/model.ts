import { compileStep } from "./scene-runtime";
import plotlyPolicy from "./plotly-policy.json";
import { compileExpression, reservedNames } from "./expression";
export const palette = [
  "blue",
  "orange",
  "green",
  "purple",
  "red",
  "cyan",
] as const;
export type Color = (typeof palette)[number];
export interface Timing {
  transition: number;
  hold: number;
  easing: "linear" | "ease-in" | "ease-out" | "ease-in-out";
}
export interface SceneNode {
  bindings?: { x?: string; y?: string };
  id: string;
  label: string;
  value: string;
  x: number;
  y: number;
  color: Color;
  highlighted: boolean;
}
export interface Edge {
  from: string;
  to: string;
  label: string;
}
export interface Question {
  prompt: string;
  options: { text: string; explanation: string }[];
  correct: number;
}
export interface Step {
  timing?: Timing;
  activeLines?: number[];
  variables?: { name: string; value: string }[];
  question?: Question;
  title: string;
  description: string;
  code: string;
  nodes: SceneNode[];
  edges: Edge[];
}
interface Base {
  version: 1 | 2 | 3;
  id: string;
  title: string;
  description: string;
}
export interface Scene extends Base {
  type: "scene";
  parameters?: Parameter[];
  plot?: Pick<
    Plot,
    "curves" | "xMin" | "xMax" | "yMin" | "yMax" | "xLabel" | "yLabel"
  >;
  duration: number;
  steps: Step[];
}
export interface Parameter {
  name: string;
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
}
export interface Curve {
  label: string;
  formula: string;
  color: Color;
}
export interface Plot extends Base {
  type: "plot";
  xLabel: string;
  yLabel: string;
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  parameters: Parameter[];
  curves: Curve[];
}
export interface QueueConfig {
  jobs: number;
  arrival: number;
  workers: number;
  capacity: number;
  service: number;
}
export interface Lab extends Base {
  version: 2;
  type: "lab";
  config: QueueConfig;
  compare: boolean;
}
export interface Comparison extends Base {
  version: 2;
  type: "comparison";
  scenes: Scene[];
}
export interface PlotlyDocument extends Base {
  version: 2;
  type: "plotly";
  figure: Record<string, unknown>;
}
export type Motion = Scene | Plot | Lab | Comparison | PlotlyDocument;
export const clone = <T>(value: T): T => structuredClone(value);
export const uid = (): string => crypto.randomUUID();
function object(value: unknown, path: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error(`${path}: expected an object`);
  return value as Record<string, unknown>;
}
function str(value: unknown, path: string, max = 2000): string {
  if (typeof value !== "string" || value.length > max)
    throw new Error(`${path}: expected text up to ${max} characters`);
  return value;
}
function num(value: unknown, path: string, min = -1e6, max = 1e6): number {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < min ||
    value > max
  )
    throw new Error(`${path}: expected a number between ${min} and ${max}`);
  return value;
}
function list(
  value: unknown,
  path: string,
  min: number,
  max: number,
): unknown[] {
  if (!Array.isArray(value) || value.length < min || value.length > max)
    throw new Error(`${path}: expected ${min}-${max} items`);
  return value;
}
function ident(value: unknown, path: string): string {
  const id = str(value, path, 64);
  if (!/^[a-zA-Z0-9_-]+$/.test(id))
    throw new Error(`${path}: use letters, digits, hyphens or underscores`);
  return id;
}
function color(value: unknown): Color {
  if (!palette.includes(value as Color)) throw new Error("Unknown color");
  return value as Color;
}
function unique(values: string[], path: string) {
  if (new Set(values).size !== values.length)
    throw new Error(`${path}: duplicate identifiers`);
}
export function validateMotion(input: unknown): Motion {
  const m = object(input, "document");
  if (m.version !== 1 && m.version !== 2 && m.version !== 3)
    throw new Error("Unsupported document version");
  const base: Base = {
    version: m.version,
    id: ident(m.id, "id"),
    title: str(m.title, "title", 120),
    description: str(m.description, "description"),
  };
  if (!base.title.trim()) throw new Error("Title is required");
  if (m.type === "lab" && m.version === 2) {
    const c = object(m.config, "config");
    if (typeof m.compare !== "boolean")
      throw new Error("Invalid comparison setting");
    return {
      ...base,
      version: 2,
      type: "lab",
      compare: m.compare,
      config: {
        jobs: integer(c.jobs, "jobs", 1, 60),
        arrival: integer(c.arrival, "arrival", 1, 6),
        workers: integer(c.workers, "workers", 1, 8),
        capacity: integer(c.capacity, "capacity", 0, 20),
        service: integer(c.service, "service", 1, 10),
      },
    };
  }
  if (m.type === "comparison" && m.version === 2) {
    const scenes = list(m.scenes, "scenes", 2, 2).map((raw) => {
      if (object(raw, "scene").type !== "scene")
        throw new Error("Comparison requires two scenes");
      const scene = validateMotion(raw);
      if (scene.type !== "scene")
        throw new Error("Comparison requires two scenes");
      if (scene.steps.some((step) => step.question))
        throw new Error("Comparison scenes cannot contain questions");
      return scene;
    });
    return { ...base, version: 2, type: "comparison", scenes };
  }
  if (m.type === "plotly" && m.version === 2)
    return {
      ...base,
      version: 2,
      type: "plotly",
      figure: validateFigure(m.figure),
    };
  if (m.type === "scene") {
    if (
      base.version !== 3 &&
      (m.parameters !== undefined || m.plot !== undefined)
    )
      throw new Error("Scene controls require document version 3");
    const parameters = validateParameters(
      m.parameters === undefined ? [] : m.parameters,
    );
    const steps = list(m.steps, "steps", 1, 100).map((raw, i): Step => {
      const s = object(raw, `step ${i + 1}`);
      const nodes = list(s.nodes, "nodes", 0, 64).map((raw): SceneNode => {
        const n = object(raw, "node");
        if (typeof n.highlighted !== "boolean")
          throw new Error("highlighted must be a boolean");
        return {
          ...nodeBindings(n, base.version),
          id: ident(n.id, "node.id"),
          label: str(n.label, "node.label", 120),
          value: str(n.value, "node.value", 200),
          x: num(n.x, "node.x", 0, 650),
          y: num(n.y, "node.y", 0, 350),
          color: color(n.color),
          highlighted: n.highlighted,
        };
      });
      unique(
        nodes.map((n) => n.id),
        "nodes",
      );
      const ids = new Set(nodes.map((n) => n.id));
      const edges = list(s.edges, "edges", 0, 128).map((raw): Edge => {
        const e = object(raw, "edge");
        const from = ident(e.from, "edge.from"),
          to = ident(e.to, "edge.to");
        if (!ids.has(from) || !ids.has(to) || from === to)
          throw new Error(
            "Arrow must connect two different blocks in this step",
          );
        return { from, to, label: str(e.label, "edge.label", 80) };
      });
      unique(
        edges.map((e) => `${e.from}:${e.to}`),
        "arrows",
      );
      return {
        title: str(s.title, "step.title", 120),
        description: str(s.description, "step.description"),
        code: str(s.code, "step.code", 4000),
        ...stepExtras(s, base.version),
        ...timingExtras(s, base.version),
        nodes,
        edges,
      };
    });
    if (base.version === 3)
      for (const step of steps)
        compileStep(
          step,
          parameters.map((p) => p.name),
        );
    let plot: Scene["plot"];
    if (m.plot !== undefined) {
      const checked = validateMotion({
        ...object(m.plot, "scene.plot"),
        ...base,
        version: 1,
        type: "plot",
        parameters,
      });
      if (checked.type !== "plot") throw new Error("Expected a graph");
      const { curves, xMin, xMax, yMin, yMax, xLabel, yLabel } = checked;
      plot = { curves, xMin, xMax, yMin, yMax, xLabel, yLabel };
    }
    return {
      ...base,
      ...(m.parameters !== undefined ? { parameters } : {}),
      ...(plot ? { plot } : {}),
      type: "scene",
      duration: num(m.duration, "duration", 300, 30000),
      steps,
    };
  }
  if (m.type !== "plot") throw new Error("Unknown document type");
  const parameters = validateParameters(m.parameters);
  const curves = list(m.curves, "curves", 1, 8).map((raw): Curve => {
    const c = object(raw, "curve");
    const formula = str(c.formula, "curve.formula", 256);
    compileExpression(
      formula,
      parameters.map((p) => p.name),
    );
    return {
      label: str(c.label, "curve.label", 120),
      formula,
      color: color(c.color),
    };
  });
  const xMin = num(m.xMin, "xMin"),
    xMax = num(m.xMax, "xMax"),
    yMin = num(m.yMin, "yMin"),
    yMax = num(m.yMax, "yMax");
  if (xMax - xMin < 1e-6 || yMax - yMin < 1e-6)
    throw new Error("Axis maximum must exceed minimum by at least 0.000001");
  return {
    ...base,
    type: "plot",
    xMin,
    xMax,
    yMin,
    yMax,
    xLabel: str(m.xLabel, "xLabel", 120),
    yLabel: str(m.yLabel, "yLabel", 120),
    parameters,
    curves,
  };
}
export function parseMotion(source: string): Motion {
  if (source.length > 500_000)
    throw new Error("Document exceeds 500,000 characters");
  return validateMotion(JSON.parse(source));
}
export function toBlock(motion: Motion): string {
  // Escaping backticks keeps user-entered code from closing the Markdown fence.
  const source = JSON.stringify(validateMotion(motion), null, 2).replace(
    /`/g,
    "\\u0060",
  );
  if (source.length > 500_000)
    throw new Error("Document exceeds 500,000 characters");
  return "```motion\n" + source + "\n```";
}
export function replaceBlock(
  markdown: string,
  original: Motion,
  updated: Motion,
): string {
  const blocks = [
    ...markdown.matchAll(
      /^([ \t]*)(`{3,}|~{3,})motion[^\S\r\n]*\r?\n([\s\S]*?)^\1\2[^\S\r\n]*(?=\r?$)/gm,
    ),
  ];
  const matches = blocks.filter((match) => {
    try {
      return parseMotion(match[3]!).id === original.id;
    } catch {
      return false;
    }
  });
  if (matches.length !== 1)
    throw new Error(
      "This visualization moved, was deleted, or has a duplicate ID. Reopen it before saving.",
    );
  const match = matches[0]!;
  if (
    JSON.stringify(parseMotion(match[3]!)) !==
    JSON.stringify(validateMotion(original))
  )
    throw new Error(
      "This visualization changed while the editor was open. Close and reopen it before saving.",
    );
  const newline = markdown.includes("\r\n") ? "\r\n" : "\n";
  const replacement = toBlock(updated)
    .split("\n")
    .map((line) => match[1]! + line)
    .join(newline);
  return (
    markdown.slice(0, match.index) +
    replacement +
    markdown.slice(match.index + match[0].length)
  );
}

function integer(
  value: unknown,
  path: string,
  min: number,
  max: number,
): number {
  const result = num(value, path, min, max);
  if (!Number.isInteger(result))
    throw new Error(`${path}: expected an integer`);
  return result;
}
function stepExtras(
  s: Record<string, unknown>,
  version: number,
): Partial<Step> {
  if (
    version === 1 &&
    (s.activeLines !== undefined ||
      s.variables !== undefined ||
      s.question !== undefined)
  )
    throw new Error("Interactive steps require document version 2");
  const extra: Partial<Step> = {};
  if (s.activeLines !== undefined) {
    extra.activeLines = list(s.activeLines, "activeLines", 0, 200).map((n) =>
      integer(n, "line", 1, String(s.code).split("\n").length),
    );
    unique(extra.activeLines.map(String), "activeLines");
  }
  if (s.variables !== undefined) {
    extra.variables = list(s.variables, "variables", 0, 30).map((raw) => {
      const v = object(raw, "variable");
      return {
        name: str(v.name, "variable.name", 64),
        value: str(v.value, "variable.value", 200),
      };
    });
    unique(
      extra.variables.map((v) => v.name),
      "variables",
    );
  }
  if (s.question !== undefined) {
    const q = object(s.question, "question");
    const options = list(q.options, "answers", 2, 6).map((raw) => {
      const a = object(raw, "answer");
      return {
        text: str(a.text, "answer.text", 200),
        explanation: str(a.explanation, "answer.explanation", 2000),
      };
    });
    extra.question = {
      prompt: str(q.prompt, "question.prompt", 1000),
      options,
      correct: integer(q.correct, "correct", 0, options.length - 1),
    };
  }
  return extra;
}
export function validateFigure(input: unknown): Record<string, unknown> {
  const figure = object(input, "figure");
  list(figure.data, "figure.data", 1, 100);
  if (figure.layout !== undefined) object(figure.layout, "figure.layout");
  if (figure.frames !== undefined) list(figure.frames, "figure.frames", 0, 100);
  let count = 0;
  function visit(value: unknown, depth = 0): unknown {
    if (++count > 100000 || depth > 24)
      throw new Error("Plotly figure is too complex");
    if (typeof value === "string") {
      if (/(?:https?:|ftp:|javascript:|data:text|file:|^\/\/)/i.test(value))
        throw new Error(
          "External resources are not supported in Plotly figures",
        );
      return value.replace(/<[^>]*>/g, "");
    }
    if (value === null || typeof value === "boolean") return value;
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (Array.isArray(value)) return value.map((v) => visit(v, depth + 1));
    const source = object(value, "figure value");
    const clean: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(source)) {
      if (["__proto__", "constructor", "prototype"].includes(key))
        throw new Error("Invalid Plotly property");
      if (/^(?:.*src|url|href|source|images|mapbox|map|geo)$/i.test(key))
        throw new Error(
          "External resources are not supported in Plotly figures",
        );
      if (
        key === "type" &&
        typeof item === "string" &&
        plotlyPolicy.excludedTraces.includes(item)
      )
        throw new Error(
          "Map traces require external resources and are not supported offline",
        );
      clean[key] = visit(item, depth + 1);
    }
    return clean;
  }
  const layout = { ...object(figure.layout ?? {}, "figure.layout") };
  // Python templates contain unused geographic defaults that would request map assets
  if (
    layout.template &&
    typeof layout.template === "object" &&
    !Array.isArray(layout.template)
  ) {
    const template = { ...object(layout.template, "template") };
    if (template.layout && typeof template.layout === "object") {
      const defaults = { ...object(template.layout, "template.layout") };
      for (const key of ["geo", "map", "mapbox"]) delete defaults[key];
      template.layout = defaults;
    }
    if (template.data && typeof template.data === "object") {
      const defaults = { ...object(template.data, "template.data") };
      for (const key of plotlyPolicy.excludedTraces) delete defaults[key];
      template.data = defaults;
    }
    layout.template = template;
  }
  return visit({
    data: figure.data,
    layout,
    frames: figure.frames ?? [],
  }) as Record<string, unknown>;
}

function validateParameters(input: unknown): Parameter[] {
  const parameters = list(input, "parameters", 0, 12).map((raw): Parameter => {
    const p = object(raw, "parameter");
    const name = ident(p.name, "parameter.name");
    if (!/^[A-Za-z][A-Za-z0-9_]*$/.test(name) || reservedNames.has(name))
      throw new Error(`Invalid parameter name: ${name}`);
    const min = num(p.min, "parameter.min"),
      max = num(p.max, "parameter.max");
    if (max <= min) throw new Error("Parameter maximum must exceed minimum");
    return {
      name,
      label: str(p.label, "parameter.label", 120),
      min,
      max,
      step: num(p.step, "parameter.step", 1e-6, max - min),
      value: num(p.value, "parameter.value", min, max),
    };
  });
  unique(
    parameters.map((p) => p.name),
    "parameters",
  );
  return parameters;
}

function nodeBindings(
  n: Record<string, unknown>,
  version: number,
): Partial<SceneNode> {
  if (n.bindings === undefined) return {};
  if (version !== 3)
    throw new Error("Scene controls require document version 3");
  const raw = object(n.bindings, "bindings"),
    bindings: NonNullable<SceneNode["bindings"]> = {};
  for (const key of ["x", "y"] as const)
    if (raw[key] !== undefined)
      bindings[key] = str(raw[key], `bindings.${key}`, 256);
  return { bindings };
}
function timingExtras(
  s: Record<string, unknown>,
  version: number,
): Partial<Step> {
  if (s.timing === undefined) return {};
  if (version !== 3)
    throw new Error("Scene controls require document version 3");
  const raw = object(s.timing, "timing");
  if (
    !["linear", "ease-in", "ease-out", "ease-in-out"].includes(
      String(raw.easing),
    )
  )
    throw new Error("Unknown easing");
  const timing: Timing = {
    transition: num(raw.transition, "transition", 0, 10000),
    hold: num(raw.hold, "hold", 0, 30000),
    easing: raw.easing as Timing["easing"],
  };
  if (timing.transition + timing.hold < 100)
    throw new Error("Step timing must be at least 100 ms");
  return { timing };
}
