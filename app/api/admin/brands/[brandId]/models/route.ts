import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { generateSlug } from "@/lib/utils";

export async function POST(req: NextRequest, { params }: { params: { brandId: string } }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const model = await db.carModel.create({
    data: { brandId: params.brandId, name: name.trim(), slug: generateSlug(name) },
  });

  return NextResponse.json(model);
}
