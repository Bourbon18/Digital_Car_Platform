"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cancelBooking } from "@/lib/actions/bookings";
import { useToast } from "@/hooks/use-toast";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { useI18n } from "@/components/i18n/language-provider";

export function CancelBookingButton({ bookingId }: { bookingId: string }) {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useI18n();
  const b = t.bookingActions;

  async function runCancel() {
    setLoading(true);
    const result = await cancelBooking(bookingId);
    setLoading(false);
    if (result.error) {
      toast({ title: b.error, description: result.error as string, variant: "destructive" });
      return;
    }
    setOpen(false);
    toast({ title: b.cancelled });
    router.refresh();
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        disabled={loading}
        className="text-xs border border-destructive text-destructive px-3 py-1.5 rounded hover:bg-destructive/5 disabled:opacity-50"
      >
        {b.cancelBtn}
      </button>

      <ConfirmModal
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={runCancel}
        title={b.cancelTitle}
        description={b.cancelDesc}
        danger
        confirmText={b.cancelConfirm}
        cancelText={b.cancelKeep}
        loading={loading}
      />
    </>
  );
}
