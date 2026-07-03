import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createNotification } from "@/lib/notifications";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const expiredBookings = await db.booking.findMany({
    where: {
      status: "confirmed",
      confirmedAt: { lt: twentyFourHoursAgo },
    },
    include: { listing: { select: { userId: true } } },
  });

  for (const booking of expiredBookings) {
    await db.booking.update({
      where: { id: booking.id },
      data: { status: "cancelled", cancelledAt: new Date() },
    });

    await createNotification(
      booking.buyerId,
      "booking_cancelled",
      "Booking đã bị hủy tự động",
      "Booking đã bị hủy vì không thanh toán trong 24 giờ sau khi xác nhận.",
      { bookingId: booking.id }
    );
  }

  return NextResponse.json({ cancelled: expiredBookings.length });
}
