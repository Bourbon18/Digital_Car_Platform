"use client";

import { Globe } from "lucide-react";
import { locales } from "@/lib/i18n/config";
import { useI18n } from "./language-provider";

export function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();

  return (
    <div className="flex items-center gap-1 rounded-full border p-0.5">
      <Globe className="ml-1 h-3.5 w-3.5 text-muted-foreground" />
      {locales.map((l) => (
        <button
          key={l}
          onClick={() => setLocale(l)}
          aria-pressed={locale === l}
          className={`rounded-full px-2 py-0.5 text-xs font-semibold uppercase transition-colors ${
            locale === l
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
