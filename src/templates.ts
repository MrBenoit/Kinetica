import type { Motion, SceneNode } from "./model";
import { uid, clone } from "./model";
import type { Translate } from "./i18n";
export type Template =
  | "flow"
  | "array"
  | "wave"
  | "growth"
  | "blank-scene"
  | "blank-plot"
  | "code-trace"
  | "prediction"
  | "queue"
  | "queue-compare"
  | "comparison";
export function template(kind: Template, t: Translate): Motion {
  const base = { version: 1 as const, id: uid(), title: "", description: "" };
  if (kind === "queue" || kind === "queue-compare")
    return {
      ...base,
      version: 2,
      type: "lab",
      title: t("Queue laboratory", "Лаборатория очереди"),
      description: t(
        "Explore backpressure, buffers and worker pools.",
        "Исследуй блокировку отправителей, буферы и пул работников.",
      ),
      config: { jobs: 24, arrival: 2, workers: 3, capacity: 4, service: 3 },
      compare: kind === "queue-compare",
    };
  if (kind === "comparison") {
    const left = template("array", t),
      right = template("array", t);
    if (left.type !== "scene" || right.type !== "scene")
      throw new Error("Expected scenes");
    right.title = t("Append within capacity", "Append в пределах ёмкости");
    right.description = t(
      "Spare capacity keeps the same backing array.",
      "При достаточной ёмкости базовый массив остаётся прежним.",
    );
    right.steps[0]!.nodes[0]!.value = "len=2, cap=4";
    right.steps[0]!.nodes[1]!.value = "[10, 20, 0, 0]";
    right.steps[0]!.code = "s := make([]int, 2, 4)\ns[0], s[1] = 10, 20";
    right.steps[0]!.description = t(
      "Two free slots remain in the backing array.",
      "В базовом массиве остаются два свободных места.",
    );
    right.steps[1] = clone(right.steps[0]!);
    right.steps[1]!.title = t("Reuse the array", "Используем прежний массив");
    right.steps[1]!.description = t(
      "Write 30 into the next slot. No new array is needed.",
      "Записываем 30 в следующую ячейку. Новый массив не нужен.",
    );
    right.steps[1]!.code = "s = append(s, 30)";
    right.steps[1]!.nodes[0]!.value = "len=3, cap=4";
    right.steps[1]!.nodes[1]!.value = "[10, 20, 30, 0]";
    return {
      ...base,
      version: 2,
      type: "comparison",
      title: t("Compare append", "Сравнение append"),
      scenes: [left, right],
    };
  }
  if (kind === "code-trace" || kind === "prediction") {
    const scene = template("array", t);
    if (scene.type !== "scene") throw new Error("Expected scene");
    scene.version = 2;
    const code = "s := []int{10, 20}\ns = append(s, 30)";
    scene.steps.forEach((step, i) => {
      step.code = code;
      step.activeLines = [i + 1];
      step.variables = [
        { name: "len(s)", value: String(i + 2) },
        { name: "cap(s)", value: i ? ">=3" : "2" },
      ];
    });
    if (kind === "prediction")
      scene.steps[0]!.question = {
        prompt: t(
          "Will append reuse the array?",
          "Использует ли append прежний массив?",
        ),
        options: [
          {
            text: t("Yes", "Да"),
            explanation: t(
              "The current array is full. There is no spare capacity.",
              "Массив заполнен. Свободной ёмкости нет.",
            ),
          },
          {
            text: t("No", "Нет"),
            explanation: t(
              "Append needs more capacity, so it allocates a new array.",
              "Для append нужна дополнительная ёмкость, поэтому создаётся новый массив.",
            ),
          },
        ],
        correct: 1,
      };
    return scene;
  }
  if (kind === "wave" || kind === "growth" || kind === "blank-plot") {
    const growth = kind === "growth";
    return {
      ...base,
      type: "plot",
      title: growth
        ? t("Exponential growth", "Экспоненциальный рост")
        : kind === "wave"
          ? t("Explore a wave", "Исследуй волну")
          : t("My graph", "Мой график"),
      description: t(
        "Move the sliders to see how each parameter changes the curve.",
        "Двигай ползунки и наблюдай, как параметры меняют кривую.",
      ),
      xLabel: "x",
      yLabel: "y",
      xMin: growth ? 0 : -6.3,
      xMax: growth ? 10 : 6.3,
      yMin: growth ? 0 : -5,
      yMax: growth ? 30 : 5,
      parameters: growth
        ? [
            {
              name: "rate",
              label: t("Growth rate", "Скорость роста"),
              min: 0,
              max: 0.5,
              step: 0.01,
              value: 0.2,
            },
          ]
        : [
            {
              name: "a",
              label: t("Amplitude", "Амплитуда"),
              min: 0,
              max: 4,
              step: 0.1,
              value: 2,
            },
            {
              name: "b",
              label: t("Frequency", "Частота"),
              min: 0.2,
              max: 4,
              step: 0.1,
              value: 1,
            },
          ],
      curves: [
        {
          label: growth ? "exp(rate * x)" : "a * sin(b * x)",
          formula: growth ? "exp(rate * x)" : "a * sin(b * x)",
          color: "blue",
        },
      ],
    };
  }
  if (kind === "blank-scene")
    return {
      ...base,
      type: "scene",
      title: t("My scene", "Моя сцена"),
      duration: 2200,
      steps: [
        {
          title: t("Start", "Начало"),
          description: "",
          code: "",
          nodes: [],
          edges: [],
        },
      ],
    };
  if (kind === "array") {
    const nodes: SceneNode[] = [
      {
        id: "slice",
        label: "slice",
        value: "len=2, cap=2",
        x: 55,
        y: 70,
        color: "purple",
        highlighted: false,
      },
      {
        id: "array",
        label: t("Old array", "Старый массив"),
        value: "[10, 20]",
        x: 350,
        y: 70,
        color: "blue",
        highlighted: false,
      },
    ];
    const next = clone(nodes);
    next[0]!.value = "len=3, cap>=3";
    next[0]!.highlighted = true;
    next.push({
      id: "new",
      label: t("New array", "Новый массив"),
      value: "[10, 20, 30]",
      x: 350,
      y: 260,
      color: "green",
      highlighted: true,
    });
    return {
      ...base,
      type: "scene",
      title: t("Append beyond capacity", "Append за пределами ёмкости"),
      description: t(
        "A slice moves to a larger backing array when its capacity is exhausted.",
        "Когда ёмкость исчерпана, append создаёт новый базовый массив.",
      ),
      duration: 2600,
      steps: [
        {
          title: t("Before append", "До append"),
          description: t(
            "The slice points to a full array.",
            "Слайс ссылается на заполненный массив.",
          ),
          code: "s := []int{10, 20}",
          nodes,
          edges: [{ from: "slice", to: "array", label: "data" }],
        },
        {
          title: t("Allocate and copy", "Выделить и скопировать"),
          description: t(
            "Copy the old elements into a larger array and append 30. The exact new capacity is implementation-dependent.",
            "Копируем элементы в больший массив и добавляем 30. Точная новая ёмкость зависит от реализации.",
          ),
          code: "s = append(s, 30)",
          nodes: next,
          edges: [
            { from: "slice", to: "new", label: "data" },
            { from: "array", to: "new", label: t("copy", "копия") },
          ],
        },
      ],
    };
  }
  const nodes: SceneNode[] = [
    {
      id: "sender",
      label: t("Sender", "Отправитель"),
      value: t("Ready", "Готов"),
      x: 60,
      y: 155,
      color: "blue",
      highlighted: true,
    },
    {
      id: "message",
      label: t("Message", "Сообщение"),
      value: "42",
      x: 275,
      y: 155,
      color: "orange",
      highlighted: false,
    },
    {
      id: "receiver",
      label: t("Receiver", "Получатель"),
      value: t("Waiting", "Ожидает"),
      x: 570,
      y: 155,
      color: "green",
      highlighted: false,
    },
  ];
  const moving = clone(nodes);
  moving[1]!.x = 385;
  moving[1]!.y = 260;
  moving[1]!.highlighted = true;
  moving[0]!.highlighted = false;
  const received = clone(nodes);
  received[1]!.x = 570;
  received[1]!.y = 275;
  received[2]!.value = "42";
  received[2]!.highlighted = true;
  received[0]!.highlighted = false;
  return {
    ...base,
    type: "scene",
    title: t("Message delivery", "Передача сообщения"),
    description: t(
      "Step through the delivery, then edit the scene to tell your own story.",
      "Пройди шаги передачи, затем отредактируй сцену для своего объяснения.",
    ),
    duration: 2200,
    steps: [
      {
        title: t("Prepare", "Подготовка"),
        description: t(
          "The sender prepares a value.",
          "Отправитель готовит значение.",
        ),
        code: "value := 42",
        nodes,
        edges: [],
      },
      {
        title: t("Send", "Передача"),
        description: t(
          "The value travels to the receiver.",
          "Значение передаётся получателю.",
        ),
        code: "ch <- value",
        nodes: moving,
        edges: [{ from: "sender", to: "receiver", label: "channel" }],
      },
      {
        title: t("Receive", "Получение"),
        description: t(
          "The receiver reads the value.",
          "Получатель читает значение.",
        ),
        code: "value := <-ch",
        nodes: received,
        edges: [
          {
            from: "sender",
            to: "receiver",
            label: t("delivered", "доставлено"),
          },
        ],
      },
    ],
  };
}
