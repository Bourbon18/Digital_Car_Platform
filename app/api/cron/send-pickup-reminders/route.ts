import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendGenericEmail } from "@/lib/auth/email";
import { formatDate } from "@/lib/utils";
import { createNotification } from "@/lib/notifications";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStart = new Date(tomorrow.setHours(0, 0, 0, 0));
  const tomorrowEnd = new Date(tomorrow.setHours(23, 59, 59, 999));

  const bookings = await db.booking.findMany({
    where: {
      status: "paid",
      startDate: { gte: tomorrowStart, lte: tomorrowEnd },
    },
    include: {
      buyer: { select: { email: true, name: true } },
      listing: { select: { title: true, address: true, city: true } },
    },
  });

  for (const booking of bookings) {
    const pickupInfo = [booking.listing.address, booking.listing.city].filter(Boolean).join(", ");

    await sendGenericEmail(
      booking.buyer.email,
      `[Nhắc nhở] Ngày mai bạn nhận xe — ${booking.listing.title}`,
      `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Nhắc Nhở Nhận Xe</h2>
          <p>Xin chào <strong>${booking.buyer.name}</strong>,</p>
          <p>Ngày mai (<strong>${formatDate(booking.startDate)}</strong>) bạn có lịch nhận xe <strong>${booking.listing.title}</strong>.</p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr><td style="padding: 8px; border: 1px solid #e5e7eb; font-weight: bold;">Địa điểm nhận:</td><td style="padding: 8px; border: 1px solid #e5e7eb;">${pickupInfo}</td></tr>
            <tr><td style="padding: 8px; border: 1px solid #e5e7eb; font-weight: bold;">Ngày trả xe:</td><td style="padding: 8px; border: 1px solid #e5e7eb;">${formatDate(booking.endDate)}</td></tr>
          </table>
          <p>Chúc bạn có chuyến đi vui vẻ!</p>
        </div>
      `
    );

    await createNotification(
      booking.buyerId,
      "booking_confirmed",
      "Nhắc nhở nhận xe ngày mai",
      `Nhớ nhận xe ${booking.listing.title} vào ngày mai nhé!`,
      { bookingId: booking.id }
    );
  }

  return NextResponse.json({ reminded: bookings.length });
}
