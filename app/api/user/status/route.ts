import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ status: null });

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { status: true },
  });

  return NextResponse.json({ status: user?.status ?? null });
}
