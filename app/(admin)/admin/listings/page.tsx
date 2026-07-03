import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { AdminListingRow } from "@/components/admin/listing-row";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin - Quản Lý Tin Đăng" };

export default async function AdminListingsPage({ searchParams }: { searchParams: { status?: string; q?: string } }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") redirect("/");

  const status = (searchParams.status as "pending" | "active" | "rejected" | "deleted") || "pending";
  const q = searchParams.q || "";

  const listings = await db.listing.findMany({
    where: {
      status,
      ...(q ? { title: { contains: q, mode: "insensitive" } } : {}),
    },
    include: {
      user: { select: { name: true, email: true, phone: true } },
      brand: true,
      model: true,
      images: { orderBy: { order: "asc" } },
    },
    orderBy: [{ priorityReview: "desc" }, { createdAt: "asc" }],
    take: 50,
  });

  const STATUS_OPTIONS = ["pending", "active", "rejected", "deleted"];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Quản Lý Tin Đăng</h1>

      <div className="flex gap-2 flex-wrap">
        {STATUS_OPTIONS.map((s) => (
          <a key={s} href={`/admin/listings?status=${s}`}
            className={`px-3 py-1.5 rounded-md text-sm border ${status === s ? "bg-primary text-white border-primary" : "hover:bg-muted"}`}>
            {s === "pending" ? "Chờ duyệt" : s === "active" ? "Đang hiển thị" : s === "rejected" ? "Bị từ chối" : "Đã xóa"}
          </a>
        ))}
      </div>

      <div className="space-y-3">
        {listings.length === 0 ? (
          <div className="text-center py-12 border rounded-lg text-muted-foreground">Không có tin đăng nào</div>
        ) : listings.map((listing) => (
          <AdminListingRow key={listing.id} listing={listing} status={status} />
        ))}
      </div>
    </div>
  );
}
