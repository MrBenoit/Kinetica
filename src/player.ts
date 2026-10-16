import type { Motion, Scene, Step, Comparison } from "./model";
import { compileStep, ease, stepTiming } from "./scene-runtime";
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
      timer = 0,
      frame = 0,
      speed = 1,
      current = scene.steps[0]!;
    const parameters = scene.parameters ?? [];
    const values = Object.fromEntries(parameters.map((p) => [p.name, p.value]));
    const resolvers = scene.steps.map((step) =>
      scene.version === 3
        ? compileStep(
            step,
            parameters.map((p) => p.name),
          )
        : () => step,
    );
    let linkedPlot: PlotView | undefined;
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
      win.clearTimeout(timer);
      timer = 0;
      play.textContent = t("Play", "Запуск");
    };
    const go = (next: number, animate = true) => {
      if (!canGo(next)) return;
      win.cancelAnimationFrame(frame);
      const previous = current;
      index = next;
      current = resolvers[index]!(values);
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
      const timing = stepTiming(scene, scene.steps[index]!);
      if (!timing.transition) {
        render(current);
        return;
      }
      const start = win.performance.now();
      const tick = (now: number) => {
        const p = Math.min(1, (now - start) / (timing.transition / speed));
        render(interpolateStep(previous, current, ease(timing.easing, p)));
        if (p < 1) frame = win.requestAnimationFrame(tick);
      };
      frame = win.requestAnimationFrame(tick);
    };
    const start = () => {
      if (!canGo(index + 1)) return;
      if (index === scene.steps.length - 1) go(0);
      play.textContent = t("Pause", "Пауза");
      const schedule = () => {
        const timing = stepTiming(scene, scene.steps[index]!);
        timer = win.setTimeout(
          () => {
            if (index < scene.steps.length - 1) go(index + 1);
            if (index === scene.steps.length - 1 || !canGo(index + 1)) stop();
            else schedule();
          },
          (timing.transition + timing.hold) / speed,
        );
      };
      schedule();
    };
    const play = button(
      bar,
      t("Play", "Запуск"),
      () => (timer ? stop() : start()),
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
        const playing = timer !== 0;
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
    const controls = el(this.root, "div", "mn-parameters");
    const inputs: { range: HTMLInputElement; number: HTMLInputElement }[] = [];
    const update = () => {
      win.cancelAnimationFrame(frame);
      current = resolvers[index]!(values);
      drawScene(canvas, current);
      title.textContent = `${index + 1} / ${scene.steps.length} · ${current.title}`;
      description.textContent = current.description;
      linkedPlot?.setValues(values);
    };
    for (const p of parameters) {
      const row = el(controls, "label", "mn-parameter");
      el(row, "span", "", p.label || p.name);
      const range = el(row, "input"),
        number = el(row, "input");
      range.type = "range";
      number.type = "number";
      for (const input of [range, number]) {
        input.min = String(p.min);
        input.max = String(p.max);
        input.step = String(p.step);
        input.value = String(p.value);
      }
      range.setAttribute("aria-label", p.label || p.name);
      number.setAttribute(
        "aria-label",
        `${p.label || p.name} (${t("value", "значение")})`,
      );
      const change = (value: number) => {
        if (Number.isFinite(value))
          values[p.name] = Math.max(p.min, Math.min(p.max, value));
        range.value = number.value = String(values[p.name]);
        update();
      };
      range.addEventListener("input", () => change(Number(range.value)));
      number.addEventListener("change", () => change(number.valueAsNumber));
      inputs.push({ range, number });
    }
    if (parameters.length)
      button(controls, t("Reset parameters", "Сбросить параметры"), () => {
        parameters.forEach((p, i) => {
          values[p.name] = p.value;
          inputs[i]!.range.value = inputs[i]!.number.value = String(p.value);
        });
        update();
      });
    if (scene.plot) {
      linkedPlot = new PlotView(
        el(this.root, "div", "mn-linked-plot"),
        {
          ...scene.plot,
          version: 1,
          type: "plot",
          id: scene.id,
          title: scene.title,
          description: "",
          parameters,
        },
        t,
        { externalControls: true },
      );
      this.dispose.push(() => linkedPlot?.destroy());
    }
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
