import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createNotification } from "@/lib/notifications";

export const dynamic = "force-dynamic";

// GET/POST /api/cron/booking-reminders
// Gửi nhắc nhở cho các chuyến thuê (status=active) sắp đến hạn trả xe (trong 24h tới).
// - Chủ xe: nhắc chuẩn bị nhận lại xe & nhấn "Hoàn thành".
// - Khách thuê: nhắc sắp đến hạn trả xe.
// Mỗi booking chỉ nhắc 1 lần (đánh dấu returnReminderSent = true).
//
// Bảo vệ bằng CRON_SECRET nếu được cấu hình (header "Authorization: Bearer <secret>"
// hoặc query ?secret=<secret>). Gọi định kỳ bằng Vercel Cron / cron-job.org / Task Scheduler.
async function handle(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    const qs = req.nextUrl.searchParams.get("secret");
    const ok = auth === `Bearer ${secret}` || qs === secret;
    if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const bookings = await db.booking.findMany({
    where: {
      status: "active",
      returnReminderSent: false,
      endDate: { lte: in24h },
    },
    include: { listing: { select: { userId: true, title: true } } },
  });

  let sent = 0;
  for (const b of bookings) {
    const dateStr = b.endDate.toLocaleDateString("vi-VN");

    // Chủ xe — nhắc nhận lại xe & hoàn thành chuyến
    await createNotification(
      b.listing.userId,
      "booking_reminder",
      "Sắp đến ngày nhận lại xe",
      `Chuyến thuê "${b.listing.title}" sẽ kết thúc ngày ${dateStr}. Hãy chuẩn bị nhận lại xe và nhấn "Hoàn thành" sau khi khách trả xe.`,
      { bookingId: b.id, url: "/dashboard/rentals" }
    );

    // Khách thuê — nhắc trả xe đúng hạn
    await createNotification(
      b.buyerId,
      "booking_reminder",
      "Sắp đến hạn trả xe",
      `Chuyến thuê "${b.listing.title}" sẽ đến hạn trả vào ngày ${dateStr}. Vui lòng trả xe đúng hẹn để tránh phát sinh phí.`,
      { bookingId: b.id, url: "/dashboard/bookings" }
    );

    await db.booking.update({
      where: { id: b.id },
      data: { returnReminderSent: true },
    });
    sent++;
  }

  return NextResponse.json({ ok: true, remindersForBookings: sent });
}

export async function GET(req: NextRequest) {
  return handle(req);
}

export async function POST(req: NextRequest) {
  return handle(req);
}
