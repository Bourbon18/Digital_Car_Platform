import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { LayoutDashboard, List, Users, Star, Tag, CreditCard } from "lucide-react";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/listings", label: "Tin Đăng", icon: List },
  { href: "/admin/subscriptions", label: "Gói Dịch Vụ", icon: CreditCard },
  { href: "/admin/users", label: "Người Dùng", icon: Users },
  { href: "/admin/reviews", label: "Đánh Giá", icon: Star },
  { href: "/admin/brands", label: "Hãng Xe", icon: Tag },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") redirect("/login");

  // Số lượng cần duyệt để hiện badge trên nav
  const [pendingListings, pendingSubs] = await Promise.all([
    db.listing.count({ where: { status: "pending" } }),
    db.subscription.count({
      where: { status: "pending_payment", paymentProofUrl: { not: null } },
    }),
  ]);
  const badges: Record<string, number> = {
    "/admin/listings": pendingListings,
    "/admin/subscriptions": pendingSubs,
  };

  return (
    <div className="fixed inset-0 z-50 flex bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 border-r bg-gray-50 flex flex-col overflow-y-auto">
        <div className="p-4 border-b">
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← Về trang chủ
          </Link>
        </div>
        <div className="p-4">
          <div className="mb-4 font-bold text-primary">Quản Trị Viên</div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const count = badges[item.href] || 0;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                  <span className="flex-1">{item.label}</span>
                  {count > 0 && (
                    <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-semibold text-white">
                      {count > 99 ? "99+" : count}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  );
}
