"use client";

import { createContext, useContext, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { LOCALE_COOKIE, type Locale } from "@/lib/i18n/config";
import { getDictionary, type Dictionary } from "@/lib/i18n/dictionaries";

interface I18nValue {
  locale: Locale;
  t: Dictionary;
  setLocale: (l: Locale) => void;
}

const I18nContext = createContext<I18nValue | null>(null);

export function LanguageProvider({
  locale: initialLocale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [locale, setLoc] = useState<Locale>(initialLocale);

  const setLocale = useCallback(
    (l: Locale) => {
      // Lưu cookie 1 năm để server render đúng ngôn ngữ ở lần sau
      document.cookie = `${LOCALE_COOKIE}=${l}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
      setLoc(l);
      // Render lại các server component theo cookie mới
      router.refresh();
    },
    [router]
  );

  return (
    <I18nContext.Provider value={{ locale, t: getDictionary(locale), setLocale }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n phải nằm trong <LanguageProvider>");
  return ctx;
}
