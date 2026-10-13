import { localizeError, translator, type Translate } from "./i18n";
export function el<K extends keyof HTMLElementTagNameMap>(
  parent: HTMLElement,
  tag: K,
  className = "",
  text = "",
): HTMLElementTagNameMap[K] {
  const child = parent.ownerDocument.createElement(tag);
  if (className) child.className = className;
  if (text) child.textContent = text;
  parent.append(child);
  return child;
}
export function button(
  parent: HTMLElement,
  text: string,
  action: () => void,
  className = "",
): HTMLButtonElement {
  const b = el(parent, "button", className, text);
  b.type = "button";
  b.addEventListener("click", action);
  return b;
}
export function field(
  parent: HTMLElement,
  label: string,
  value: string,
  change: (v: string) => void,
  multiline = false,
): HTMLInputElement | HTMLTextAreaElement {
  const wrapper = el(parent, "label", "mn-field");
  el(wrapper, "span", "", label);
  const input = multiline ? el(wrapper, "textarea") : el(wrapper, "input");
  if (input instanceof parent.ownerDocument.defaultView!.HTMLInputElement)
    input.type = "text";
  input.value = value;
  input.addEventListener("change", () => change(input.value));
  return input;
}
export function numberField(
  parent: HTMLElement,
  label: string,
  value: number,
  change: (v: number) => void,
  min?: number,
  max?: number,
): HTMLInputElement {
  const input = field(parent, label, String(value), (v) =>
    change(v.trim() === "" ? NaN : Number(v)),
  ) as HTMLInputElement;
  input.type = "number";
  input.step = "any";
  if (min !== undefined) input.min = String(min);
  if (max !== undefined) input.max = String(max);
  return input;
}
export function select(
  parent: HTMLElement,
  label: string,
  items: { value: string; label: string }[],
  value: string,
  change: (v: string) => void,
): HTMLSelectElement {
  const wrapper = el(parent, "label", "mn-field");
  el(wrapper, "span", "", label);
  const input = el(wrapper, "select");
  for (const item of items) {
    const opt = el(input, "option", "", item.label);
    opt.value = item.value;
  }
  input.value = value;
  input.addEventListener("change", () => change(input.value));
  return input;
}
export function svg<K extends keyof SVGElementTagNameMap>(
  parent: Element,
  tag: K,
  attrs: Record<string, string | number> = {},
  text = "",
): SVGElementTagNameMap[K] {
  const child = parent.ownerDocument.createElementNS(
    "http://www.w3.org/2000/svg",
    tag,
  );
  for (const [key, value] of Object.entries(attrs))
    child.setAttribute(key, String(value));
  if (text) child.textContent = text;
  parent.append(child);
  return child;
}
export const formatNumber = (n: number): string =>
  Math.abs(n) < 1e-10 ? "0" : Number(n.toPrecision(5)).toString();
export const errorMessage = (
  error: unknown,
  t: Translate = translator("en"),
): string => localizeError(error, t);
