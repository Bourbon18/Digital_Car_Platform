"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { XCircle } from "lucide-react";
import { activateSubscription, rejectSubscription } from "@/lib/actions/subscriptions";

const QUICK_REASONS = [
  "Không thấy tiền về tài khoản",
  "Ảnh chứng từ không rõ / không hợp lệ",
  "Sai số tiền chuyển khoản",
  "Sai nội dung chuyển khoản",
];

export function SubscriptionActions({ subscriptionId }: { subscriptionId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);
  const [showReject, setShowReject] = useState(false);
  const [reason, setReason] = useState("");
  // Portal chỉ render sau khi mount (tránh lỗi document undefined khi SSR)
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  async function handleActivate() {
    setLoading("activate");
    const res = await activateSubscription(subscriptionId);
    setLoading(null);
    if (res.error) {
      toast({ title: "Lỗi", description: res.error as string, variant: "destructive" });
    } else {
      toast({ title: "Đã kích hoạt gói cho người dùng" });
      router.refresh();
    }
  }

  async function confirmReject() {
    const finalReason = reason.trim();
    if (!finalReason) {
      toast({ title: "Vui lòng nhập lý do từ chối", variant: "destructive" });
      return;
    }
    setLoading("reject");
    const res = await rejectSubscription(subscriptionId, finalReason);
    setLoading(null);
    if (res.error) {
      toast({ title: "Lỗi", description: res.error as string, variant: "destructive" });
      return;
    }
    setShowReject(false);
    setReason("");
    toast({ title: "Đã từ chối yêu cầu" });
    router.refresh();
  }

  return (
    <>
      <div className="flex gap-2">
        <Button size="sm" onClick={handleActivate} disabled={!!loading}>
          {loading === "activate" ? "..." : "Kích hoạt"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="text-destructive border-destructive hover:bg-destructive/5"
          onClick={() => setShowReject(true)}
          disabled={!!loading}
        >
          Từ chối
        </Button>
      </div>

      {/* Modal nhập lý do từ chối — render qua portal để phủ toàn màn hình */}
      {showReject && mounted && createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 animate-in fade-in"
          onClick={() => loading !== "reject" && setShowReject(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-100 flex-shrink-0">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Từ chối yêu cầu mua gói</h3>
                <p className="text-xs text-muted-foreground">
                  Người dùng sẽ nhận thông báo kèm lý do này.
                </p>
              </div>
            </div>

            <p className="text-sm font-medium mb-2">Chọn nhanh lý do:</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {QUICK_REASONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setReason(r)}
                  className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                    reason === r
                      ? "border-primary bg-primary/10 text-primary"
                      : "hover:bg-muted"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="Hoặc nhập lý do cụ thể..."
              className="w-full rounded-lg border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />

            <div className="mt-5 flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowReject(false)}
                disabled={loading === "reject"}
              >
                Hủy
              </Button>
              <Button
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                onClick={confirmReject}
                disabled={loading === "reject" || !reason.trim()}
              >
                {loading === "reject" ? "Đang xử lý..." : "Xác nhận từ chối"}
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
