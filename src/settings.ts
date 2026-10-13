import { PluginSettingTab, Setting } from "obsidian";
import type { App, Plugin, SettingDefinition } from "obsidian";
import type { Language, Translate } from "./i18n";
export interface Settings {
  language: "auto" | Language;
}
export interface SettingsPlugin extends Plugin {
  settings: Settings;
  t: Translate;
  updateLanguage(): void;
}
export class MotionSettings extends PluginSettingTab {
  constructor(
    app: App,
    private owner: SettingsPlugin,
  ) {
    super(app, owner);
  }
  getSettingDefinitions(): SettingDefinition[] {
    const t = this.owner.t;
    return [
      {
        name: t("Language", "Язык"),
        desc: t(
          "Reopen notes to refresh players. Reload the plugin to update command names.",
          "Открой заметки заново для смены языка проигрывателей. Перезагрузи плагин для смены названий команд.",
        ),
        aliases: ["language", "язык"],
        control: {
          type: "dropdown",
          key: "language",
          defaultValue: "auto",
          options: {
            auto: t("Same as Obsidian", "Как в Obsidian"),
            en: "English",
            ru: "Русский",
          },
        },
      },
      {
        name: "Kinetica",
        desc: t(
          "Works offline. Documents live inside motion code blocks in your notes. No accounts, telemetry or external scripts.",
          "Работает без интернета. Документы хранятся внутри блоков motion в заметках. Без аккаунтов, телеметрии и внешних скриптов.",
        ),
        searchable: false,
      },
    ];
  }
  getControlValue(key: string): unknown {
    return key === "language" ? this.owner.settings.language : undefined;
  }
  async setControlValue(key: string, value: unknown): Promise<void> {
    if (
      key !== "language" ||
      (value !== "auto" && value !== "en" && value !== "ru")
    )
      throw new Error("Invalid language setting");
    const settings: Settings = { ...this.owner.settings, language: value };
    await this.owner.saveData(settings);
    this.owner.settings = settings;
    this.owner.updateLanguage();
    if (typeof this.update === "function") this.update();
    else this.renderLegacy();
  }
  // Hosts before 1.13 do not render setting definitions
  display() {
    this.renderLegacy();
  }
  private renderLegacy() {
    this.containerEl.replaceChildren();
    for (const definition of this.getSettingDefinitions()) {
      const row = new Setting(this.containerEl).setName(definition.name);
      if (definition.desc) row.setDesc(definition.desc);
      if ("control" in definition && definition.control?.type === "dropdown") {
        const control = definition.control;
        row.addDropdown((drop) =>
          drop
            .addOptions(control.options)
            .setValue(this.owner.settings.language)
            .onChange((value) => this.setControlValue(control.key, value)),
        );
      }
    }
  }
}
