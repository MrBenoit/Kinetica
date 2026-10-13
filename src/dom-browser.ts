/* eslint-disable obsidianmd/prefer-create-el -- Standalone HTML runs without Obsidian DOM extensions */
export function createHTML<K extends keyof HTMLElementTagNameMap>(
  parent: HTMLElement | ShadowRoot,
  tag: K,
): HTMLElementTagNameMap[K] {
  const child = parent.ownerDocument.createElement(tag);
  parent.append(child);
  return child;
}

export function createSVG<K extends keyof SVGElementTagNameMap>(
  parent: Element,
  tag: K,
): SVGElementTagNameMap[K] {
  const child = parent.ownerDocument.createElementNS(
    "http://www.w3.org/2000/svg",
    tag,
  );
  parent.append(child);
  return child;
}
