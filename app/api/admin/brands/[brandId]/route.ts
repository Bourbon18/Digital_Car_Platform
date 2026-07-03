import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";

export async function PATCH(req: NextRequest, { params }: { params: { brandId: string } }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { active } = await req.json();
  const brand = await db.brand.update({ where: { id: params.brandId }, data: { active } });
  return NextResponse.json(brand);
}
