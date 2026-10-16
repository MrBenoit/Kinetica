import { compileExpression } from "./expression";
import type { Plot } from "./model";
import type { Translate } from "./i18n";
import { el, svg, button, formatNumber } from "./ui";
export function sampleCurve(
  evaluate: (x: number) => number,
  min: number,
  max: number,
  count = 400,
): { x: number; y: number }[] {
  return Array.from({ length: count + 1 }, (_, i) => {
    const x = min + ((max - min) * i) / count;
    return { x, y: evaluate(x) };
  });
}
export function curvePath(
  points: { x: number; y: number }[],
  mapX: (x: number) => number,
  mapY: (y: number) => number,
  min: number,
  max: number,
): string {
  let pen = false,
    previous = NaN,
    path = "";
  for (const p of points) {
    const valid =
      Number.isFinite(p.y) &&
      p.y >= min - (max - min) * 3 &&
      p.y <= max + (max - min) * 3;
    if (!valid) {
      pen = false;
      previous = NaN;
      continue;
    }
    if (Math.abs(p.y - previous) > (max - min) * 1.5) pen = false;
    path += `${pen ? "L" : "M"}${mapX(p.x).toFixed(2)},${mapY(p.y).toFixed(2)}`;
    pen = true;
    previous = p.y;
  }
  return path;
}
export class PlotView {
  private canvas: SVGSVGElement;
  private values: Record<string, number>;
  private observer?: ResizeObserver;
  private observedWidth = 0;
  private resizeFrame = 0;
  private titleId = `mn-title-${crypto.randomUUID()}`;
  private clipId = `mn-clip-${crypto.randomUUID()}`;
  private frame = 0;
  private sweep = 0;
  private window: Window;
  private inputControls: {
    range: HTMLInputElement;
    number: HTMLInputElement;
  }[] = [];
  private evaluators: ((v: Record<string, number>) => number)[];
  private readout: HTMLElement;
  private last: { x: number; y: number }[][] = [];
  private animateButton?: HTMLButtonElement;
  constructor(
    private root: HTMLElement,
    private plot: Plot,
    private t: Translate,
    options: { externalControls?: boolean } = {},
  ) {
    this.window = root.ownerDocument.defaultView!;
    this.values = Object.fromEntries(
      plot.parameters.map((p) => [p.name, p.value]),
    );
    this.evaluators = plot.curves.map((c) =>
      compileExpression(
        c.formula,
        plot.parameters.map((p) => p.name),
      ),
    );
    this.canvas = svg(root, "svg", {
      class: "mn-plot",
      role: "img",
      "aria-labelledby": this.titleId,
    });
    this.readout = el(
      root,
      "p",
      "mn-readout",
      t(
        "Point at the graph to inspect values.",
        "Наведи на график, чтобы посмотреть значения.",
      ),
    );
    const legend = el(root, "div", "mn-legend");
    plot.curves.forEach((c) =>
      el(
        legend,
        "span",
        `mn-legend-item mn-${c.color}`,
        `${c.label}: ${c.formula}`,
      ),
    );
    const controls = el(root, "div", "mn-parameters");
    for (const p of options.externalControls ? [] : plot.parameters) {
      const row = el(controls, "label", "mn-parameter");
      el(row, "span", "", p.label || p.name);
      const range = el(row, "input");
      range.type = "range";
      range.min = String(p.min);
      range.max = String(p.max);
      range.step = String(p.step);
      range.value = String(p.value);
      range.setAttribute("aria-label", p.label || p.name);
      const number = el(row, "input");
      number.type = "number";
      number.min = range.min;
      number.max = range.max;
      number.step = range.step;
      number.value = range.value;
      number.setAttribute(
        "aria-label",
        `${p.label || p.name} (${t("value", "значение")})`,
      );
      const update = (value: number) => {
        this.stopSweep();
        if (!Number.isFinite(value)) return;
        this.values[p.name] = Math.max(p.min, Math.min(p.max, value));
        number.value = range.value = String(this.values[p.name]);
        this.draw(true);
      };
      range.addEventListener("input", () => update(Number(range.value)));
      number.addEventListener("change", () => {
        update(number.valueAsNumber);
        number.value = String(this.values[p.name]);
      });
      this.inputControls.push({ range, number });
    }
    const bar = el(root, "div", "mn-toolbar");
    if (plot.parameters.length && !options.externalControls) {
      this.animateButton = button(
        bar,
        t("Animate first parameter", "Анимировать первый параметр"),
        () => (this.sweep ? this.stopSweep() : this.startSweep()),
      );
      button(bar, t("Reset", "Сбросить"), () => {
        this.stopSweep();
        this.plot.parameters.forEach((p, i) => {
          this.values[p.name] = p.value;
          this.inputControls[i]!.range.value = this.inputControls[
            i
          ]!.number.value = String(p.value);
        });
        this.draw(true);
      });
    }
    this.canvas.addEventListener("pointermove", (event) => {
      const box = this.canvas.getBoundingClientRect();
      if (!box.width) return;
      const width = this.width(),
        px = ((event.clientX - box.left) / box.width) * width;
      const x = Math.max(
        plot.xMin,
        Math.min(
          plot.xMax,
          plot.xMin + ((px - 70) / (width - 94)) * (plot.xMax - plot.xMin),
        ),
      );
      this.readout.textContent =
        `${plot.xLabel} = ${formatNumber(x)}  ·  ` +
        this.evaluators
          .map(
            (f, i) =>
              `${plot.curves[i]!.label}: ${Number.isFinite(f({ ...this.values, x })) ? formatNumber(f({ ...this.values, x })) : t("undefined", "не определено")}`,
          )
          .join("  ·  ");
    });
    this.draw();
    if (typeof ResizeObserver !== "undefined") {
      this.observedWidth = root.clientWidth;
      this.observer = new ResizeObserver(() => {
        if (Math.abs(root.clientWidth - this.observedWidth) < 1) return;
        this.observedWidth = root.clientWidth;
        this.window.cancelAnimationFrame(this.resizeFrame);
        this.resizeFrame = this.window.requestAnimationFrame(() => {
          this.last = [];
          this.draw();
        });
      });
      this.observer.observe(root);
    }
  }
  setValues(values: Readonly<Record<string, number>>) {
    for (const p of this.plot.parameters) {
      const value = values[p.name];
      if (value !== undefined && Number.isFinite(value))
        this.values[p.name] = Math.max(p.min, Math.min(p.max, value));
    }
    this.draw();
  }
  private width() {
    return Math.max(360, Math.min(1000, this.root.clientWidth || 760));
  }
  private draw(animate = false) {
    this.window.cancelAnimationFrame(this.frame);
    const target = this.evaluators.map((f) =>
      sampleCurve(
        (x) => f({ ...this.values, x }),
        this.plot.xMin,
        this.plot.xMax,
      ),
    );
    const before = this.last;
    this.last = target;
    const reduce = this.window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (!animate || reduce || !before.length) {
      this.paint(target);
      return;
    }
    const started = this.window.performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - started) / 180);
      this.paint(
        target.map((points, i) =>
          points.map((point, j) => ({
            x: point.x,
            y:
              Number.isFinite(before[i]?.[j]?.y) && Number.isFinite(point.y)
                ? before[i]![j]!.y + (point.y - before[i]![j]!.y) * p
                : point.y,
          })),
        ),
      );
      if (p < 1) this.frame = this.window.requestAnimationFrame(tick);
    };
    this.frame = this.window.requestAnimationFrame(tick);
  }
  private paint(series: { x: number; y: number }[][]) {
    const p = this.plot,
      width = this.width(),
      height = 360,
      left = 70,
      right = width - 24,
      top = 22,
      bottom = 300;
    this.canvas.replaceChildren();
    this.canvas.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svg(this.canvas, "title", { id: this.titleId }, p.title);
    svg(
      this.canvas,
      "desc",
      {},
      `${p.xLabel}: ${p.xMin} … ${p.xMax}. ${p.yLabel}: ${p.yMin} … ${p.yMax}. ${p.curves.map((c) => c.formula).join("; ")}`,
    );
    const x = (v: number) =>
        left + ((v - p.xMin) / (p.xMax - p.xMin)) * (right - left),
      y = (v: number) =>
        bottom - ((v - p.yMin) / (p.yMax - p.yMin)) * (bottom - top);
    for (let i = 0; i <= 4; i++) {
      const vx = p.xMin + ((p.xMax - p.xMin) * i) / 4,
        vy = p.yMin + ((p.yMax - p.yMin) * i) / 4;
      svg(this.canvas, "line", {
        x1: x(vx),
        x2: x(vx),
        y1: top,
        y2: bottom,
        class: "mn-grid-line",
      });
      svg(this.canvas, "line", {
        x1: left,
        x2: right,
        y1: y(vy),
        y2: y(vy),
        class: "mn-grid-line",
      });
      svg(
        this.canvas,
        "text",
        { x: x(vx), y: bottom + 22, "text-anchor": "middle", class: "mn-tick" },
        formatNumber(vx),
      );
      svg(
        this.canvas,
        "text",
        { x: left - 10, y: y(vy) + 4, "text-anchor": "end", class: "mn-tick" },
        formatNumber(vy),
      );
    }
    svg(this.canvas, "rect", {
      x: left,
      y: top,
      width: right - left,
      height: bottom - top,
      class: "mn-plot-frame",
    });
    if (p.yMin < 0 && p.yMax > 0)
      svg(this.canvas, "line", {
        x1: left,
        x2: right,
        y1: y(0),
        y2: y(0),
        class: "mn-zero",
      });
    if (p.xMin < 0 && p.xMax > 0)
      svg(this.canvas, "line", {
        x1: x(0),
        x2: x(0),
        y1: top,
        y2: bottom,
        class: "mn-zero",
      });
    svg(
      this.canvas,
      "text",
      {
        x: (left + right) / 2,
        y: height - 6,
        "text-anchor": "middle",
        class: "mn-axis-title",
      },
      p.xLabel,
    );
    svg(
      this.canvas,
      "text",
      {
        transform: `translate(17 ${(top + bottom) / 2}) rotate(-90)`,
        "text-anchor": "middle",
        class: "mn-axis-title",
      },
      p.yLabel,
    );
    const clipId = this.clipId;
    const defs = svg(this.canvas, "defs");
    const clip = svg(defs, "clipPath", { id: clipId });
    svg(clip, "rect", {
      x: left,
      y: top,
      width: right - left,
      height: bottom - top,
    });
    series.forEach((points, i) =>
      svg(this.canvas, "path", {
        d: curvePath(points, x, y, p.yMin, p.yMax),
        class: `mn-curve mn-${p.curves[i]!.color}`,
        "clip-path": `url(#${clipId})`,
        "stroke-dasharray": i % 3 === 1 ? "8 4" : i % 3 === 2 ? "2 4" : "none",
      }),
    );
  }
  private startSweep() {
    const p = this.plot.parameters[0];
    if (!p) return;
    const start = this.window.performance.now();
    this.animateButton!.textContent = this.t("Pause", "Пауза");
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / 6000);
      this.values[p.name] = p.min + (p.max - p.min) * progress;
      this.inputControls[0]!.range.value = this.inputControls[0]!.number.value =
        formatNumber(this.values[p.name]!);
      this.draw();
      if (progress < 1) this.sweep = this.window.requestAnimationFrame(tick);
      else this.stopSweep();
    };
    this.sweep = this.window.requestAnimationFrame(tick);
  }
  private stopSweep() {
    this.window.cancelAnimationFrame(this.sweep);
    this.sweep = 0;
    if (this.animateButton)
      this.animateButton.textContent = this.t(
        "Animate first parameter",
        "Анимировать первый параметр",
      );
  }
  destroy() {
    this.stopSweep();
    this.window.cancelAnimationFrame(this.frame);
    this.window.cancelAnimationFrame(this.resizeFrame);
    this.observer?.disconnect();
    this.root.replaceChildren();
  }
}
