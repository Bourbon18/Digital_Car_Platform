"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { useI18n } from "@/components/i18n/language-provider";

export function SearchBar() {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: suggestions, isFetching } = useQuery({
    queryKey: ["suggestions", query],
    queryFn: async () => {
      const res = await fetch(`/api/suggestions?q=${encodeURIComponent(query)}`);
      if (!res.ok) return [];
      return res.json() as Promise<string[]>;
    },
    enabled: open && query.length >= 2,
    staleTime: 30_000,
  });

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSearch(q: string) {
    if (!q.trim()) return;
    setOpen(false);
    router.push(`/mua-xe?q=${encodeURIComponent(q.trim())}`);
  }

  const showDropdown = open && query.length >= 2;

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSearch(query);
            if (e.key === "Escape") setOpen(false);
          }}
          onFocus={() => query.length >= 2 && setOpen(true)}
          placeholder={t.header.searchPlaceholder}
          className="pl-9 pr-9"
        />
        {isFetching && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground animate-spin" />
        )}
      </div>

      {showDropdown && (
        <div className="absolute top-full mt-1 w-full rounded-md border bg-popover shadow-md z-50 overflow-hidden">
          {suggestions && suggestions.length > 0 && (
            <>
              {suggestions.map((s) => (
                <button
                  key={s}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent text-left"
                  onMouseDown={() => handleSearch(s)}
                >
                  <Search className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                  {s}
                </button>
              ))}
              <div className="h-px bg-border" />
            </>
          )}
          <button
            className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent text-left text-muted-foreground"
            onMouseDown={() => handleSearch(query)}
          >
            <Search className="h-3.5 w-3.5 flex-shrink-0" />
            Tìm kiếm &ldquo;{query}&rdquo;
          </button>
        </div>
      )}
    </div>
  );
}
