import type { Lab, QueueConfig, Step } from "./model";
import type { Translate } from "./i18n";
import { simulateQueue } from "./queue";
import { drawScene } from "./draw";
import { button, el, svg } from "./ui";
export class LabView {
  private timer = 0;
  private index = 0;
  private config: QueueConfig;
  private body: HTMLElement;
  private play: HTMLButtonElement;
  private timeline: HTMLInputElement;
  private tracks: ReturnType<typeof simulateQueue>[] = [];
  private win: Window;
  private visibility = () => {
    if (this.root.ownerDocument.hidden) this.stop();
  };
  constructor(
    private root: HTMLElement,
    private lab: Lab,
    private t: Translate,
  ) {
    this.win = root.ownerDocument.defaultView!;
    this.config = { ...lab.config };
    const controls = el(root, "div", "mn-lab-controls");
    const labels: [keyof QueueConfig, string, number, number][] = [
      ["jobs", t("Jobs", "Задачи"), 1, 60],
      ["arrival", t("Arrivals per tick", "Поступлений за такт"), 1, 6],
      ["workers", t("Workers", "Работники"), 1, 8],
      ["capacity", t("Buffer capacity", "Размер буфера"), 0, 20],
      ["service", t("Ticks per job", "Тактов на задачу"), 1, 10],
    ];
    for (const [key, label, min, max] of labels) {
      const wrapper = el(controls, "label", "mn-lab-control");
      el(wrapper, "span", "", label);
      const input = el(wrapper, "input");
      input.type = "range";
      input.min = String(min);
      input.max = String(max);
      input.step = "1";
      input.value = String(this.config[key]);
      const output = el(wrapper, "output", "", input.value);
      input.addEventListener("input", () => {
        this.config[key] = Number(input.value);
        output.textContent = input.value;
        this.recompute();
      });
    }
    el(
      root,
      "p",
      "mn-hint",
      t(
        "A deterministic teaching model. One tick is an abstract time unit, not a Go scheduler trace. Full buffers block producers; jobs are not dropped.",
        "Учебная модель с одинаковым результатом при одинаковых условиях. Такт - условная единица времени, не трассировка планировщика Go. Заполненный буфер блокирует отправителей, задачи не теряются.",
      ),
    );
    const toolbar = el(root, "div", "mn-toolbar");
    this.play = button(toolbar, t("Play", "Запуск"), () => {
      if (this.timer) this.stop();
      else {
        if (this.index >= this.length - 1) this.index = 0;
        this.play.textContent = t("Pause", "Пауза");
        this.timer = this.win.setInterval(() => {
          this.index++;
          this.draw();
          if (this.index >= this.length - 1) this.stop();
        }, 450);
      }
    });
    button(toolbar, t("Back", "Назад"), () => {
      this.stop();
      this.index = Math.max(0, this.index - 1);
      this.draw();
    });
    button(toolbar, t("Next", "Далее"), () => {
      this.stop();
      this.index = Math.min(this.length - 1, this.index + 1);
      this.draw();
    });
    button(toolbar, t("Restart", "Сначала"), () => {
      this.stop();
      this.index = 0;
      this.draw();
    });
    const timelineLabel = el(root, "label", "mn-lab-control");
    el(timelineLabel, "span", "", t("Time", "Время"));
    this.timeline = el(timelineLabel, "input");
    this.timeline.type = "range";
    this.timeline.min = "0";
    this.timeline.step = "1";
    this.timeline.addEventListener("input", () => {
      this.stop();
      this.index = Number(this.timeline.value);
      this.draw();
    });
    this.body = el(root, "div", "mn-linked-views");
    root.ownerDocument.addEventListener("visibilitychange", this.visibility);
    this.recompute();
  }
  private get length() {
    return Math.max(...this.tracks.map((s) => s.length));
  }
  private recompute() {
    this.stop();
    this.index = 0;
    this.tracks = [simulateQueue(this.config)];
    if (this.lab.compare)
      this.tracks.unshift(simulateQueue({ ...this.config, workers: 1 }));
    this.timeline.max = String(this.length - 1);
    this.draw();
  }
  private draw() {
    this.timeline.value = String(this.index);
    this.body.replaceChildren();
    const t = this.t;
    el(
      this.body,
      "p",
      "mn-lab-time",
      `${t("Tick", "Такт")}: ${this.index} / ${this.length - 1}`,
    );
    const panels = el(
      this.body,
      "div",
      this.lab.compare ? "mn-comparison-grid" : "",
    );
    this.tracks.forEach((states, i) => {
      const current = states[Math.min(this.index, states.length - 1)]!;
      const panel = el(panels, "section");
      el(
        panel,
        "h4",
        "",
        this.lab.compare && i === 0
          ? t("One worker", "Один работник")
          : t("Worker pool", "Пул работников"),
      );
      const canvas = svg(panel, "svg", {
        viewBox: "0 0 800 440",
        class: "mn-scene",
        role: "img",
      });
      const step: Step = {
        title: t("Queue state", "Состояние очереди"),
        description: `${current.completed}/${this.config.jobs}`,
        code: "",
        nodes: [],
        edges: [],
      };
      const cells = [
        [
          t("Blocked producers", "Ждут отправки"),
          current.blocked,
          25,
          80,
          "orange",
        ],
        [t("Buffer", "Буфер"), current.buffered, 260, 80, "blue"],
        [t("Running", "В работе"), current.running, 500, 80, "purple"],
        [t("Completed", "Завершено"), current.completed, 500, 290, "green"],
      ] as const;
      cells.forEach(([label, value, x, y, color], n) =>
        step.nodes.push({
          id: String(n),
          label,
          value: String(value),
          x,
          y,
          color,
          highlighted: value > 0,
        }),
      );
      step.edges = [
        { from: "0", to: "1", label: "" },
        { from: "1", to: "2", label: "" },
        { from: "2", to: "3", label: "" },
      ];
      if (this.config.capacity === 0)
        step.edges = [
          { from: "0", to: "2", label: t("Direct handoff", "Прямая передача") },
          { from: "2", to: "3", label: "" },
        ];
      drawScene(canvas, step);
      el(
        panel,
        "p",
        "mn-lab-metrics",
        `${t("Created", "Создано")}: ${current.created} | ${t("Completed", "Завершено")}: ${current.completed} | ${t("Waiting", "Ожидают")}: ${current.buffered + current.blocked}`,
      );
    });
    const chart = svg(this.body, "svg", {
      viewBox: "0 0 800 240",
      class: "mn-lab-chart",
      role: "img",
    });
    const title = `lab-chart-${crypto.randomUUID()}`;
    chart.setAttribute("aria-labelledby", title);
    svg(
      chart,
      "title",
      { id: title },
      t("Completed jobs over time", "Завершённые задачи по времени"),
    );
    svg(chart, "path", { d: "M45 15V200H770", class: "mn-lab-axis" });
    svg(chart, "text", { x: 45, y: 230, class: "mn-axis-label" }, "0");
    svg(
      chart,
      "text",
      { x: 740, y: 230, class: "mn-axis-label" },
      String(this.length - 1),
    );
    svg(
      chart,
      "text",
      { x: 5, y: 25, class: "mn-axis-label" },
      String(this.config.jobs),
    );
    svg(
      chart,
      "text",
      { x: 350, y: 230, class: "mn-axis-label" },
      t("Time (ticks)", "Время (такты)"),
    );
    this.tracks.forEach((states, i) => {
      const d = states
        .map(
          (s, n) =>
            `${n ? "L" : "M"}${45 + (s.tick / (this.length - 1)) * 725} ${200 - (s.completed / this.config.jobs) * 180}`,
        )
        .join(" ");
      svg(chart, "path", {
        d,
        class: `mn-lab-series mn-series-${this.lab.compare ? i : 1}`,
      });
    });
    const x = 45 + (this.index / (this.length - 1)) * 725;
    svg(chart, "line", {
      x1: x,
      x2: x,
      y1: 15,
      y2: 200,
      class: "mn-lab-cursor",
    });
    el(
      this.body,
      "p",
      "mn-hint",
      this.lab.compare
        ? t(
            "Orange: one worker. Blue: worker pool. Both receive the same jobs at the same times.",
            "Оранжевая линия: один работник. Синяя: пул. Оба варианта получают одинаковые задачи в одно и то же время.",
          )
        : t(
            "Blue: completed jobs. The vertical line marks the current tick.",
            "Синяя линия: завершённые задачи. Вертикальная линия отмечает текущий такт.",
          ),
    );
  }
  private stop() {
    this.win.clearInterval(this.timer);
    this.timer = 0;
    if (this.play) this.play.textContent = this.t("Play", "Запуск");
  }
  destroy() {
    this.stop();
    this.root.ownerDocument.removeEventListener(
      "visibilitychange",
      this.visibility,
    );
    this.root.replaceChildren();
  }
}
