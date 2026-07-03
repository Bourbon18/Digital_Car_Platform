import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { getServerDictionary } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

// GET /api/user/other-status?id=X — trả về status của user khác
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const targetId = req.nextUrl.searchParams.get("id");
  if (!targetId) return NextResponse.json({ error: getServerDictionary().errors.missingId }, { status: 400 });

  const user = await db.user.findUnique({
    where: { id: targetId },
    select: { status: true },
  });

  if (!user) return NextResponse.json({ status: "deleted" });
  return NextResponse.json({ status: user.status });
}
