import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET/POST /api/cron/expire-plans
// Đưa các tài khoản có gói trả phí đã hết hạn (planExpiresAt < now) về gói Free,
// và đánh dấu các subscription active đã hết hạn thành "expired" (dữ liệu sạch).
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

  // Danh sách user sắp bị hạ gói (để xóa các cổng thanh toán bổ sung của họ)
  const expiring = await db.user.findMany({
    where: { plan: { not: "free" }, planExpiresAt: { lt: now } },
    select: { id: true },
  });
  const ids = expiring.map((u) => u.id);

  const [subs, users, qrs] = await db.$transaction([
    db.subscription.updateMany({
      where: { status: "active", expiresAt: { lt: now } },
      data: { status: "expired" },
    }),
    db.user.updateMany({
      where: { id: { in: ids } },
      data: { plan: "free", planExpiresAt: null },
    }),
    // Hết Business → xóa cổng nhận tiền bổ sung, chỉ giữ cổng mặc định (User.paymentQrUrl)
    db.paymentQr.deleteMany({ where: { userId: { in: ids } } }),
  ]);

  return NextResponse.json({
    ok: true,
    expiredSubscriptions: subs.count,
    downgradedUsers: users.count,
    deletedExtraQr: qrs.count,
  });
}

export async function GET(req: NextRequest) {
  return handle(req);
}

export async function POST(req: NextRequest) {
  return handle(req);
}
