import { plotlySource } from "./plotly-source";
import type { PlotlyDocument } from "./model";
import type { Translate } from "./i18n";
import { el } from "./ui";

export function scriptJSON(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

export function plotlyHTML(
  motion: PlotlyDocument,
  dark: boolean,
  language: string,
  token: string,
): string {
  const payload = scriptJSON({ figure: motion.figure, dark, language, token });
  const source = plotlySource.replace(/<\/script/gi, "<\\/script");
  return `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline' 'unsafe-eval'; style-src 'unsafe-inline'; img-src data: blob:; font-src data:; connect-src 'none'; worker-src blob:;"><style>html,body{margin:0;width:100%;height:100%;background:${dark ? "#20202c" : "#ffffff"}}#plot{width:100%;height:100%}p{font:16px sans-serif;color:${dark ? "white" : "black"};padding:20px}</style></head><body><div id="plot"></div><script>${source}</script><script>
const input=${payload};
const figure=input.figure;
const plot=document.getElementById('plot');
const layout={...figure.layout,autosize:true};
delete layout.width; delete layout.height;
if(!layout.paper_bgcolor) layout.paper_bgcolor=input.dark?'#20202c':'#ffffff';
if(!layout.plot_bgcolor) layout.plot_bgcolor=input.dark?'#20202c':'#ffffff';
layout.font={color:input.dark?'#dedeee':'#20202c',...layout.font};
const report=(ok)=>parent.postMessage({kinetica:input.token,ok},'*');
Promise.resolve().then(()=>Plotly.newPlot(plot,figure.data,layout,{responsive:true,displaylogo:false,showLink:false,modeBarButtonsToRemove:['sendDataToCloud','sendChartToCloud','toImage','downloadJson','downloadHtml'],locale:input.language})).then(()=>figure.frames.length?Plotly.addFrames(plot,figure.frames):undefined).then(()=>report(true)).catch(()=>{plot.replaceChildren();const p=document.createElement('p');p.textContent=input.language==='ru'?'Не удалось построить график. Проверь данные Plotly.':'Could not render this figure. Check the Plotly data.';plot.append(p);report(false);});
</script></body></html>`;
}

export class PlotlyView {
  private frame: HTMLIFrameElement;
  private timer: number;
  private listener: (event: MessageEvent) => void;
  private win: Window;
  constructor(
    private root: HTMLElement,
    motion: PlotlyDocument,
    t: Translate,
  ) {
    this.win = root.ownerDocument.defaultView!;
    const status = el(
      root,
      "p",
      "mn-hint",
      t("Loading chart...", "Загрузка графика..."),
    );
    status.setAttribute("role", "status");
    this.frame = el(root, "iframe", "mn-plotly-frame");
    this.frame.title = motion.title;
    this.frame.setAttribute("sandbox", "allow-scripts");
    this.frame.setAttribute("referrerpolicy", "no-referrer");
    const token = this.win.crypto.randomUUID();
    const background = this.win
      .getComputedStyle(root)
      .getPropertyValue("--background-primary")
      .trim();
    const dark =
      root.closest(".theme-dark") !== null ||
      /(?:#(?:1|2)|rgb\(\s*(?:[0-4]?\d)[, ])/i.test(background);
    this.listener = (event) => {
      if (
        event.source !== this.frame.contentWindow ||
        !event.data ||
        typeof event.data !== "object"
      )
        return;
      const data = event.data as Record<string, unknown>;
      if (data.kinetica !== token || typeof data.ok !== "boolean") return;
      this.win.clearTimeout(this.timer);
      status.textContent = data.ok
        ? ""
        : t(
            "Could not render this figure. Check the Plotly data.",
            "Не удалось построить график. Проверь данные Plotly.",
          );
    };
    this.win.addEventListener("message", this.listener);
    this.timer = this.win.setTimeout(() => {
      status.textContent = t(
        "The chart took too long to load. Reopen it to try again.",
        "График загружается слишком долго. Открой его заново.",
      );
      this.frame.remove();
    }, 20000);
    this.frame.srcdoc = plotlyHTML(motion, dark, t("en", "ru"), token);
  }
  destroy() {
    this.win.clearTimeout(this.timer);
    this.win.removeEventListener("message", this.listener);
    this.root.replaceChildren();
  }
}
