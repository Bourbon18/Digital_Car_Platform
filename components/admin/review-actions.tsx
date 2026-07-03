"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { hideReview } from "@/lib/actions/reviews";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

export function AdminReviewActions({ reviewId, reportId }: { reviewId: string; reportId: string }) {
  const [loading, setLoading] = useState<"hide" | "dismiss" | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  async function handleHide() {
    setLoading("hide");
    const result = await hideReview(reviewId);
    setLoading(null);
    if (result.error) {
      toast({ title: "Lỗi", description: result.error as string, variant: "destructive" });
    } else {
      toast({ title: "Đã ẩn đánh giá" });
      router.refresh();
    }
  }

  async function handleDismiss() {
    setLoading("dismiss");
    await fetch(`/api/admin/review-reports/${reportId}/dismiss`, { method: "POST" });
    setLoading(null);
    toast({ title: "Đã bỏ qua báo cáo" });
    router.refresh();
  }

  return (
    <div className="flex gap-2">
      <Button size="sm" variant="outline" onClick={handleHide} disabled={!!loading} className="text-destructive border-destructive">
        {loading === "hide" ? "..." : "Ẩn đánh giá"}
      </Button>
      <Button size="sm" variant="outline" onClick={handleDismiss} disabled={!!loading}>
        {loading === "dismiss" ? "..." : "Bỏ qua báo cáo"}
      </Button>
    </div>
  );
}
