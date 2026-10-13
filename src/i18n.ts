export type Language = "en" | "ru";
export type Translate = (english: string, russian: string) => string;
export function translator(language: Language): Translate {
  return (english, russian) => (language === "ru" ? russian : english);
}
