"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { approveListing, rejectListing, deleteListing } from "@/lib/actions/admin";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/ui/confirm-modal";

const REJECT_REASONS = [
  "Ảnh không rõ / thiếu ảnh",
  "Thông tin sai / thiếu",
  "Giá không hợp lý",
  "Nội dung vi phạm",
];

export function AdminListingActions({ listingId, showApprove = true }: { listingId: string; showApprove?: boolean }) {
  const [loading, setLoading] = useState<"approve" | "reject" | "delete" | null>(null);
  const [modal, setModal] = useState<"reject" | "delete" | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  async function runApprove() {
    setLoading("approve");
    const result = await approveListing(listingId);
    setLoading(null);
    if (result.error) toast({ title: "Lỗi", description: result.error as string, variant: "destructive" });
    else { toast({ title: "Đã duyệt tin đăng" }); router.refresh(); }
  }

  async function runReject(reason: string) {
    setLoading("reject");
    const result = await rejectListing(listingId, reason);
    setLoading(null);
    if (result.error) { toast({ title: "Lỗi", description: result.error as string, variant: "destructive" }); return; }
    setModal(null);
    toast({ title: "Đã từ chối tin đăng" });
    router.refresh();
  }

  async function runDelete() {
    setLoading("delete");
    const result = await deleteListing(listingId);
    setLoading(null);
    if (result.error) { toast({ title: "Lỗi", description: result.error as string, variant: "destructive" }); return; }
    setModal(null);
    toast({ title: "Đã xóa tin đăng" });
    router.refresh();
  }

  return (
    <>
      <div className="flex gap-2 flex-wrap">
        {showApprove && (
          <Button size="sm" onClick={runApprove} disabled={!!loading}>
            {loading === "approve" ? "..." : "Duyệt"}
          </Button>
        )}
        {showApprove && (
          <Button size="sm" variant="outline" onClick={() => setModal("reject")} disabled={!!loading} className="text-destructive border-destructive">
            Từ chối
          </Button>
        )}
        {!showApprove && (
          <Button size="sm" variant="destructive" onClick={() => setModal("delete")} disabled={!!loading}>
            Xóa
          </Button>
        )}
      </div>

      <ConfirmModal
        open={modal === "reject"}
        onClose={() => setModal(null)}
        onConfirm={runReject}
        title="Từ chối tin đăng"
        description="Người đăng sẽ nhận thông báo kèm lý do này."
        danger
        withReason
        reasonRequired
        reasonLabel="Chọn nhanh lý do:"
        reasonPlaceholder="Hoặc nhập lý do cụ thể..."
        quickReasons={REJECT_REASONS}
        confirmText="Xác nhận từ chối"
        loading={loading === "reject"}
      />

      <ConfirmModal
        open={modal === "delete"}
        onClose={() => setModal(null)}
        onConfirm={runDelete}
        title="Xóa tin đăng?"
        description="Tin sẽ bị gỡ khỏi hệ thống. Hành động này không thể hoàn tác."
        danger
        confirmText="Xóa tin"
        loading={loading === "delete"}
      />
    </>
  );
}
