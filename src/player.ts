import type { Motion, Scene, Step, Comparison } from "./model";
import { drawScene, interpolateStep } from "./draw";
import { PlotView } from "./plot";
import { LabView } from "./lab";
import { PlotlyView } from "./plotly-view";
import { renderCode } from "./code-view";
import type { Translate } from "./i18n";
import { el, button, svg, select } from "./ui";
export class Player {
  private seekHandler?: (index: number) => void;
  readonly stepCount: number;
  seek(index: number) {
    this.seekHandler?.(Math.max(0, Math.min(this.stepCount - 1, index)));
  }
  private dispose: (() => void)[] = [];
  constructor(
    private root: HTMLElement,
    motion: Motion,
    t: Translate,
    edit?: () => void,
    private options: { controlled?: boolean; share?: () => void } = {},
  ) {
    this.stepCount = motion.type === "scene" ? motion.steps.length : 1;
    root.classList.add("mn-player");
    const heading = el(root, "div", "mn-player-heading");
    el(heading, "h3", "", motion.title);
    if (edit) button(heading, t("Edit", "Редактировать"), edit);
    if (options.share)
      button(heading, t("Export HTML", "Экспорт HTML"), options.share);
    if (motion.description) el(root, "p", "mn-description", motion.description);
    if (motion.type === "plot") {
      const view = new PlotView(el(root, "div", "mn-plot-body"), motion, t);
      this.dispose.push(() => view.destroy());
    } else if (motion.type === "scene") this.scene(motion, t);
    else if (motion.type === "lab") {
      const view = new LabView(el(root, "div"), motion, t);
      this.dispose.push(() => view.destroy());
    } else if (motion.type === "comparison") this.comparison(motion, t);
    else {
      const view = new PlotlyView(el(root, "div"), motion, t);
      this.dispose.push(() => view.destroy());
    }
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
    const code = el(caption, "div");
    const questionRoot = el(caption, "div", "mn-question");
    const answered = new Set<number>();
    const canGo = (target: number) =>
      !scene.steps.some((s, i) => i < target && s.question && !answered.has(i));
    const bar = el(this.root, "div", "mn-toolbar");
    const stop = () => {
      win.clearInterval(interval);
      interval = 0;
      play.textContent = t("Play", "Запуск");
    };
    const go = (next: number, animate = true) => {
      if (!canGo(next)) return;
      win.cancelAnimationFrame(frame);
      const previous = current;
      index = next;
      current = scene.steps[index]!;
      title.textContent = `${index + 1} / ${scene.steps.length} · ${current.title}`;
      description.textContent = current.description;
      renderCode(code, current, index ? previous : undefined, t);
      back.disabled = index === 0;
      forward.disabled = index === scene.steps.length - 1 || !canGo(index + 1);
      play.disabled = scene.steps.length < 2 || !canGo(index + 1);
      dots.forEach((b, i) => {
        b.disabled = !canGo(i);
        b.setAttribute("aria-current", String(i === index));
        b.classList.toggle("is-active", i === index);
      });
      questionRoot.replaceChildren();
      if (current.question) {
        const q = current.question;
        el(questionRoot, "strong", "", q.prompt);
        const answers = el(questionRoot, "div", "mn-question-options");
        const feedback = el(questionRoot, "p", "mn-question-feedback");
        feedback.setAttribute("aria-live", "polite");
        if (answered.has(index))
          feedback.textContent = q.options[q.correct]!.explanation;
        q.options.forEach((answer, choice) => {
          button(answers, answer.text, () => {
            if (choice === q.correct) {
              answered.add(index);
              go(index, false);
              questionRoot.querySelector(".mn-question-feedback")!.textContent =
                t("Correct. ", "Верно. ") + answer.explanation;
            } else
              feedback.textContent =
                t("Try again. ", "Попробуй ещё раз. ") + answer.explanation;
          }).disabled = answered.has(index);
        });
        if (!answered.has(index))
          button(questionRoot, t("Show answer", "Показать ответ"), () => {
            answered.add(index);
            go(index, false);
            questionRoot.querySelector(".mn-question-feedback")!.textContent =
              q.options[q.correct]!.text +
              ": " +
              q.options[q.correct]!.explanation;
          });
      }
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
      if (!canGo(index + 1)) return;
      if (index === scene.steps.length - 1) go(0);
      play.textContent = t("Pause", "Пауза");
      interval = win.setInterval(() => {
        if (index < scene.steps.length - 1) go(index + 1);
        if (index === scene.steps.length - 1 || !canGo(index + 1)) stop();
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
      answered.clear();
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
    bar.hidden = !!this.options.controlled;
    timeline.hidden = !!this.options.controlled;
    this.seekHandler = (i) => {
      stop();
      go(i);
    };
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
  private comparison(motion: Comparison, t: Translate) {
    const win = this.root.ownerDocument.defaultView!;
    const bar = el(this.root, "div", "mn-toolbar");
    const status = el(this.root, "p");
    status.setAttribute("aria-live", "polite");
    const grid = el(this.root, "div", "mn-comparison-grid");
    const players = motion.scenes.map(
      (scene) =>
        new Player(el(grid, "section"), scene, t, undefined, {
          controlled: true,
        }),
    );
    const count = Math.max(...players.map((player) => player.stepCount));
    let index = 0,
      timer = 0;
    const stop = () => {
      win.clearInterval(timer);
      timer = 0;
      play.textContent = t("Play", "Запуск");
    };
    const draw = () => {
      players.forEach((player) => player.seek(index));
      status.textContent = `${t("Step", "Шаг")} ${index + 1} / ${count}`;
      back.disabled = index === 0;
      next.disabled = index === count - 1;
    };
    const play = button(bar, t("Play", "Запуск"), () => {
      if (timer) {
        stop();
        return;
      }
      if (index === count - 1) {
        index = 0;
        draw();
      }
      play.textContent = t("Pause", "Пауза");
      timer = win.setInterval(() => {
        index = Math.min(count - 1, index + 1);
        draw();
        if (index === count - 1) stop();
      }, 1500);
    });
    play.disabled = count < 2;
    const back = button(bar, t("Back", "Назад"), () => {
      stop();
      index--;
      draw();
    });
    const next = button(bar, t("Next", "Далее"), () => {
      stop();
      index++;
      draw();
    });
    button(bar, t("Restart", "Сначала"), () => {
      stop();
      index = 0;
      draw();
    });
    const visibility = () => {
      if (this.root.ownerDocument.hidden) stop();
    };
    this.root.ownerDocument.addEventListener("visibilitychange", visibility);
    this.dispose.push(() => {
      stop();
      players.forEach((player) => player.destroy());
      this.root.ownerDocument.removeEventListener(
        "visibilitychange",
        visibility,
      );
    });
    draw();
  }
  destroy() {
    this.dispose.forEach((fn) => fn());
    this.dispose = [];
    this.root.replaceChildren();
  }
}
