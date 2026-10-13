import { Player } from "./player";
import { parseMotion } from "./model";
import { translator } from "./i18n";
import { errorMessage } from "./ui";
import playerStyles from "../styles.css?raw";
import embedStyles from "./embed.css?raw";
export class KineticaPlayer extends HTMLElement {
  static observedAttributes = ["lang"];
  private player?: Player;
  private content: HTMLDivElement;
  private readonly ready = () => this.refresh();
  constructor() {
    super();
    const root = this.attachShadow({ mode: "open" });
    const style = this.ownerDocument.createElement("style");
    style.textContent = playerStyles + embedStyles;
    this.content = this.ownerDocument.createElement("div");
    root.append(style, this.content);
  }
  connectedCallback() {
    if (this.ownerDocument.readyState === "loading")
      this.ownerDocument.addEventListener("DOMContentLoaded", this.ready, {
        once: true,
      });
    else this.refresh();
  }
  disconnectedCallback() {
    this.ownerDocument.removeEventListener("DOMContentLoaded", this.ready);
    this.player?.destroy();
    this.player = undefined;
  }
  attributeChangedCallback() {
    if (this.isConnected) this.refresh();
  }
  refresh() {
    if (!this.isConnected) return;
    this.player?.destroy();
    this.player = undefined;
    this.content.replaceChildren();
    const language =
      (this.getAttribute("lang") ?? this.ownerDocument.documentElement.lang)
        .toLowerCase()
        .split("-")[0] === "ru"
        ? "ru"
        : "en";
    const t = translator(language);
    try {
      const scripts = [...this.children].filter(
        (child) =>
          child.tagName === "SCRIPT" &&
          child.getAttribute("type") === "application/json",
      );
      if (scripts.length !== 1)
        throw new Error(
          t(
            'Expected one <script type="application/json"> inside <kinetica-player>',
            'Внутри <kinetica-player> нужен один <script type="application/json">',
          ),
        );
      const motion = parseMotion(scripts[0]!.textContent ?? "");
      this.player = new Player(this.content, motion, t);
    } catch (error) {
      const message = errorMessage(error, t);
      const alert = this.ownerDocument.createElement("p");
      alert.setAttribute("role", "alert");
      alert.textContent =
        t(
          "Cannot display visualization: ",
          "Не удалось показать визуализацию: ",
        ) + message;
      this.content.append(alert);
      this.dispatchEvent(
        new CustomEvent("kinetica-error", {
          detail: { message },
          bubbles: true,
          composed: true,
        }),
      );
    }
  }
}
if (!customElements.get("kinetica-player"))
  customElements.define("kinetica-player", KineticaPlayer);
declare global {
  interface HTMLElementTagNameMap {
    "kinetica-player": KineticaPlayer;
  }
}
