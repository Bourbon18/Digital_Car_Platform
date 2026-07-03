"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2 } from "lucide-react";
import { useI18n } from "@/components/i18n/language-provider";

export function ConfirmTransferButton({ bookingId, hasQr }: { bookingId: string; hasQr: boolean }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useI18n();
  const c = t.checkout;

  if (!hasQr) return null;

  async function handleConfirm() {
    setLoading(true);
    try {
      const res = await fetch("/api/payment/confirm-transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId }),
      });
      if (res.ok) {
        router.push("/payment/success");
      } else {
        const d = await res.json();
        toast({ title: d.error || c.confirmError, variant: "destructive" });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button className="w-full" onClick={handleConfirm} disabled={loading}>
      <CheckCircle2 className="mr-2 h-4 w-4" />
      {loading ? c.processing : c.confirmTransfer}
    </Button>
  );
}
