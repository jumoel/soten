import en, { type MessageKey, type Messages } from "./en";
import da from "./da";

type Translations = Record<string, string>;

const locales: Record<string, Translations> = {
  en,
  da: { ...en, ...da },
};

let current: Translations = en;
let pluralRules = new Intl.PluralRules("en");

export type { MessageKey };

export function setLocale(locale: string): void {
  current = locales[locale] ?? en;
  try {
    pluralRules = new Intl.PluralRules(locale);
  } catch {
    pluralRules = new Intl.PluralRules("en");
  }
}

export function registerLocale(
  locale: string,
  messages: Partial<Messages> & Record<string, string>,
): void {
  locales[locale] = { ...en, ...messages };
}

function interpolate(
  template: string,
  params: Record<string, string | number> | undefined,
): string {
  if (!params) return template;
  let result = template;
  for (const [key, value] of Object.entries(params)) {
    result = result.split(`{${key}}`).join(String(value));
  }
  return result;
}

export function t(key: MessageKey, params?: Record<string, string | number>): string {
  if (params && "count" in params) {
    const rule = pluralRules.select(params.count as number);
    const pluralKey = `${key}_${rule}`;
    if (pluralKey in current) {
      return interpolate(current[pluralKey], params);
    }
  }

  return interpolate(current[key] ?? en[key], params);
}
