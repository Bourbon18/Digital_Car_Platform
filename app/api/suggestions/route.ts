import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") || "";
  if (q.length < 2) return NextResponse.json([]);

  const [brands, models] = await Promise.all([
    db.brand.findMany({
      where: { name: { contains: q, mode: "insensitive" }, active: true },
      select: { name: true },
      take: 3,
    }),
    db.carModel.findMany({
      where: { name: { contains: q, mode: "insensitive" }, active: true },
      include: { brand: { select: { name: true } } },
      take: 4,
    }),
  ]);

  const suggestions = [
    ...brands.map((b) => b.name),
    ...models.map((m) => `${m.brand.name} ${m.name}`),
  ];

  const unique = suggestions.filter((v, i, arr) => arr.indexOf(v) === i);
  return NextResponse.json(unique.slice(0, 6));
}
