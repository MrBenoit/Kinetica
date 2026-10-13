import type { Motion, Scene, Plot, SceneNode, Color } from "./model";
import { clone, palette, parseMotion, uid, validateMotion } from "./model";
import { template, type Template } from "./templates";
import type { Translate } from "./i18n";
import {
  el,
  button,
  field,
  numberField,
  select,
  svg,
  errorMessage,
} from "./ui";
import { drawScene } from "./draw";
import { Player } from "./player";
export class Editor {
  draft?: Motion;
  private initial = "";
  private undoStack: Motion[] = [];
  private redoStack: Motion[] = [];
  private step = 0;
  private selected = "";
  private preview?: Player;
  private previewRoot?: HTMLElement;
  private error?: HTMLElement;
  private saveButton?: HTMLButtonElement;
  private saving = false;
  constructor(
    private root: HTMLElement,
    private t: Translate,
    private save: (motion: Motion) => Promise<void>,
    private cancel: () => void,
    initial?: Motion,
  ) {
    this.draft = initial ? clone(initial) : undefined;
    this.initial = initial ? JSON.stringify(initial) : "";
    this.render();
  }
  get dirty() {
    return (
      this.draft !== undefined && JSON.stringify(this.draft) !== this.initial
    );
  }
  private remember() {
    if (!this.draft) return;
    this.undoStack.push(clone(this.draft));
    if (this.undoStack.length > 50) this.undoStack.shift();
    this.redoStack = [];
  }
  private change(action: () => void, rerender = false) {
    this.remember();
    action();
    if (rerender) this.render();
    else this.refreshPreview();
  }
  private labelColors() {
    return palette.map((value) => ({
      value,
      label: {
        blue: this.t("Blue", "Синий"),
        orange: this.t("Orange", "Оранжевый"),
        green: this.t("Green", "Зелёный"),
        purple: this.t("Purple", "Фиолетовый"),
        red: this.t("Red", "Красный"),
        cyan: this.t("Cyan", "Голубой"),
      }[value],
    }));
  }
  private render() {
    this.preview?.destroy();
    this.preview = undefined;
    this.previewRoot = undefined;
    this.root.replaceChildren();
    this.root.classList.add("mn-editor");
    if (!this.draft) {
      this.picker();
      return;
    }
    const m = this.draft,
      t = this.t;
    const header = el(this.root, "div", "mn-editor-heading");
    el(header, "h2", "", t("Edit visualization", "Редактор визуализации"));
    const history = el(header, "div", "mn-toolbar");
    button(history, t("Undo", "Отменить"), () => {
      const previous = this.undoStack.pop();
      if (previous) {
        this.redoStack.push(clone(this.draft!));
        this.draft = previous;
        this.step = 0;
        this.selected = "";
        this.render();
      }
    }).disabled = !this.undoStack.length;
    button(history, t("Redo", "Повторить"), () => {
      const next = this.redoStack.pop();
      if (next) {
        this.undoStack.push(clone(this.draft!));
        this.draft = next;
        this.step = 0;
        this.selected = "";
        this.render();
      }
    }).disabled = !this.redoStack.length;
    const common = el(this.root, "div", "mn-common");
    field(common, t("Title", "Название"), m.title, (v) =>
      this.change(() => {
        m.title = v;
      }),
    );
    field(
      common,
      t("Introduction", "Вступление"),
      m.description,
      (v) =>
        this.change(() => {
          m.description = v;
        }),
      true,
    );
    if (m.type === "scene") {
      this.scene(m);
      const details = el(this.root, "details", "mn-preview-details");
      el(
        details,
        "summary",
        "",
        t("Playback preview", "Предпросмотр воспроизведения"),
      );
      this.previewRoot = el(details, "div", "mn-preview");
    } else this.plot(m);
    this.error = el(this.root, "p", "mn-error");
    this.error.setAttribute("role", "alert");
    const footer = el(this.root, "div", "mn-footer");
    button(footer, t("Cancel", "Отмена"), this.cancel);
    this.saveButton = button(
      footer,
      t("Save to note", "Сохранить в заметку"),
      () => {
        void this.submit();
      },
      "mod-cta",
    );
    this.refreshPreview();
  }
  private picker() {
    const t = this.t;
    el(
      this.root,
      "h2",
      "",
      t("Create a visualization", "Создать визуализацию"),
    );
    el(
      this.root,
      "p",
      "mn-description",
      t(
        "Start with an example, customize it, and save it inside your note. Everything works offline.",
        "Выбери пример, настрой его и сохрани в заметку. Всё работает без интернета.",
      ),
    );
    const grid = el(this.root, "div", "mn-template-grid");
    const choices: [Template, string, string][] = [
      [
        "flow",
        t("Message delivery", "Передача сообщения"),
        t(
          "Moving blocks, arrows and three steps",
          "Движение блоков, стрелки и три шага",
        ),
      ],
      [
        "array",
        t("Append and arrays", "Append и массивы"),
        t("Explain code one step at a time", "Объясняй код по шагам"),
      ],
      [
        "wave",
        t("Wave playground", "Волна и ползунки"),
        t(
          "Amplitude and frequency on X/Y axes",
          "Амплитуда и частота на осях X/Y",
        ),
      ],
      [
        "growth",
        t("Exponential growth", "Экспоненциальный рост"),
        t(
          "Explore how the growth rate affects a curve",
          "Исследуй влияние скорости роста на кривую",
        ),
      ],
      [
        "blank-scene",
        t("Empty scene", "Пустая сцена"),
        t(
          "Build your own visual explanation",
          "Собери своё визуальное объяснение",
        ),
      ],
      [
        "blank-plot",
        t("Custom graph", "Свой график"),
        t(
          "Set formulas, axes and parameters",
          "Настрой формулы, оси и параметры",
        ),
      ],
    ];
    for (const [kind, title, description] of choices) {
      const card = button(
        grid,
        "",
        () => {
          this.draft = template(kind, t);
          this.render();
        },
        "mn-template",
      );
      el(card, "strong", "", title);
      el(card, "span", "", description);
    }
    const advanced = el(this.root, "details");
    el(advanced, "summary", "", t("Import JSON", "Импортировать JSON"));
    let source = "";
    field(
      advanced,
      t("Paste a Kinetica document", "Вставь документ Kinetica"),
      "",
      (v) => {
        source = v;
      },
      true,
    );
    const error = el(advanced, "p", "mn-error");
    error.setAttribute("role", "alert");
    button(advanced, t("Import", "Импортировать"), () => {
      try {
        this.draft = parseMotion(source);
        this.draft.id = uid();
        this.render();
      } catch (e) {
        error.textContent = errorMessage(e);
      }
    });
  }
  private scene(m: Scene) {
    const t = this.t;
    this.step = Math.min(this.step, m.steps.length - 1);
    const step = m.steps[this.step]!;
    const layout = el(this.root, "div", "mn-editor-grid");
    const main = el(layout, "div");
    const inspector = el(layout, "div", "mn-inspector");
    const tools = el(main, "div", "mn-toolbar");
    button(tools, t("Add block", "Добавить блок"), () =>
      this.change(() => {
        if (step.nodes.length >= 64) return;
        const n: SceneNode = {
          id: uid(),
          label: t("Block", "Блок"),
          value: "",
          x: 80 + (step.nodes.length % 4) * 160,
          y: 70 + Math.floor((step.nodes.length % 12) / 4) * 100,
          color: palette[step.nodes.length % palette.length]!,
          highlighted: false,
        };
        step.nodes.push(n);
        this.selected = n.id;
      }, true),
    ).disabled = step.nodes.length >= 64;
    el(
      main,
      "p",
      "mn-hint",
      t(
        "Drag blocks on the canvas. Select a block to edit it. Arrow keys move a focused block; Shift moves faster.",
        "Перетаскивай блоки по холсту. Выбери блок для настройки. Стрелки на клавиатуре двигают блок, Shift ускоряет.",
      ),
    );
    const canvas = svg(main, "svg", {
      viewBox: "0 0 800 440",
      class: "mn-scene mn-canvas",
    });
    const draw = () => {
      drawScene(canvas, step, this.selected);
      canvas.querySelectorAll<SVGGElement>("[data-node]").forEach((g) => {
        g.setAttribute("tabindex", "0");
        g.setAttribute("role", "button");
      });
    };
    draw();
    let drag:
      | {
          node: SceneNode;
          startX: number;
          startY: number;
          x: number;
          y: number;
          pointer: number;
        }
      | undefined;
    canvas.addEventListener("pointerdown", (event) => {
      const group = (event.target as Element).closest<SVGGElement>(
        "[data-node]",
      );
      if (!group || event.button !== 0) return;
      const node = step.nodes.find((n) => n.id === group.dataset.node)!;
      this.remember();
      this.selected = node.id;
      drag = {
        node,
        startX: event.clientX,
        startY: event.clientY,
        x: node.x,
        y: node.y,
        pointer: event.pointerId,
      };
      canvas.setPointerCapture?.(event.pointerId);
      event.preventDefault();
      draw();
    });
    canvas.addEventListener("pointermove", (event) => {
      if (!drag || drag.pointer !== event.pointerId) return;
      const box = canvas.getBoundingClientRect();
      if (!box.width || !box.height) return;
      drag.node.x = Math.round(
        Math.max(
          0,
          Math.min(
            650,
            drag.x + ((event.clientX - drag.startX) * 800) / box.width,
          ),
        ),
      );
      drag.node.y = Math.round(
        Math.max(
          0,
          Math.min(
            350,
            drag.y + ((event.clientY - drag.startY) * 440) / box.height,
          ),
        ),
      );
      draw();
    });
    const end = (event: PointerEvent) => {
      if (!drag || drag.pointer !== event.pointerId) return;
      canvas.releasePointerCapture?.(event.pointerId);
      drag = undefined;
      this.render();
    };
    canvas.addEventListener("pointerup", end);
    canvas.addEventListener("pointercancel", end);
    canvas.addEventListener("keydown", (event) => {
      const group = (event.target as Element).closest<SVGGElement>(
        "[data-node]",
      );
      if (!group) return;
      const node = step.nodes.find((n) => n.id === group.dataset.node)!;
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        this.selected = node.id;
        this.render();
        this.root
          .querySelector<HTMLInputElement>(".mn-inspector input")
          ?.focus();
        return;
      }
      const delta = event.shiftKey ? 10 : 2;
      const directions: Record<string, [number, number]> = {
        ArrowLeft: [-delta, 0],
        ArrowRight: [delta, 0],
        ArrowUp: [0, -delta],
        ArrowDown: [0, delta],
      };
      const move = directions[event.key];
      if (!move) return;
      event.preventDefault();
      this.change(() => {
        node.x = Math.max(0, Math.min(650, node.x + move[0]));
        node.y = Math.max(0, Math.min(350, node.y + move[1]));
      });
      draw();
      canvas.querySelector<SVGGElement>(`[data-node="${node.id}"]`)?.focus();
    });
    const timeline = el(main, "div", "mn-timeline");
    m.steps.forEach((s, i) => {
      const b = button(
        timeline,
        `${i + 1}. ${s.title}`,
        () => {
          this.step = i;
          this.selected = "";
          this.render();
        },
        "mn-step-button",
      );
      b.classList.toggle("is-active", i === this.step);
      b.setAttribute("aria-current", String(i === this.step));
    });
    const stepTools = el(main, "div", "mn-toolbar");
    button(stepTools, t("Duplicate step", "Дублировать шаг"), () =>
      this.change(() => {
        const next = clone(step);
        next.title = t("Next step", "Следующий шаг");
        m.steps.splice(this.step + 1, 0, next);
        this.step++;
      }, true),
    ).disabled = m.steps.length >= 100;
    button(stepTools, t("Move earlier", "Раньше"), () =>
      this.change(() => {
        [m.steps[this.step - 1], m.steps[this.step]] = [
          m.steps[this.step]!,
          m.steps[this.step - 1]!,
        ];
        this.step--;
      }, true),
    ).disabled = this.step === 0;
    button(stepTools, t("Move later", "Позже"), () =>
      this.change(() => {
        [m.steps[this.step + 1], m.steps[this.step]] = [
          m.steps[this.step]!,
          m.steps[this.step + 1]!,
        ];
        this.step++;
      }, true),
    ).disabled = this.step === m.steps.length - 1;
    button(stepTools, t("Delete step", "Удалить шаг"), () =>
      this.change(() => {
        m.steps.splice(this.step, 1);
        this.step = Math.max(0, this.step - 1);
      }, true),
    ).disabled = m.steps.length === 1;
    field(main, t("Step title", "Название шага"), step.title, (v) =>
      this.change(() => {
        step.title = v;
      }),
    );
    field(
      main,
      t("Explanation", "Пояснение"),
      step.description,
      (v) =>
        this.change(() => {
          step.description = v;
        }),
      true,
    );
    field(
      main,
      t("Code for this step", "Код этого шага"),
      step.code,
      (v) =>
        this.change(() => {
          step.code = v;
        }),
      true,
    );
    numberField(
      main,
      t("Time per step (ms)", "Длительность шага (мс)"),
      m.duration,
      (v) =>
        this.change(() => {
          m.duration = v;
        }),
      300,
      30000,
    );
    el(inspector, "h3", "", t("Selected block", "Выбранный блок"));
    select(
      inspector,
      t("Block", "Блок"),
      [
        { value: "", label: t("Select a block", "Выбери блок") },
        ...step.nodes.map((n) => ({ value: n.id, label: n.label || n.id })),
      ],
      this.selected,
      (v) => {
        this.selected = v;
        this.render();
      },
    );
    const node = step.nodes.find((n) => n.id === this.selected);
    if (node) {
      field(inspector, t("Label", "Подпись"), node.label, (v) => {
        this.change(() => {
          node.label = v;
        });
        draw();
      });
      field(inspector, t("Value", "Значение"), node.value, (v) => {
        this.change(() => {
          node.value = v;
        });
        draw();
      });
      select(
        inspector,
        t("Color", "Цвет"),
        this.labelColors(),
        node.color,
        (v) => {
          this.change(() => {
            node.color = v as Color;
          });
          draw();
        },
      );
      const pos = el(inspector, "div", "mn-pair");
      numberField(
        pos,
        "X",
        node.x,
        (v) => {
          this.change(() => {
            node.x = v;
          });
          if (Number.isFinite(v)) draw();
        },
        0,
        650,
      );
      numberField(
        pos,
        "Y",
        node.y,
        (v) => {
          this.change(() => {
            node.y = v;
          });
          if (Number.isFinite(v)) draw();
        },
        0,
        350,
      );
      const label = el(inspector, "label", "mn-check");
      const check = el(label, "input");
      check.type = "checkbox";
      check.checked = node.highlighted;
      el(label, "span", "", t("Highlight", "Подсветить"));
      check.addEventListener("change", () => {
        this.change(() => {
          node.highlighted = check.checked;
        });
        draw();
      });
      button(
        inspector,
        t("Delete block", "Удалить блок"),
        () =>
          this.change(() => {
            step.nodes = step.nodes.filter((n) => n.id !== node.id);
            step.edges = step.edges.filter(
              (e) => e.from !== node.id && e.to !== node.id,
            );
            this.selected = "";
          }, true),
        "mod-warning",
      );
    }
    el(inspector, "h3", "", t("Arrows", "Стрелки"));
    for (const [i, edge] of step.edges.entries()) {
      const row = el(inspector, "div", "mn-edge-row");
      el(
        row,
        "span",
        "",
        `${step.nodes.find((n) => n.id === edge.from)?.label} → ${step.nodes.find((n) => n.id === edge.to)?.label}${edge.label ? " · " + edge.label : ""}`,
      );
      button(row, t("Remove", "Убрать"), () =>
        this.change(() => {
          step.edges.splice(i, 1);
        }, true),
      );
    }
    if (step.nodes.length > 1) {
      let from = step.nodes[0]!.id,
        to = step.nodes[1]!.id,
        label = "";
      const options = step.nodes.map((n) => ({ value: n.id, label: n.label }));
      select(inspector, t("From", "Откуда"), options, from, (v) => {
        from = v;
      });
      select(inspector, t("To", "Куда"), options, to, (v) => {
        to = v;
      });
      field(inspector, t("Arrow label", "Подпись стрелки"), "", (v) => {
        label = v;
      });
      button(inspector, t("Connect", "Соединить"), () => {
        if (
          from === to ||
          step.edges.some((e) => e.from === from && e.to === to)
        ) {
          this.error!.textContent = t(
            "Choose two different blocks without an existing arrow in this direction.",
            "Выбери разные блоки, между которыми ещё нет стрелки в этом направлении.",
          );
          return;
        }
        this.change(() => {
          step.edges.push({ from, to, label });
        }, true);
      }).disabled = step.edges.length >= 128;
    }
  }
  private plot(m: Plot) {
    const t = this.t;
    const layout = el(this.root, "div", "mn-editor-grid mn-plot-editor");
    const formulas = el(layout, "div");
    const live = el(layout, "div", "mn-plot-preview");
    this.previewRoot = el(live, "div", "mn-preview");
    const settings = el(formulas, "details", "mn-axis-settings");
    el(settings, "summary", "", t("Axes and ranges", "Оси и диапазоны"));
    const help = el(formulas, "details", "mn-formula-help");
    el(help, "summary", "", t("Formula reference", "Справка по формулам"));
    el(formulas, "h3", "", t("Curves", "Кривые"));
    el(
      help,
      "p",
      "mn-hint",
      t(
        "Use x and parameter names. Operators: + - * / ^. Functions: sin, cos, tan, sqrt, abs, exp, log, log10, min, max, pow. Constants: pi, e. Trigonometry uses radians.",
        "Используй x и имена параметров. Операции: + - * / ^. Функции: sin, cos, tan, sqrt, abs, exp, log, log10, min, max, pow. Константы: pi, e. Углы в радианах.",
      ),
    );
    m.curves.forEach((c, i) => {
      const group = el(formulas, "fieldset", "mn-group");
      el(group, "legend", "", `${t("Curve", "Кривая")} ${i + 1}`);
      field(group, t("Label", "Подпись"), c.label, (v) =>
        this.change(() => {
          c.label = v;
        }),
      );
      field(group, "y =", c.formula, (v) =>
        this.change(() => {
          c.formula = v;
        }),
      );
      select(group, t("Color", "Цвет"), this.labelColors(), c.color, (v) =>
        this.change(() => {
          c.color = v as Color;
        }),
      );
      button(group, t("Remove curve", "Удалить кривую"), () =>
        this.change(() => {
          m.curves.splice(i, 1);
        }, true),
      ).disabled = m.curves.length === 1;
    });
    button(formulas, t("Add curve", "Добавить кривую"), () =>
      this.change(() => {
        m.curves.push({
          label: `y${m.curves.length + 1}`,
          formula: "x",
          color: palette[m.curves.length % palette.length]!,
        });
      }, true),
    ).disabled = m.curves.length >= 8;
    el(formulas, "h3", "", t("Sliders", "Ползунки"));
    m.parameters.forEach((p, i) => {
      const group = el(formulas, "fieldset", "mn-group");
      el(group, "legend", "", p.name);
      const names = el(group, "div", "mn-pair");
      field(names, t("Name in formula", "Имя в формуле"), p.name, (v) =>
        this.change(() => {
          p.name = v;
        }),
      );
      field(names, t("Label", "Подпись"), p.label, (v) =>
        this.change(() => {
          p.label = v;
        }),
      );
      const ranges = el(group, "div", "mn-pair");
      numberField(ranges, t("Minimum", "Минимум"), p.min, (v) =>
        this.change(() => {
          p.min = v;
        }),
      );
      numberField(ranges, t("Maximum", "Максимум"), p.max, (v) =>
        this.change(() => {
          p.max = v;
        }),
      );
      numberField(ranges, t("Increment", "Шаг"), p.step, (v) =>
        this.change(() => {
          p.step = v;
        }),
      );
      numberField(
        ranges,
        t("Initial value", "Начальное значение"),
        p.value,
        (v) =>
          this.change(() => {
            p.value = v;
          }),
      );
      button(group, t("Remove slider", "Удалить ползунок"), () =>
        this.change(() => {
          m.parameters.splice(i, 1);
        }, true),
      );
    });
    button(formulas, t("Add slider", "Добавить ползунок"), () =>
      this.change(() => {
        let n = 1;
        while (m.parameters.some((p) => p.name === `p${n}`)) n++;
        m.parameters.push({
          name: `p${n}`,
          label: `${t("Parameter", "Параметр")} ${n}`,
          min: 0,
          max: 10,
          step: 0.1,
          value: 1,
        });
      }, true),
    ).disabled = m.parameters.length >= 12;
    el(settings, "h3", "", t("Axes", "Оси"));
    field(
      settings,
      t("X axis label and units", "Подпись и единицы оси X"),
      m.xLabel,
      (v) =>
        this.change(() => {
          m.xLabel = v;
        }),
    );
    field(
      settings,
      t("Y axis label and units", "Подпись и единицы оси Y"),
      m.yLabel,
      (v) =>
        this.change(() => {
          m.yLabel = v;
        }),
    );
    const ranges = el(settings, "div", "mn-pair");
    for (const [key, label] of [
      ["xMin", "X min"],
      ["xMax", "X max"],
      ["yMin", "Y min"],
      ["yMax", "Y max"],
    ] as const)
      numberField(ranges, label, m[key], (v) =>
        this.change(() => {
          m[key] = v;
        }),
      );
    el(
      settings,
      "p",
      "mn-hint",
      t(
        "The preview sliders change the preview only. Set Initial value to change what readers see first. Use a variable in a formula before its slider can affect the curve.",
        "Ползунки предпросмотра меняют только предпросмотр. Поле «Начальное значение» задаёт старт для читателя. Параметр влияет на кривую, только если он есть в формуле.",
      ),
    );
  }
  private refreshPreview() {
    this.preview?.destroy();
    this.preview = undefined;
    if (!this.draft || !this.previewRoot) return;
    try {
      const validated = validateMotion(this.draft);
      this.preview = new Player(this.previewRoot, validated, this.t);
      if (this.error) this.error.textContent = "";
      if (this.saveButton) this.saveButton.disabled = this.saving;
    } catch (error) {
      if (this.error)
        this.error.textContent =
          this.t("Check the document: ", "Проверь документ: ") +
          errorMessage(error);
      if (this.saveButton) this.saveButton.disabled = true;
    }
    const buttons = this.root.querySelectorAll<HTMLButtonElement>(
      ".mn-editor-heading .mn-toolbar button",
    );
    if (buttons[0]) buttons[0].disabled = !this.undoStack.length;
    if (buttons[1]) buttons[1].disabled = !this.redoStack.length;
  }
  private async submit() {
    if (!this.draft || this.saving) return;
    this.saving = true;
    this.saveButton!.disabled = true;
    try {
      const validated = validateMotion(this.draft);
      await this.save(validated);
      this.initial = JSON.stringify(this.draft);
    } catch (error) {
      this.error!.textContent =
        this.t("Could not save: ", "Не удалось сохранить: ") +
        errorMessage(error);
    } finally {
      this.saving = false;
      if (this.saveButton) this.saveButton.disabled = false;
    }
  }
  destroy() {
    this.preview?.destroy();
    this.root.replaceChildren();
  }
}
