import type { Motion, Scene, Step } from "./model";
import { drawScene, interpolateStep } from "./draw";
import { PlotView } from "./plot";
import type { Translate } from "./i18n";
import { el, button, svg, select } from "./ui";
export class Player {
  private dispose: (() => void)[] = [];
  constructor(
    private root: HTMLElement,
    motion: Motion,
    t: Translate,
    edit?: () => void,
  ) {
    root.classList.add("mn-player");
    const heading = el(root, "div", "mn-player-heading");
    el(heading, "h3", "", motion.title);
    if (edit) button(heading, t("Edit", "Редактировать"), edit);
    if (motion.description) el(root, "p", "mn-description", motion.description);
    if (motion.type === "plot") {
      const view = new PlotView(el(root, "div", "mn-plot-body"), motion, t);
      this.dispose.push(() => view.destroy());
    } else this.scene(motion, t);
  }
  private scene(scene: Scene, t: Translate) {
    const win = this.root.ownerDocument.defaultView!,
      doc = this.root.ownerDocument;
    let index = 0,
      interval = 0,
      frame = 0,
      speed = 1,
      current = scene.steps[0]!;
    const canvas = svg(this.root, "svg", {
      viewBox: "0 0 800 440",
      class: "mn-scene",
      role: "img",
    });
    const caption = el(this.root, "div", "mn-caption");
    caption.setAttribute("aria-live", "polite");
    const title = el(caption, "strong");
    const description = el(caption, "p");
    const code = el(caption, "pre", "mn-code");
    const bar = el(this.root, "div", "mn-toolbar");
    const stop = () => {
      win.clearInterval(interval);
      interval = 0;
      play.textContent = t("Play", "Запуск");
    };
    const go = (next: number, animate = true) => {
      win.cancelAnimationFrame(frame);
      const previous = current;
      index = next;
      current = scene.steps[index]!;
      title.textContent = `${index + 1} / ${scene.steps.length} · ${current.title}`;
      description.textContent = current.description;
      code.textContent = current.code;
      code.hidden = !current.code;
      back.disabled = index === 0;
      forward.disabled = index === scene.steps.length - 1;
      dots.forEach((b, i) => {
        b.setAttribute("aria-current", String(i === index));
        b.classList.toggle("is-active", i === index);
      });
      const render = (s: Step) => drawScene(canvas, s);
      if (
        !animate ||
        win.matchMedia?.("(prefers-reduced-motion: reduce)").matches
      ) {
        render(current);
        return;
      }
      const start = win.performance.now();
      const tick = (now: number) => {
        const p = Math.min(1, (now - start) / 350);
        render(interpolateStep(previous, current, 1 - (1 - p) ** 3));
        if (p < 1) frame = win.requestAnimationFrame(tick);
      };
      frame = win.requestAnimationFrame(tick);
    };
    const start = () => {
      if (index === scene.steps.length - 1) go(0);
      play.textContent = t("Pause", "Пауза");
      interval = win.setInterval(() => {
        if (index < scene.steps.length - 1) go(index + 1);
        if (index === scene.steps.length - 1) stop();
      }, scene.duration / speed);
    };
    const play = button(
      bar,
      t("Play", "Запуск"),
      () => (interval ? stop() : start()),
      "mod-cta",
    );
    play.disabled = scene.steps.length < 2;
    const back = button(bar, t("Back", "Назад"), () => {
      stop();
      go(index - 1);
    });
    const forward = button(bar, t("Next", "Далее"), () => {
      stop();
      go(index + 1);
    });
    button(bar, t("Restart", "Сначала"), () => {
      stop();
      go(0);
    });
    select(
      bar,
      t("Speed", "Скорость"),
      [0.5, 1, 1.5, 2].map((v) => ({ value: String(v), label: `${v}×` })),
      "1",
      (v) => {
        const playing = interval !== 0;
        stop();
        speed = Number(v);
        if (playing) start();
      },
    );
    const timeline = el(this.root, "div", "mn-timeline");
    const dots = scene.steps.map((s, i) =>
      button(
        timeline,
        `${i + 1}. ${s.title}`,
        () => {
          stop();
          go(i);
        },
        "mn-step-button",
      ),
    );
    const visibility = () => {
      if (doc.hidden) stop();
    };
    doc.addEventListener("visibilitychange", visibility);
    this.dispose.push(() => {
      stop();
      win.cancelAnimationFrame(frame);
      doc.removeEventListener("visibilitychange", visibility);
    });
    go(0, false);
  }
  destroy() {
    this.dispose.forEach((fn) => fn());
    this.dispose = [];
    this.root.replaceChildren();
  }
}
