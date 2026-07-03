import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const threeMonthsFromNow = new Date();
  threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);

  const bookings = await db.booking.findMany({
    where: {
      listingId: params.id,
      status: { in: ["confirmed", "paid", "active"] },
      startDate: { lte: threeMonthsFromNow },
      endDate: { gte: new Date() },
    },
    select: { startDate: true, endDate: true },
  });

  // Expand bookings into blocked date ranges
  const blockedRanges = bookings.map((b) => ({
    from: b.startDate.toISOString().split("T")[0],
    to: b.endDate.toISOString().split("T")[0],
  }));

  return NextResponse.json({ blockedRanges });
}
