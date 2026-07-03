import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: { brandId: string } }) {
  const models = await db.carModel.findMany({
    where: { brandId: params.brandId, active: true },
    select: { id: true, name: true, slug: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(models);
}
