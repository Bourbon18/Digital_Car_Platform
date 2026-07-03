import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { List, Users, Calendar, Clock } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function AdminDashboardPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") redirect("/login");

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [totalListings, totalUsers, bookingsLast30d, pendingListings, recentPending] = await Promise.all([
    db.listing.count({ where: { status: { not: "deleted" } } }),
    db.user.count(),
    db.booking.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    db.listing.count({ where: { status: "pending" } }),
    db.listing.findMany({
      where: { status: "pending" },
      include: {
        brand: { select: { name: true } },
        model: { select: { name: true } },
        user: { select: { name: true } },
        images: { take: 1, orderBy: { order: "asc" } },
      },
      orderBy: { createdAt: "asc" },
      take: 5,
    }),
  ]);

  const kpis = [
    { label: "Tổng Tin Đăng", value: totalListings, icon: List, color: "text-blue-600" },
    { label: "Tổng Người Dùng", value: totalUsers, icon: Users, color: "text-green-600" },
    { label: "Booking (30 ngày)", value: bookingsLast30d, icon: Calendar, color: "text-purple-600" },
    { label: "Chờ Duyệt", value: pendingListings, icon: Clock, color: "text-orange-600" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{kpi.label}</CardTitle>
              <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{kpi.value.toLocaleString("vi-VN")}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pending listings */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Tin Đăng Chờ Duyệt</CardTitle>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/listings?status=pending">Xem tất cả</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {recentPending.length === 0 ? (
            <p className="text-sm text-muted-foreground">Không có tin đăng nào chờ duyệt.</p>
          ) : (
            <div className="space-y-3">
              {recentPending.map((listing) => (
                <div key={listing.id} className="flex items-center justify-between gap-4 rounded-md border p-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{listing.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {listing.brand.name} {listing.model.name} • {listing.user.name}
                    </div>
                  </div>
                  <Badge variant="warning">Pending</Badge>
                  <Button size="sm" asChild>
                    <Link href={`/admin/listings?id=${listing.id}`}>Xem</Link>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
