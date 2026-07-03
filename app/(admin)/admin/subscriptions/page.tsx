import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { SubscriptionActions } from "@/components/admin/subscription-actions";
import { PLANS, formatVnd } from "@/lib/plans";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin - Duyệt Gói Dịch Vụ" };

export default async function AdminSubscriptionsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") redirect("/");

  const pending = await db.subscription.findMany({
    where: { status: "pending_payment" },
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const recent = await db.subscription.findMany({
    where: { status: { in: ["active", "rejected"] } },
    include: { user: { select: { name: true, email: true } } },
    orderBy: { updatedAt: "desc" },
    take: 15,
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Duyệt Gói Dịch Vụ ({pending.length})</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Kiểm tra chứng từ chuyển khoản rồi kích hoạt gói cho người dùng.
        </p>
      </div>

      {pending.length === 0 ? (
        <div className="text-center py-12 border rounded-lg text-muted-foreground">
          Không có yêu cầu chờ duyệt
        </div>
      ) : (
        <div className="space-y-4">
          {pending.map((s) => (
            <div key={s.id} className="rounded-lg border p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <p className="font-medium">
                    {s.user.name || s.user.email}{" "}
                    <Badge variant="secondary">{PLANS[s.plan].name}</Badge>{" "}
                    <span className="text-xs text-muted-foreground">
                      {s.billingCycle === "yearly" ? "theo năm" : "theo tháng"}
                    </span>
                  </p>
                  <p className="text-sm">
                    Số tiền: <strong className="text-primary">{formatVnd(Number(s.amount))}</strong>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {s.user.email} · Tạo {formatDate(s.createdAt)}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {s.paymentProofUrl ? (
                    <Badge variant="success">Đã gửi chứng từ</Badge>
                  ) : (
                    <Badge variant="warning">Chưa có chứng từ</Badge>
                  )}
                </div>
              </div>

              {s.paymentProofUrl && (
                <div className="mt-3">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                    Chứng từ chuyển khoản
                  </p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={s.paymentProofUrl}
                    alt="Chứng từ"
                    className="h-48 w-auto rounded-md border object-contain bg-white"
                  />
                </div>
              )}

              <div className="mt-4 pt-3 border-t">
                <SubscriptionActions subscriptionId={s.id} />
              </div>
            </div>
          ))}
        </div>
      )}

      {recent.length > 0 && (
        <div>
          <h2 className="font-semibold mb-3">Gần đây</h2>
          <div className="space-y-2">
            {recent.map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-md border px-4 py-2 text-sm">
                <span>
                  {s.user.name || s.user.email} — {PLANS[s.plan].name}
                </span>
                <div className="flex items-center gap-3">
                  {s.status === "active" && s.expiresAt && (
                    <span className="text-xs text-muted-foreground">đến {formatDate(s.expiresAt)}</span>
                  )}
                  <Badge variant={s.status === "active" ? "success" : "destructive"}>
                    {s.status === "active" ? "Đã kích hoạt" : "Từ chối"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
