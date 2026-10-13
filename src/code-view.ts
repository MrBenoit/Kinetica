import type { Step } from "./model";
import type { Translate } from "./i18n";
import { el } from "./ui";
export function renderCode(
  root: HTMLElement,
  step: Step,
  previous: Step | undefined,
  t: Translate,
) {
  root.replaceChildren();
  if (step.code) {
    const code = el(root, "pre", "mn-code mn-code-lines");
    step.code.split("\n").forEach((text, index) => {
      const line = el(code, "span", "mn-code-line");
      line.classList.toggle(
        "is-active",
        step.activeLines?.includes(index + 1) ?? false,
      );
      const number = el(line, "span", "mn-line-number", String(index + 1));
      number.setAttribute("aria-hidden", "true");
      el(line, "span", "", text || " ");
      if (step.activeLines?.includes(index + 1))
        line.setAttribute("aria-current", "step");
    });
  }
  if (step.variables?.length) {
    const table = el(root, "table", "mn-variables");
    el(table, "caption", "", t("Variables", "Переменные"));
    const header = el(table, "tr");
    el(header, "th", "", t("Name", "Имя"));
    el(header, "th", "", t("Value", "Значение"));
    for (const value of step.variables) {
      const row = el(table, "tr");
      el(row, "th", "", value.name);
      const old = previous?.variables?.find((v) => v.name === value.name);
      row.classList.toggle(
        "is-changed",
        !!previous && old?.value !== value.value,
      );
      el(row, "td", "", value.value);
    }
  }
}
