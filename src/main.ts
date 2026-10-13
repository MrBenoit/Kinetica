import {
  App,
  getLanguage,
  MarkdownRenderChild,
  MarkdownView,
  Modal,
  Notice,
  Plugin,
  SuggestModal,
  TFile,
  normalizePath,
} from "obsidian";
import { MotionSettings, type Settings } from "./settings";
import { Editor } from "./editor";
import { Player } from "./player";
import { parseMotion, replaceBlock, toBlock, type Motion } from "./model";
import { translator, type Translate } from "./i18n";
import { button, el, errorMessage } from "./ui";
class ConfirmDiscard extends Modal {
  constructor(
    app: App,
    private t: Translate,
    private confirm: () => void,
  ) {
    super(app);
  }
  onOpen() {
    this.setTitle(this.t("Discard changes?", "Отменить изменения?"));
    el(
      this.contentEl,
      "p",
      "",
      this.t(
        "Your unsaved changes will be lost.",
        "Несохранённые изменения будут потеряны.",
      ),
    );
    const bar = el(this.contentEl, "div", "mn-toolbar");
    button(
      bar,
      this.t("Keep editing", "Продолжить редактирование"),
      () => this.close(),
      "mod-cta",
    );
    button(
      bar,
      this.t("Discard", "Не сохранять"),
      () => {
        this.close();
        this.confirm();
      },
      "mod-warning",
    );
  }
}
class EditorModal extends Modal {
  private editor?: Editor;
  private canClose = false;
  private confirming = false;
  constructor(
    app: App,
    private t: Translate,
    private save: (motion: Motion) => Promise<void>,
    private initial?: Motion,
  ) {
    super(app);
  }
  onOpen() {
    this.modalEl.classList.add("mn-modal");
    this.editor = new Editor(
      this.contentEl,
      this.t,
      async (motion) => {
        await this.save(motion);
        this.canClose = true;
        this.close();
      },
      () => this.close(),
      this.initial,
    );
  }
  close() {
    if (!this.canClose && this.editor?.dirty) {
      if (this.confirming) return;
      this.confirming = true;
      const modal = new ConfirmDiscard(this.app, this.t, () => {
        this.canClose = true;
        this.close();
      });
      modal.onClose = () => {
        this.confirming = false;
      };
      modal.open();
      return;
    }
    super.close();
  }
  onClose() {
    this.editor?.destroy();
    this.contentEl.empty();
  }
}
class ChooseMotion extends SuggestModal<Motion> {
  constructor(
    app: App,
    private items: Motion[],
    private chosen: (m: Motion) => void,
  ) {
    super(app);
  }
  getSuggestions(query: string) {
    return this.items.filter((m) =>
      m.title.toLowerCase().includes(query.toLowerCase()),
    );
  }
  renderSuggestion(m: Motion, element: HTMLElement) {
    element.setText(m.title);
  }
  onChooseSuggestion(m: Motion) {
    this.chosen(m);
  }
}
class MotionRender extends MarkdownRenderChild {
  private player?: Player;
  constructor(
    element: HTMLElement,
    private motion: Motion,
    private t: Translate,
    private edit: () => void,
    private removed: () => void,
  ) {
    super(element);
  }
  onload() {
    this.player = new Player(this.containerEl, this.motion, this.t, this.edit);
  }
  onunload() {
    this.player?.destroy();
    this.removed();
  }
}
function documents(text: string): Motion[] {
  return [
    ...text.matchAll(
      /^([ \t]*)(`{3,}|~{3,})motion[^\S\r\n]*\r?\n([\s\S]*?)^\1\2[^\S\r\n]*(?=\r?$)/gm,
    ),
  ].flatMap((match) => {
    try {
      return [parseMotion(match[3]!)];
    } catch {
      return [];
    }
  });
}
export default class Kinetica extends Plugin {
  private renderers = new Set<MotionRender>();
  settings: Settings = { language: "auto" };
  t: Translate = translator("en");
  async onload() {
    const stored: unknown = await this.loadData();
    if (
      stored &&
      typeof stored === "object" &&
      "language" in stored &&
      ["auto", "en", "ru"].includes(String(stored.language))
    )
      this.settings.language = stored.language as Settings["language"];
    this.updateLanguage();
    this.registerMarkdownCodeBlockProcessor(
      "motion",
      (source, element, ctx) => {
        try {
          const motion = parseMotion(source);
          const renderer = new MotionRender(
            element,
            motion,
            this.t,
            () => this.openExisting(ctx.sourcePath, motion),
            () => this.renderers.delete(renderer),
          );
          this.renderers.add(renderer);
          ctx.addChild(renderer);
        } catch (error) {
          element.classList.add("mn-player");
          el(
            element,
            "strong",
            "",
            this.t(
              "Cannot display visualization",
              "Не удалось показать визуализацию",
            ),
          );
          el(element, "p", "mn-error", errorMessage(error, this.t));
          button(
            element,
            this.t("Open note source", "Открыть исходник заметки"),
            () => {
              void this.app.workspace.openLinkText(ctx.sourcePath, "", false, {
                state: { mode: "source" },
              });
            },
          );
        }
      },
    );
    this.addRibbonIcon(
      "workflow",
      this.t("Create visualization", "Создать визуализацию"),
      () => this.openNew(false),
    );
    this.addCommand({
      id: "create",
      name: this.t("Create visualization", "Создать визуализацию"),
      callback: () => this.openNew(false),
    });
    this.addCommand({
      id: "insert",
      name: this.t(
        "Add visualization to current note",
        "Добавить визуализацию в текущую заметку",
      ),
      checkCallback: (checking) => {
        const file = this.app.workspace.getActiveFile();
        if (!file || file.extension !== "md") return false;
        if (!checking) this.openNew(true);
        return true;
      },
    });
    this.addCommand({
      id: "edit",
      name: this.t(
        "Edit visualization in current note",
        "Редактировать визуализацию в текущей заметке",
      ),
      checkCallback: (checking) => {
        const file = this.app.workspace.getActiveFile();
        if (!file || file.extension !== "md") return false;
        if (!checking)
          void this.choose(file).catch(
            (error) => new Notice(errorMessage(error, this.t)),
          );
        return true;
      },
    });
    this.addSettingTab(new MotionSettings(this.app, this));
  }
  onunload() {
    for (const renderer of [...this.renderers]) renderer.unload();
    this.renderers.clear();
  }
  updateLanguage() {
    this.t = translator(
      this.settings.language === "auto"
        ? getLanguage().startsWith("ru")
          ? "ru"
          : "en"
        : this.settings.language,
    );
  }
  private async read(file: TFile) {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    return view?.file?.path === file.path && view.getMode() === "source"
      ? view.editor.getValue()
      : await this.app.vault.read(file);
  }
  private async update(file: TFile, transform: (text: string) => string) {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (view?.file?.path === file.path && view.getMode() === "source") {
      const editor = view.editor,
        before = editor.getValue(),
        after = transform(before);
      let start = 0;
      while (
        start < before.length &&
        start < after.length &&
        before[start] === after[start]
      )
        start++;
      let endBefore = before.length,
        endAfter = after.length;
      while (
        endBefore > start &&
        endAfter > start &&
        before[endBefore - 1] === after[endAfter - 1]
      ) {
        endBefore--;
        endAfter--;
      }
      editor.replaceRange(
        after.slice(start, endAfter),
        editor.offsetToPos(start),
        editor.offsetToPos(endBefore),
      );
    } else await this.app.vault.process(file, transform);
  }
  private openNew(insert: boolean) {
    const active = this.app.workspace.getActiveFile();
    const folder =
      active?.parent?.path === "/" ? "" : (active?.parent?.path ?? "");
    new EditorModal(this.app, this.t, async (motion) => {
      if (insert && active) {
        await this.update(
          active,
          (text) => text + "\n\n" + toBlock(motion) + "\n",
        );
      } else {
        const safe =
          motion.title
            .replace(/[\\/:*?"<>|#^[\]]/g, "-")
            .replace(/\.+$/, "")
            .trim()
            .slice(0, 100) || "Visualization";
        let path = normalizePath(`${folder}/${safe}.md`),
          suffix = 2;
        while (this.app.vault.getAbstractFileByPath(path))
          path = normalizePath(`${folder}/${safe} ${suffix++}.md`);
        const file = await this.app.vault.create(path, toBlock(motion) + "\n");
        await this.app.workspace
          .getLeaf(false)
          .openFile(file, { state: { mode: "preview" } });
      }
      new Notice(this.t("Visualization saved", "Визуализация сохранена"));
    }).open();
  }
  private openExisting(path: string, motion: Motion) {
    new EditorModal(
      this.app,
      this.t,
      async (updated) => {
        const file = this.app.vault.getAbstractFileByPath(path);
        if (!(file instanceof TFile))
          throw new Error(
            this.t(
              "The note was moved or deleted. Reopen it first.",
              "Заметку переместили или удалили. Сначала открой её заново.",
            ),
          );
        await this.update(file, (text) => replaceBlock(text, motion, updated));
        new Notice(this.t("Visualization saved", "Визуализация сохранена"));
      },
      motion,
    ).open();
  }
  private async choose(file: TFile) {
    const items = documents(await this.read(file));
    if (!items.length) {
      new Notice(
        this.t(
          "No valid motion blocks found in this note.",
          "В заметке нет корректных блоков motion.",
        ),
      );
      return;
    }
    if (items.length === 1) this.openExisting(file.path, items[0]!);
    else
      new ChooseMotion(this.app, items, (m) =>
        this.openExisting(file.path, m),
      ).open();
  }
}
