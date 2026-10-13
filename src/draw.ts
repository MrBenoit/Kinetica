import type { Step } from "./model";
import { svg } from "./ui";
export function drawScene(canvas: SVGSVGElement, step: Step, selected = "") {
  canvas.replaceChildren();
  const titleId = canvas.dataset.mnTitleId ?? `mn-title-${crypto.randomUUID()}`;
  canvas.dataset.mnTitleId = titleId;
  canvas.setAttribute("aria-labelledby", titleId);
  svg(canvas, "title", { id: titleId }, step.title);
  svg(canvas, "desc", {}, step.description);
  for (const edge of step.edges) {
    const from = step.nodes.find((n) => n.id === edge.from),
      to = step.nodes.find((n) => n.id === edge.to);
    if (!from || !to) continue;
    const dx = to.x - from.x,
      dy = to.y - from.y,
      length = Math.hypot(dx, dy);
    if (length < 1) continue;
    const ux = dx / length,
      uy = dy / length;
    const boundary = Math.min(
      70 / (Math.abs(ux) || 1e-10),
      37 / (Math.abs(uy) || 1e-10),
    );
    const x1 = from.x + 70 + ux * boundary,
      y1 = from.y + 37 + uy * boundary;
    const x2 = to.x + 70 - ux * (boundary + 5),
      y2 = to.y + 37 - uy * (boundary + 5);
    svg(canvas, "line", { x1, y1, x2, y2, class: "mn-arrow" });
    svg(canvas, "polygon", {
      points: `${x2},${y2} ${x2 - ux * 11 - uy * 5},${y2 - uy * 11 + ux * 5} ${x2 - ux * 11 + uy * 5},${y2 - uy * 11 - ux * 5}`,
      class: "mn-arrow-tip",
    });
    svg(
      canvas,
      "text",
      {
        x: (x1 + x2) / 2,
        y: (y1 + y2) / 2 - 12,
        "text-anchor": "middle",
        class: "mn-edge-label",
      },
      edge.label.slice(0, 32),
    );
  }
  for (const node of step.nodes) {
    const g = svg(canvas, "g", {
      transform: `translate(${node.x} ${node.y})`,
      class: `mn-node mn-${node.color}${node.highlighted ? " is-highlighted" : ""}${node.id === selected ? " is-selected" : ""}`,
      "data-node": node.id,
    });
    const nodeTitle = `${titleId}-${node.id}`;
    g.setAttribute("aria-labelledby", nodeTitle);
    svg(g, "title", { id: nodeTitle }, `${node.label}: ${node.value}`);
    svg(g, "rect", { width: 140, height: 74, rx: 12 });
    const shorten = (s: string, n: number) =>
      s.length > n ? s.slice(0, n - 1) + "…" : s;
    svg(
      g,
      "text",
      { x: 70, y: 28, "text-anchor": "middle", class: "mn-node-label" },
      shorten(node.label, 18),
    );
    svg(
      g,
      "text",
      { x: 70, y: 53, "text-anchor": "middle", class: "mn-node-value" },
      shorten(node.value, 20),
    );
  }
}
export function interpolateStep(
  previous: Step,
  next: Step,
  progress: number,
): Step {
  return {
    ...next,
    nodes: next.nodes.map((n) => {
      const p = previous.nodes.find((candidate) => candidate.id === n.id);
      return p
        ? {
            ...n,
            x: p.x + (n.x - p.x) * progress,
            y: p.y + (n.y - p.y) * progress,
          }
        : n;
    }),
  };
}
