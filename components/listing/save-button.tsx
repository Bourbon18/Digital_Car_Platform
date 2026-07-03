"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/components/i18n/language-provider";

interface SaveButtonProps {
  listingId: string;
  userId: string;
}

export function SaveButton({ listingId }: SaveButtonProps) {
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { t } = useI18n();
  const c = t.car;

  async function toggle() {
    setLoading(true);
    try {
      const res = await fetch("/api/listings/save", {
        method: saved ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId }),
      });
      if (res.ok) {
        setSaved(!saved);
        toast({ title: saved ? c.saveOff : c.saveOn });
      }
    } catch {
      toast({ title: c.error, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="outline" size="icon" onClick={toggle} disabled={loading} aria-label={c.saveAria}>
      <Heart className={`h-5 w-5 ${saved ? "fill-red-500 text-red-500" : ""}`} />
    </Button>
  );
}
