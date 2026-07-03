"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { VN_CITIES, cityLabel } from "@/lib/constants";
import { useI18n } from "@/components/i18n/language-provider";

const SALE_PRESETS = [
  { labelVi: "", labelEn: "", min: "", max: "" },
  { labelVi: "< 300tr", labelEn: "< 300M", min: "", max: "300000000" },
  { labelVi: "300–600tr", labelEn: "300–600M", min: "300000000", max: "600000000" },
  { labelVi: "600tr–1tỷ", labelEn: "600M–1B", min: "600000000", max: "1000000000" },
  { labelVi: "1–2 tỷ", labelEn: "1–2B", min: "1000000000", max: "2000000000" },
  { labelVi: "> 2 tỷ", labelEn: "> 2B", min: "2000000000", max: "" },
];

const RENT_PRESETS = [
  { labelVi: "", labelEn: "", min: "", max: "" },
  { labelVi: "< 500k", labelEn: "< 500k", min: "", max: "500000" },
  { labelVi: "500k–1tr", labelEn: "500k–1M", min: "500000", max: "1000000" },
  { labelVi: "1–2tr", labelEn: "1–2M", min: "1000000", max: "2000000" },
  { labelVi: "> 2tr", labelEn: "> 2M", min: "2000000", max: "" },
];

function formatVND(value: string, isRent: boolean, locale: string): string {
  const num = Number(value);
  if (!num) return "";
  const nf = locale === "vi" ? "vi-VN" : "en-US";
  const million = locale === "vi" ? " triệu" : "M";
  const billion = locale === "vi" ? " tỷ" : "B";
  if (isRent) {
    if (num >= 1_000_000) return `${(num / 1_000_000).toLocaleString(nf)}${million}`;
    return `${(num / 1_000).toLocaleString(nf)}k`;
  }
  if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toLocaleString(nf, { maximumFractionDigits: 1 })}${billion}`;
  return `${(num / 1_000_000).toLocaleString(nf)}${million}`;
}


interface FilterSidebarProps {
  searchParams: Record<string, string>;
  showDateFilter?: boolean;
  isRent?: boolean;
}

export function FilterSidebar({ showDateFilter: _showDateFilter, isRent = false }: FilterSidebarProps) {
  const router = useRouter();
  const sp = useSearchParams();
  const { t, locale } = useI18n();
  const L = t.listings;

  const SORT_OPTIONS = [
    { value: "newest", label: L.sortNewest },
    { value: "price_asc", label: L.sortPriceAsc },
    { value: "price_desc", label: L.sortPriceDesc },
    { value: "popular", label: L.sortPopular },
    { value: "rating", label: L.sortRating },
  ];

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(sp.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      params.delete("page");
      router.push("?" + params.toString());
    },
    [router, sp]
  );

  const updatePriceRange = useCallback(
    (min: string, max: string) => {
      const params = new URLSearchParams(sp.toString());
      if (min) params.set("priceMin", min); else params.delete("priceMin");
      if (max) params.set("priceMax", max); else params.delete("priceMax");
      params.delete("page");
      router.push("?" + params.toString());
    },
    [router, sp]
  );

  const clearAll = useCallback(() => router.push("?"), [router]);
  const hasFilters = sp.toString().length > 0;

  const presets = isRent ? RENT_PRESETS : SALE_PRESETS;
  const priceMin = sp.get("priceMin") || "";
  const priceMax = sp.get("priceMax") || "";

  const activePreset = presets.findIndex(
    (p) => p.min === priceMin && p.max === priceMax
  );

  // Danh sách năm cho dropdown (năm hiện tại → 1990), áp dụng ngay khi chọn
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1989 }, (_, i) => currentYear - i);
  const yearMin = sp.get("yearMin") || "";
  const yearMax = sp.get("yearMax") || "";

  // Local state for custom price inputs (displayed in triệu/nghìn)
  const unit = isRent ? 1_000 : 1_000_000;
  const unitLabel = isRent ? L.priceUnitRent : L.priceUnitSale;

  const [customMin, setCustomMin] = useState(priceMin ? String(Number(priceMin) / unit) : "");
  const [customMax, setCustomMax] = useState(priceMax ? String(Number(priceMax) / unit) : "");

  useEffect(() => {
    setCustomMin(priceMin ? String(Number(priceMin) / unit) : "");
    setCustomMax(priceMax ? String(Number(priceMax) / unit) : "");
  }, [priceMin, priceMax, unit]);

  const currentRange =
    priceMin || priceMax
      ? `${priceMin ? formatVND(priceMin, isRent, locale) : "0"} – ${priceMax ? formatVND(priceMax, isRent, locale) : "∞"}`
      : null;

  return (
    <div className="space-y-6 rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{L.filters}</h3>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearAll} className="text-xs">
            {L.clearAll}
          </Button>
        )}
      </div>

      {/* Sort */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">{L.sort}</Label>
        <select
          value={sp.get("sort") || "newest"}
          onChange={(e) => updateFilter("sort", e.target.value)}
          className="w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Location */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">{L.city}</Label>
        <select
          value={sp.get("city") || ""}
          onChange={(e) => updateFilter("city", e.target.value)}
          className="w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">{L.allCities}</option>
          {VN_CITIES.map((c) => (
            <option key={c} value={c}>{cityLabel(c, locale)}</option>
          ))}
        </select>
      </div>

      {/* Year range */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">{L.year}</Label>
        <div className="flex items-center gap-2">
          <select
            value={yearMin}
            onChange={(e) => updateFilter("yearMin", e.target.value)}
            className="w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">{L.fromYear}</option>
            {years
              .filter((y) => !yearMax || y <= Number(yearMax))
              .map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
          </select>
          <span className="text-muted-foreground text-sm flex-shrink-0">–</span>
          <select
            value={yearMax}
            onChange={(e) => updateFilter("yearMax", e.target.value)}
            className="w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">{L.toYear}</option>
            {years
              .filter((y) => !yearMin || y >= Number(yearMin))
              .map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
          </select>
        </div>
      </div>

      {/* Price range */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">
          {L.priceLabel} ({unitLabel})
        </Label>

        {/* Preset chips */}
        <div className="flex flex-wrap gap-1.5">
          {presets.map((p, i) => (
            <button
              key={i}
              onClick={() => updatePriceRange(p.min, p.max)}
              className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
                activePreset === i
                  ? "border-primary bg-primary text-primary-foreground font-medium"
                  : "hover:bg-muted hover:border-muted-foreground/40"
              }`}
            >
              {p.min === "" && p.max === "" ? L.all : (locale === "vi" ? p.labelVi : p.labelEn)}
            </button>
          ))}
        </div>

        {/* Custom range inputs */}
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">{L.customRange}</p>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="number"
                placeholder={L.from}
                min="0"
                value={customMin}
                onChange={(e) => setCustomMin(e.target.value)}
                onBlur={() => updatePriceRange(customMin ? String(Number(customMin) * unit) : "", priceMax)}
                className="w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <span className="text-muted-foreground text-sm flex-shrink-0">–</span>
            <div className="relative flex-1">
              <input
                type="number"
                placeholder={L.to}
                min="0"
                value={customMax}
                onChange={(e) => setCustomMax(e.target.value)}
                onBlur={() => updatePriceRange(priceMin, customMax ? String(Number(customMax) * unit) : "")}
                className="w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {isRent ? L.unitRentHint : L.unitSaleHint}
          </p>
        </div>

        {/* Current selection display */}
        {currentRange && (
          <div className="rounded-md bg-primary/5 border border-primary/20 px-3 py-2 text-sm text-primary font-medium">
            {currentRange}
          </div>
        )}
      </div>

      {/* Condition */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">{L.condition}</Label>
        <div className="flex gap-2">
          {[
            { value: "", label: L.all },
            { value: "new", label: L.condNew },
            { value: "used", label: L.condUsed },
          ].map((c) => (
            <button
              key={c.value}
              onClick={() => updateFilter("condition", c.value)}
              className={`flex-1 rounded-md border px-2 py-1.5 text-xs transition-colors ${
                (sp.get("condition") || "") === c.value
                  ? "border-primary bg-primary/10 text-primary font-medium"
                  : "hover:bg-muted"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
