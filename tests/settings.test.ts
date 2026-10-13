// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import type { App } from "obsidian";
import * as obsidian from "obsidian";
afterEach(() => vi.restoreAllMocks());
import { MotionSettings, type SettingsPlugin } from "../src/settings";
import { translator } from "../src/i18n";
function setup() {
  const plugin = {
    settings: { language: "auto" },
    t: translator("en"),
    saveData: vi.fn().mockResolvedValue(undefined),
    updateLanguage: vi.fn(),
  };
  const tab = new MotionSettings(
    {} as App,
    plugin as unknown as SettingsPlugin,
  );
  return { tab, plugin };
}
describe("language settings", () => {
  it("exposes a searchable language dropdown with both translations", () => {
    const { tab } = setup();
    const def = tab.getSettingDefinitions()[0]!;
    expect(def.name).toBe("Language");
    expect(def.aliases).toContain("язык");
    expect(def.control).toEqual({
      type: "dropdown",
      key: "language",
      defaultValue: "auto",
      options: { auto: "Same as Obsidian", en: "English", ru: "Русский" },
    });
  });
  it("persists language before applying it and refreshes the search definitions", async () => {
    const { tab, plugin } = setup();
    const update = vi.spyOn(tab, "update");
    await tab.setControlValue("language", "ru");
    expect(plugin.saveData).toHaveBeenCalledWith({ language: "ru" });
    expect(tab.getControlValue("language")).toBe("ru");
    expect(plugin.updateLanguage).toHaveBeenCalledOnce();
    expect(update).toHaveBeenCalledOnce();
  });
  it.each([null, "fr", {}, 1])("rejects invalid language %j", async (value) => {
    const { tab, plugin } = setup();
    await expect(tab.setControlValue("language", value)).rejects.toThrow(
      "Invalid language setting",
    );
    expect(plugin.saveData).not.toHaveBeenCalled();
    expect(plugin.settings.language).toBe("auto");
  });
  it("keeps the previous language when saving fails", async () => {
    const { tab, plugin } = setup();
    plugin.saveData.mockRejectedValueOnce(new Error("disk full"));
    await expect(tab.setControlValue("language", "en")).rejects.toThrow(
      "disk full",
    );
    expect(plugin.settings.language).toBe("auto");
    expect(plugin.updateLanguage).not.toHaveBeenCalled();
  });
  it("renders and saves through the legacy dropdown without the new API", async () => {
    const { tab, plugin } = setup();
    vi.spyOn(obsidian, "requireApiVersion").mockReturnValue(false);
    Object.defineProperty(tab, "update", { value: undefined });
    tab.display();
    expect(
      [...tab.containerEl.querySelectorAll("option")].map((x) => x.value),
    ).toEqual(["auto", "en", "ru"]);
    const input = tab.containerEl.querySelector("select")!;
    input.value = "en";
    input.dispatchEvent(new Event("change"));
    await vi.waitFor(() => expect(plugin.settings.language).toBe("en"));
    expect(tab.containerEl.querySelector("select")!.value).toBe("en");
  });
});
