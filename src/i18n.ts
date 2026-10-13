export type Language = "en" | "ru";
export type Translate = (english: string, russian: string) => string;
export function translator(language: Language): Translate {
  return (english, russian) => (language === "ru" ? russian : english);
}

// Keep parser diagnostics independent of the selected UI language
export function localizeError(error: unknown, t: Translate): string {
  if (error instanceof SyntaxError)
    return t(
      "Invalid JSON. Check quotes, commas and brackets.",
      "Некорректный JSON. Проверь кавычки, запятые и скобки.",
    );
  const message = error instanceof Error ? error.message : String(error);
  const exact: Record<string, string> = {
    "Unknown color": "Неизвестный цвет",
    "Unsupported document version": "Эта версия документа не поддерживается",
    "Title is required": "Укажи название",
    "highlighted must be a boolean":
      "Поле highlighted должно быть true или false",
    "Arrow must connect two different blocks in this step":
      "Стрелка должна соединять два разных блока этого шага",
    "Unknown document type": "Неизвестный тип документа",
    "Parameter maximum must exceed minimum":
      "Максимум параметра должен быть больше минимума",
    "Axis maximum must exceed minimum by at least 0.000001":
      "Максимум оси должен превышать минимум хотя бы на 0.000001",
    "Document exceeds 500,000 characters":
      "Документ содержит больше 500 000 символов",
    "Formula must contain 1-256 characters":
      "Формула должна содержать от 1 до 256 символов",
    "Formula is too complex": "Формула слишком сложная",
    "Formula nesting is too deep":
      "В формуле слишком много вложенных выражений",
    "Expected a number, variable or function":
      "Ожидается число, переменная или функция",
    "Missing closing parenthesis": "Не хватает закрывающей скобки",
    "Number must be finite": "Число должно быть конечным",
    "This visualization moved, was deleted, or has a duplicate ID. Reopen it before saving.":
      "Визуализация перемещена, удалена или её ID повторяется. Открой её заново перед сохранением.",
    "This visualization changed while the editor was open. Close and reopen it before saving.":
      "Визуализация изменилась, пока редактор был открыт. Закрой и открой её заново перед сохранением.",
  };
  if (Object.hasOwn(exact, message)) return t(message, exact[message]!);
  const patterns: [RegExp, string][] = [
    [/^(.+): expected an object$/, "$1: ожидается объект"],
    [
      /^(.+): expected text up to (.+) characters$/,
      "$1: ожидается текст не длиннее $2 символов",
    ],
    [
      /^(.+): expected a number between (.+) and (.+)$/,
      "$1: ожидается число от $2 до $3",
    ],
    [/^(.+): expected (.+)-(.+) items$/, "$1: ожидается от $2 до $3 элементов"],
    [
      /^(.+): use letters, digits, hyphens or underscores$/,
      "$1: используй латинские буквы, цифры, дефис или подчёркивание",
    ],
    [/^(.+): duplicate identifiers$/, "$1: повторяющиеся идентификаторы"],
    [/^Invalid parameter name: (.+)$/, "Недопустимое имя параметра: $1"],
    [/^Unexpected character at (.+)$/, "Недопустимый символ в позиции $1"],
    [/^Unknown function: (.+)$/, "Неизвестная функция: $1"],
    [/^Unknown variable: (.+)$/, "Неизвестная переменная: $1"],
    [
      /^(.+) expects (.+) argument\(s\)$/,
      "$1: ожидаемое число аргументов - $2",
    ],
    [/^Unexpected token: (.+)$/, "Неожиданный элемент формулы: $1"],
  ];
  for (const [pattern, replacement] of patterns)
    if (pattern.test(message))
      return t(message, message.replace(pattern, replacement));
  return message;
}
