import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { AdminReviewActions } from "@/components/admin/review-actions";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin - Kiểm Duyệt Đánh Giá" };

export default async function AdminReviewsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") redirect("/");

  const reports = await db.reviewReport.findMany({
    where: { resolved: false },
    include: {
      review: {
        include: {
          reviewer: { select: { name: true, email: true } },
          listing: { select: { title: true, slug: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Đánh Giá Bị Báo Cáo ({reports.length})</h1>

      {reports.length === 0 ? (
        <div className="text-center py-12 border rounded-lg text-muted-foreground">Không có báo cáo nào</div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <div key={report.id} className="rounded-lg border p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium">
                    {report.review.reviewer.name || report.review.reviewer.email} —{" "}
                    <span className="text-yellow-500">{"★".repeat(report.review.rating)}</span>
                  </p>
                  <p className="text-sm text-muted-foreground mt-0.5">Xe: {report.review.listing.title}</p>
                  <p className="text-sm bg-muted rounded p-2 mt-2">{report.review.content}</p>
                </div>
                <Badge variant="destructive">Báo cáo</Badge>
              </div>
              <div className="border-t pt-2">
                <p className="text-xs text-muted-foreground">Lý do báo cáo: {report.reason}</p>
                <p className="text-xs text-muted-foreground">Ngày báo cáo: {formatDate(report.createdAt)}</p>
              </div>
              <AdminReviewActions reviewId={report.review.id} reportId={report.id} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
