"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Sparkles } from "lucide-react";
import { boostListing } from "@/lib/actions/featured";
import { useI18n } from "@/components/i18n/language-provider";

interface Props {
  listingId: string;
  featuredUntil: string | null; // ISO string hoặc null
  remaining: number;
}

export function BoostListingButton({ listingId, featuredUntil, remaining }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const { t, locale } = useI18n();
  const M = t.mine;
  const [loading, setLoading] = useState(false);

  const dateLocale = locale === "en" ? "en-GB" : "vi-VN";
  const now = Date.now();
  const isFeatured = featuredUntil ? new Date(featuredUntil).getTime() > now : false;

  async function handleBoost() {
    setLoading(true);
    const res = await boostListing(listingId);
    setLoading(false);
    if (res.error) {
      toast({ title: M.boostFail, description: res.error, variant: "destructive" });
      return;
    }
    const until = res.featuredUntil ? new Date(res.featuredUntil).toLocaleDateString(dateLocale) : "";
    toast({ title: M.boostDone, description: `${M.boostDoneDescPre} ${until}.` });
    router.refresh();
  }

  if (isFeatured) {
    const untilStr = new Date(featuredUntil!).toLocaleDateString(dateLocale);
    return (
      <div className="flex flex-col items-end gap-1">
        <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700">
          <Sparkles className="h-3 w-3" /> {M.boostFeaturing}
        </span>
        {remaining > 0 && (
          <button
            onClick={handleBoost}
            disabled={loading}
            className="text-xs text-muted-foreground underline hover:text-primary disabled:opacity-50"
          >
            {loading ? "..." : M.boostExtend}
          </button>
        )}
        <span className="text-[10px] text-muted-foreground">{M.boostUntil} {untilStr}</span>
      </div>
    );
  }

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={handleBoost}
      disabled={loading || remaining <= 0}
      title={remaining <= 0 ? M.boostNoQuota : undefined}
    >
      <Sparkles className="h-3.5 w-3.5 mr-1" />
      {loading ? "..." : M.boostBtn}
    </Button>
  );
}
