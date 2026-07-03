import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { AdminUserActions } from "@/components/admin/user-actions";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin - Quản Lý Người Dùng" };

const ROLE_LABELS: Record<string, string> = {
  buyer: "Người mua", individual_seller: "Người bán", individual_renter: "Chủ xe cho thuê",
  dealer: "Đại lý", admin: "Admin",
};

export default async function AdminUsersPage({ searchParams }: { searchParams: { q?: string; role?: string; status?: string } }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") redirect("/");

  const { q, role, status } = searchParams;

  const users = await db.user.findMany({
    where: {
      ...(q ? { OR: [{ email: { contains: q, mode: "insensitive" } }, { name: { contains: q, mode: "insensitive" } }] } : {}),
      ...(role ? { role: role as "buyer" | "individual_seller" | "individual_renter" | "dealer" | "admin" } : {}),
      ...(status ? { status: status as "unverified" | "active" | "suspended" } : {}),
    },
    include: { dealerProfile: true, _count: { select: { listings: true, bookings: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Quản Lý Người Dùng ({users.length})</h1>

      <form className="flex gap-2">
        <input name="q" defaultValue={q} placeholder="Tìm email, tên..." className="flex-1 rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        <button type="submit" className="bg-primary text-white px-4 py-2 rounded-md text-sm">Tìm</button>
      </form>

      <div className="space-y-3">
        {users.map((user) => (
          <div key={user.id} className="flex items-start justify-between gap-4 rounded-lg border p-4">
            <div>
              <p className="font-medium">{user.name || "(Chưa đặt tên)"}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <div className="flex gap-2 mt-1">
                <Badge variant="secondary">{ROLE_LABELS[user.role] || user.role}</Badge>
                {user.status === "suspended" && <Badge variant="destructive">Tạm khóa</Badge>}
                {user.status === "unverified" && <Badge variant="warning">Chưa xác thực</Badge>}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {user._count.listings} tin đăng · {user._count.bookings} booking · Tham gia {formatDate(user.createdAt)}
              </p>
              {user.dealerProfile && <p className="text-xs text-muted-foreground">Đại lý: {user.dealerProfile.businessName}</p>}
            </div>
            <AdminUserActions user={{ id: user.id, role: user.role, status: user.status }} />
          </div>
        ))}
      </div>
    </div>
  );
}
