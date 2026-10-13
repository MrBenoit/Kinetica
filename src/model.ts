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
export interface SceneNode {
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
export interface Step {
  title: string;
  description: string;
  code: string;
  nodes: SceneNode[];
  edges: Edge[];
}
interface Base {
  version: 1;
  id: string;
  title: string;
  description: string;
}
export interface Scene extends Base {
  type: "scene";
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
export type Motion = Scene | Plot;
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
  if (m.version !== 1) throw new Error("Unsupported document version");
  const base = {
    version: 1 as const,
    id: ident(m.id, "id"),
    title: str(m.title, "title", 120),
    description: str(m.description, "description"),
  };
  if (!base.title.trim()) throw new Error("Title is required");
  if (m.type === "scene") {
    const steps = list(m.steps, "steps", 1, 100).map((raw, i): Step => {
      const s = object(raw, `step ${i + 1}`);
      const nodes = list(s.nodes, "nodes", 0, 64).map((raw): SceneNode => {
        const n = object(raw, "node");
        if (typeof n.highlighted !== "boolean")
          throw new Error("highlighted must be a boolean");
        return {
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
        nodes,
        edges,
      };
    });
    return {
      ...base,
      type: "scene",
      duration: num(m.duration, "duration", 300, 30000),
      steps,
    };
  }
  if (m.type !== "plot") throw new Error("Unknown document type");
  const parameters = list(m.parameters, "parameters", 0, 12).map(
    (raw): Parameter => {
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
    },
  );
  unique(
    parameters.map((p) => p.name),
    "parameters",
  );
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
