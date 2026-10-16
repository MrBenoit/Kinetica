// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { template } from "../src/templates";
import { translator } from "../src/i18n";
import "../src/embed";
const t = translator("en");
beforeEach(() => {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      disconnect() {}
    },
  );
  window.matchMedia = vi.fn().mockReturnValue({ matches: true });
});
afterEach(() => {
  document.body.replaceChildren();
  document.documentElement.lang = "";
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
function mount(kind: "wave" | "flow" | "motion" = "wave") {
  const host = document.createElement("kinetica-player");
  host.setAttribute("lang", "en");
  const data = document.createElement("script");
  data.type = "application/json";
  data.textContent = JSON.stringify(template(kind, t));
  host.append(data);
  document.body.append(host);
  return { host, root: host.shadowRoot!, data };
}
describe("HTML player", () => {
  it("renders a graph and changes its curve through a slider", () => {
    const { root } = mount();
    const before = root.querySelector(".mn-curve")!.getAttribute("d");
    const slider = root.querySelector<HTMLInputElement>('input[type="range"]')!;
    slider.value = "3";
    slider.dispatchEvent(new Event("input", { bubbles: true }));
    expect(root.querySelector(".mn-curve")!.getAttribute("d")).not.toBe(before);
    expect(document.querySelector(".mn-player")).toBeNull();
  });
  it("supports multiple isolated players and language changes", () => {
    const first = mount("flow");
    const second = mount("flow");
    first.root.querySelectorAll("button")[2]!.click();
    expect(first.root.querySelector(".mn-caption strong")!.textContent).toMatch(
      /^2/,
    );
    expect(
      second.root.querySelector(".mn-caption strong")!.textContent,
    ).toMatch(/^1/);
    first.host.setAttribute("lang", "ru");
    expect(first.root.textContent).toContain("Запуск");
  });
  it("inherits Russian from the page and respects an explicit English override", () => {
    document.documentElement.lang = "ru-RU";
    const { host, root, data } = mount();
    host.removeAttribute("lang");
    expect(root.textContent).toContain("Анимировать первый параметр");
    expect(root.textContent).toContain("Сбросить");
    expect(root.querySelector("h3")!.textContent).toBe("Explore a wave");
    host.setAttribute("lang", "en");
    expect(root.textContent).toContain("Animate first parameter");
    host.setAttribute("lang", "ru");
    data.textContent = "not json";
    host.refresh();
    expect(root.querySelector('[role="alert"]')!.textContent).toContain(
      "Некорректный JSON",
    );
    const invalid = template("wave", t);
    if (invalid.type !== "plot") throw new Error("Expected a plot");
    invalid.curves[0]!.formula = "fetch(x)";
    data.textContent = JSON.stringify(invalid);
    host.refresh();
    expect(root.querySelector('[role="alert"]')!.textContent).toContain(
      "Неизвестная функция: fetch",
    );
  });
  it("stops playback when removed and can be attached again", () => {
    vi.useFakeTimers();
    const { host, root } = mount("flow");
    root.querySelector<HTMLButtonElement>("button")!.click();
    expect(vi.getTimerCount()).toBeGreaterThan(0);
    host.remove();
    expect(vi.getTimerCount()).toBe(0);
    document.body.append(host);
    expect(root.querySelector(".mn-caption strong")!.textContent).toMatch(/^1/);
  });
  it("shows a readable error instead of interpreting invalid input", () => {
    const host = document.createElement("kinetica-player");
    document.body.append(host);
    expect(
      host.shadowRoot!.querySelector('[role="alert"]')!.textContent,
    ).toContain("application/json");
  });
  it("refreshes corrected JSON and renders markup as text", () => {
    const { host, root, data } = mount();
    data.textContent = "not json";
    host.refresh();
    expect(root.querySelector('[role="alert"]')).not.toBeNull();
    const m = template("wave", t);
    m.title = '<img src=x onerror="alert(1)">';
    data.textContent = JSON.stringify(m);
    host.refresh();
    expect(root.querySelector("h3")!.textContent).toBe(m.title);
    expect(root.querySelector("img")).toBeNull();
  });
});

it("plays version 3 shared controls after JSON export into HTML", () => {
  const { root, host } = mount("motion");
  const before = root.querySelector(".mn-curve")!.getAttribute("d");
  const slider = root.querySelector<HTMLInputElement>("input[type=range]")!;
  slider.value = "4";
  slider.dispatchEvent(new Event("input"));
  expect(
    root.querySelector("[data-node=body]")!.getAttribute("transform"),
  ).toBe("translate(146 180)");
  expect(root.querySelector(".mn-node-value")!.textContent).toBe("s = 8 m");
  expect(root.querySelector(".mn-curve")!.getAttribute("d")).not.toBe(before);
  host.remove();
});
