import { clone, uid, type Scene, type SceneNode, type Step } from "./model";
import type { Translate } from "./i18n";
export type GalleryExample = "stack" | "bubble-sort" | "motion";
export function galleryExample(kind: GalleryExample, t: Translate): Scene {
  const base: Scene = {
    version: 3,
    type: "scene",
    id: uid(),
    title: "",
    description: "",
    duration: 1800,
    steps: [],
  };
  const node = (
    id: string,
    label: string,
    value: string,
    x: number,
    y: number,
  ): SceneNode => ({
    id,
    label,
    value,
    x,
    y,
    color: "blue",
    highlighted: false,
  });
  const step = (
    title: string,
    description: string,
    nodes: SceneNode[],
    code = "",
  ): Step => ({
    title,
    description,
    nodes,
    code,
    edges: [],
    timing: { transition: 600, hold: 1200, easing: "ease-in-out" },
  });
  if (kind === "motion") {
    base.title = t("Motion and distance", "Движение и расстояние");
    base.description = t(
      "Change speed to update the body, distance label and graph together.",
      "Меняй скорость: тело, подпись расстояния и график обновятся вместе.",
    );
    base.parameters = [
      {
        name: "speed",
        label: t("Speed (m/s)", "Скорость (м/с)"),
        min: 0,
        max: 5,
        step: 0.1,
        value: 2,
      },
      {
        name: "time",
        label: t("Time (s)", "Время (с)"),
        min: 0,
        max: 10,
        step: 0.1,
        value: 2,
      },
    ];
    const body = node(
      "body",
      t("Moving body", "Тело"),
      "s = {{speed * time}} m",
      50,
      180,
    );
    body.bindings = { x: "50 + speed * time * 12" };
    base.steps = [
      step(
        t("Uniform motion", "Равномерное движение"),
        t(
          "After {{time}} s, distance is {{speed * time}} m.",
          "За {{time}} с пройдено {{speed * time}} м.",
        ),
        [body],
      ),
    ];
    base.plot = {
      xMin: 0,
      xMax: 10,
      yMin: 0,
      yMax: 50,
      xLabel: t("Time (s)", "Время (с)"),
      yLabel: t("Distance (m)", "Расстояние (м)"),
      curves: [{ label: "s = v * t", formula: "speed * x", color: "blue" }],
    };
    return base;
  }
  if (kind === "stack") {
    base.title = t("Stack: push and pop", "Стек: push и pop");
    base.description = t(
      "The last value pushed is the first one popped.",
      "Последнее добавленное значение извлекается первым.",
    );
    const first = node("ten", t("Top", "Вершина"), "10", 330, 280);
    const second = node("twenty", t("Top", "Вершина"), "20", 330, 180);
    const lower = { ...first, label: t("Bottom", "Основание") };
    base.steps = [
      step(
        t("Push 10", "Добавляем 10"),
        t(
          "The first value becomes the top.",
          "Первое значение становится вершиной.",
        ),
        [first],
        "stack = append(stack, 10)",
      ),
      step(
        t("Push 20", "Добавляем 20"),
        t("20 is now on top of 10.", "Теперь 20 находится над 10."),
        [lower, second],
        "stack = append(stack, 20)",
      ),
      step(
        t("Pop 20", "Извлекаем 20"),
        t(
          "Pop removes the last inserted value.",
          "Pop извлекает последнее добавленное значение.",
        ),
        [
          first,
          {
            ...second,
            x: 570,
            y: 180,
            label: t("Returned", "Извлечено"),
            color: "green",
          },
        ],
        "value := stack[len(stack)-1]\nstack = stack[:len(stack)-1]",
      ),
      step(
        t("Pop 10", "Извлекаем 10"),
        t(
          "The stack is empty after the second pop.",
          "После второго pop стек пуст.",
        ),
        [
          {
            ...first,
            x: 570,
            label: t("Returned", "Извлечено"),
            color: "green",
          },
        ],
        "value = stack[len(stack)-1]\nstack = stack[:len(stack)-1]",
      ),
    ];
    base.steps[1]!.question = {
      prompt: t("Which value will pop return?", "Какое значение вернёт pop?"),
      correct: 1,
      options: [
        {
          text: "10",
          explanation: t(
            "10 was inserted first and is below 20.",
            "10 добавили первым, оно находится под 20.",
          ),
        },
        {
          text: "20",
          explanation: t(
            "A stack returns the last inserted value first.",
            "Стек первым возвращает последнее добавленное значение.",
          ),
        },
      ],
    };
    return base;
  }
  base.title = t("Bubble sort", "Пузырьковая сортировка");
  base.description = t(
    "Follow adjacent swaps. Blocks keep their identity while changing places.",
    "Следи за обменом соседних элементов. Блоки сохраняют свои значения при перемещении.",
  );
  const initial = [3, 1, 2].map((v, i) =>
    node(`n${v}`, `a[${i}]`, String(v), 100 + i * 220, 180),
  );
  const swap = (order: number[]) =>
    order.map((v, i) => ({
      ...clone(initial.find((n) => n.id === `n${v}`)!),
      x: 100 + i * 220,
      label: `a[${i}]`,
      highlighted: v === 3,
    }));
  base.steps = [
    step(
      t("Compare 3 and 1", "Сравниваем 3 и 1"),
      "3 > 1",
      initial,
      "if a[0] > a[1] {\n  a[0], a[1] = a[1], a[0]\n}",
    ),
    step(
      t("Swap, then compare 3 and 2", "Меняем местами, сравниваем 3 и 2"),
      "3 > 2",
      swap([1, 3, 2]),
      "if a[1] > a[2] {\n  a[1], a[2] = a[2], a[1]\n}",
    ),
    step(
      t("Largest value reaches the end", "Наибольшее значение в конце"),
      t(
        "The next pass checks 1 and 2. No swap is needed.",
        "Следующий проход сравнивает 1 и 2. Обмен не нужен.",
      ),
      swap([1, 2, 3]),
      "// Next pass: 1 <= 2",
    ),
  ];
  return base;
}
