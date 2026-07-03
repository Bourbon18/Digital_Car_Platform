"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { confirmBooking, rejectBooking, activateBooking, completeBooking } from "@/lib/actions/bookings";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { useI18n } from "@/components/i18n/language-provider";

interface BookingActionButtonsProps {
  booking: { id: string; status: string };
}

export function BookingActionButtons({ booking }: BookingActionButtonsProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [showReject, setShowReject] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useI18n();
  const b = t.bookingActions;

  async function handleAction(action: "confirm" | "activate" | "complete") {
    setLoading(action);
    let result: { error?: unknown };
    if (action === "confirm") result = await confirmBooking(booking.id);
    else if (action === "activate") result = await activateBooking(booking.id);
    else result = await completeBooking(booking.id);

    setLoading(null);
    if (result.error) {
      toast({ title: b.error, description: result.error as string, variant: "destructive" });
    } else {
      const labels: Record<string, string> = {
        confirm: b.confirmed,
        activate: b.activated,
        complete: b.completed,
      };
      toast({ title: labels[action] });
      router.refresh();
    }
  }

  async function runReject(reason: string) {
    setLoading("reject");
    const result = await rejectBooking(booking.id, reason);
    setLoading(null);
    if (result.error) {
      toast({ title: b.error, description: result.error as string, variant: "destructive" });
      return;
    }
    setShowReject(false);
    toast({ title: b.rejected });
    router.refresh();
  }

  return (
    <>
      <div className="flex gap-2">
        {booking.status === "pending" && (
          <>
            <Button size="sm" onClick={() => handleAction("confirm")} disabled={!!loading}>
              {loading === "confirm" ? "..." : b.confirm}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowReject(true)}
              disabled={!!loading}
              className="text-destructive border-destructive hover:bg-destructive/5"
            >
              {b.reject}
            </Button>
          </>
        )}

        {booking.status === "paid" && (
          <Button size="sm" onClick={() => handleAction("activate")} disabled={!!loading}>
            {loading === "activate" ? "..." : b.handover}
          </Button>
        )}

        {booking.status === "active" && (
          <Button size="sm" onClick={() => handleAction("complete")} disabled={!!loading}>
            {loading === "complete" ? "..." : b.complete}
          </Button>
        )}
      </div>

      <ConfirmModal
        open={showReject}
        onClose={() => setShowReject(false)}
        onConfirm={runReject}
        title={b.rejectTitle}
        description={b.rejectDesc}
        danger
        withReason
        reasonLabel={b.rejectReasonLabel}
        reasonPlaceholder={b.rejectReasonPlaceholder}
        quickReasons={b.rejectReasons}
        confirmText={b.rejectConfirm}
        loading={loading === "reject"}
      />
    </>
  );
}
