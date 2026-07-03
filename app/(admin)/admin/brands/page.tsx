import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { BrandsManager } from "@/components/admin/brands-manager";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin - Quản Lý Hãng Xe" };

export default async function AdminBrandsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") redirect("/");

  const brands = await db.brand.findMany({
    include: { models: { orderBy: { name: "asc" } } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Quản Lý Hãng Xe & Model</h1>
      <BrandsManager brands={brands} />
    </div>
  );
}
