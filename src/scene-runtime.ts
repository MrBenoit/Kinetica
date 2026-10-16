import { compileExpression, type Variables } from "./expression";
import type { Scene, Step, Timing } from "./model";

export function stepTiming(scene: Scene, step: Step): Timing {
  return (
    step.timing ?? {
      transition: Math.min(350, scene.duration),
      hold: Math.max(0, scene.duration - 350),
      easing: "ease-out",
    }
  );
}
export function ease(kind: Timing["easing"], progress: number): number {
  const p = Math.max(0, Math.min(1, progress));
  switch (kind) {
    case "linear":
      return p;
    case "ease-in":
      return p ** 3;
    case "ease-out":
      return 1 - (1 - p) ** 3;
    case "ease-in-out":
      return p < 0.5 ? 4 * p ** 3 : 1 - (-2 * p + 2) ** 3 / 2;
  }
}
function formula(source: string, names: string[]) {
  if (/\bx\b/.test(source))
    throw new Error("Scene formulas cannot use the graph variable x");
  return compileExpression(source, names);
}
function textTemplate(source: string, names: string[]) {
  const parts: {
    start: number;
    end: number;
    evaluate: (values: Variables) => number;
  }[] = [];
  for (const match of source.matchAll(/\{\{([^{}]+)\}\}/g)) {
    parts.push({
      start: match.index,
      end: match.index + match[0].length,
      evaluate: formula(match[1]!, names),
    });
  }
  if (source.replace(/\{\{([^{}]+)\}\}/g, "").match(/\{\{|\}\}/))
    throw new Error("Invalid text template");
  return (values: Variables) => {
    let result = "",
      offset = 0;
    for (const part of parts) {
      const value = part.evaluate(values);
      result +=
        source.slice(offset, part.start) +
        (Number.isFinite(value) ? String(Number(value.toPrecision(5))) : "?");
      offset = part.end;
    }
    return result + source.slice(offset);
  };
}
export function compileStep(
  step: Step,
  names: string[],
): (values: Variables) => Step {
  const title = textTemplate(step.title, names),
    description = textTemplate(step.description, names);
  const nodes = step.nodes.map((node) => ({
    node,
    label: textTemplate(node.label, names),
    value: textTemplate(node.value, names),
    x: node.bindings?.x ? formula(node.bindings.x, names) : undefined,
    y: node.bindings?.y ? formula(node.bindings.y, names) : undefined,
  }));
  const edges = step.edges.map((edge) => ({
    edge,
    label: textTemplate(edge.label, names),
  }));
  return (values) => ({
    ...step,
    title: title(values),
    description: description(values),
    nodes: nodes.map(({ node, label, value, x, y }) => {
      const px = x?.(values) ?? node.x,
        py = y?.(values) ?? node.y;
      return {
        ...node,
        label: label(values),
        value: value(values),
        x: Number.isFinite(px) ? Math.max(0, Math.min(650, px)) : node.x,
        y: Number.isFinite(py) ? Math.max(0, Math.min(350, py)) : node.y,
      };
    }),
    edges: edges.map(({ edge, label }) => ({ ...edge, label: label(values) })),
  });
}
