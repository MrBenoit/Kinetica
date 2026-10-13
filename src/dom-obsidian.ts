export function createHTML<K extends keyof HTMLElementTagNameMap>(
  parent: HTMLElement | ShadowRoot,
  tag: K,
): HTMLElementTagNameMap[K] {
  return parent.createEl(tag);
}

export function createSVG<K extends keyof SVGElementTagNameMap>(
  parent: Element,
  tag: K,
): SVGElementTagNameMap[K] {
  return parent.createSvg(tag);
}
