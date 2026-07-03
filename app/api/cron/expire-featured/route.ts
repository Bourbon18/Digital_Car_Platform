import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET/POST /api/cron/expire-featured
// Hạ cờ nổi bật (featured=false) cho các tin đã hết hạn đẩy (featuredUntil < now),
// để việc sắp xếp "tin nổi bật lên đầu" luôn chính xác.
//
// Bảo vệ bằng CRON_SECRET nếu được cấu hình.
async function handle(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    const qs = req.nextUrl.searchParams.get("secret");
    const ok = auth === `Bearer ${secret}` || qs === secret;
    if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const result = await db.listing.updateMany({
    where: { featured: true, featuredUntil: { lt: now } },
    data: { featured: false },
  });

  return NextResponse.json({ ok: true, expired: result.count });
}

export async function GET(req: NextRequest) {
  return handle(req);
}

export async function POST(req: NextRequest) {
  return handle(req);
}
