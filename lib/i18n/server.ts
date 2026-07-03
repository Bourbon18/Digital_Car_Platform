import { cookies } from "next/headers";
import { defaultLocale, isLocale, LOCALE_COOKIE, type Locale } from "./config";
import { getDictionary } from "./dictionaries";

/** Locale hiện tại đọc từ cookie (dùng trong server component). */
export function getServerLocale(): Locale {
  const value = cookies().get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : defaultLocale;
}

/** Từ điển tương ứng locale hiện tại (server component). */
export function getServerDictionary() {
  return getDictionary(getServerLocale());
}
