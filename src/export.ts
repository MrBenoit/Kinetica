import { validateMotion, type Motion } from "./model";
import { scriptJSON } from "./plotly-view";
import type { Language } from "./i18n";

export function standaloneHTML(
  motion: Motion,
  runtime: string,
  language: Language,
  dark: boolean,
): string {
  const document = validateMotion(motion);
  if (JSON.stringify(document).length > 500_000)
    throw new Error("Document exceeds 500,000 characters");
  const title = document.title.replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ]!,
  );
  return `<!doctype html><html lang="${language}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><style>body{margin:0;padding:clamp(12px,4vw,48px);font:16px system-ui;background:${dark ? "#171720" : "#f4f4f7"}}main{max-width:1200px;margin:auto}</style></head><body><main><kinetica-player theme="${dark ? "dark" : "light"}" lang="${language}"><script type="application/json">${scriptJSON(document)}</script></kinetica-player></main><script>${runtime.replace(/<\/script/gi, "<\\/script")}</script></body></html>`;
}
