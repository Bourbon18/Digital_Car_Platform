import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { getServerDictionary } from "@/lib/i18n/server";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const E = getServerDictionary().errors;

  const { bookingId } = await req.json();
  if (!bookingId) return NextResponse.json({ error: E.missingBookingId }, { status: 400 });

  const booking = await db.booking.findUnique({
    where: { id: bookingId, buyerId: session.user.id },
    include: { payment: true },
  });

  if (!booking) return NextResponse.json({ error: E.bookingNotFound }, { status: 404 });
  if (booking.status !== "confirmed") {
    return NextResponse.json({ error: E.bookingNotConfirmed }, { status: 400 });
  }
  if (booking.payment?.status === "success") {
    return NextResponse.json({ error: E.bookingAlreadyPaid2 }, { status: 400 });
  }

  await db.$transaction([
    booking.payment
      ? db.payment.update({
          where: { bookingId },
          data: { status: "success", method: "bank_transfer" },
        })
      : db.payment.create({
          data: {
            bookingId,
            amount: booking.depositAmount,
            method: "bank_transfer",
            status: "success",
          },
        }),
    db.booking.update({
      where: { id: bookingId },
      data: { status: "paid" },
    }),
  ]);

  return NextResponse.json({ success: true });
}
