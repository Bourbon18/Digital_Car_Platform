"use client";

import { useState } from "react";
import { Flag } from "lucide-react";
import { reportReview } from "@/lib/actions/reviews";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/components/i18n/language-provider";

export function ReviewReportButton({ reviewId }: { reviewId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const { toast } = useToast();
  const { t } = useI18n();
  const c = t.car;
  const QUICK_REASONS = [c.reasonSpam, c.reasonOffensive, c.reasonFalse, c.reasonIrrelevant];

  if (done) {
    return <span className="text-xs text-muted-foreground">✓ {c.reported}</span>;
  }

  async function submit() {
    if (reason.trim().length < 5) {
      toast({ title: c.reportMinLen, variant: "destructive" });
      return;
    }
    setLoading(true);
    const result = await reportReview(reviewId, reason.trim());
    setLoading(false);
    if (result?.error) {
      toast({ title: "Lỗi", description: result.error as string, variant: "destructive" });
    } else {
      toast({ title: c.reportSent });
      setOpen(false);
      setDone(true);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
      >
        <Flag className="h-3 w-3" /> {c.report}
      </button>
    );
  }

  return (
    <div className="mt-2 w-full space-y-2 rounded-md border bg-muted/30 p-2">
      <div className="flex flex-wrap gap-1">
        {QUICK_REASONS.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setReason(r)}
            className={`rounded-full border px-2 py-0.5 text-xs transition-colors ${
              reason === r ? "border-destructive bg-destructive/10 text-destructive" : "hover:bg-muted"
            }`}
          >
            {r}
          </button>
        ))}
      </div>
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        rows={2}
        maxLength={300}
        placeholder={c.reportPlaceholder}
        className="w-full rounded border border-input px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
      />
      <div className="flex justify-end gap-2">
        <button onClick={() => setOpen(false)} className="text-xs text-muted-foreground hover:underline">
          {c.cancel}
        </button>
        <button
          onClick={submit}
          disabled={loading}
          className="text-xs font-medium text-destructive hover:underline disabled:opacity-50"
        >
          {loading ? c.sending : c.sendReport}
        </button>
      </div>
    </div>
  );
}
