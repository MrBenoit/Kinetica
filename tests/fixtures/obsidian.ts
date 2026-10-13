export const requireApiVersion = (): boolean => true;
export class PluginSettingTab {
  containerEl = document.createElement("div");
  update() {}
}
export class Setting {
  private row: HTMLElement;
  constructor(parent: HTMLElement) {
    this.row = document.createElement("label");
    parent.append(this.row);
  }
  setName(name: string) {
    this.row.dataset.name = name;
    return this;
  }
  setDesc(desc: string) {
    this.row.dataset.description = desc;
    return this;
  }
  addDropdown(
    callback: (dropdown: {
      addOptions(options: Record<string, string>): unknown;
      setValue(value: string): unknown;
      onChange(change: (value: string) => Promise<void>): unknown;
    }) => void,
  ) {
    const input = document.createElement("select");
    this.row.append(input);
    const dropdown = {
      addOptions(options: Record<string, string>) {
        for (const [value, label] of Object.entries(options))
          input.add(new Option(label, value));
        return dropdown;
      },
      setValue(value: string) {
        input.value = value;
        return dropdown;
      },
      onChange(change: (value: string) => Promise<void>) {
        input.addEventListener("change", () => {
          void change(input.value);
        });
        return dropdown;
      },
    };
    callback(dropdown);
    return this;
  }
}
