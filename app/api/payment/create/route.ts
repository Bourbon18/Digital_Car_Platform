import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { createVNPayUrl } from "@/lib/vnpay";
import { getServerDictionary } from "@/lib/i18n/server";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const E = getServerDictionary().errors;

  const { bookingId } = await req.json();
  if (!bookingId) return NextResponse.json({ error: E.bookingIdRequired }, { status: 400 });

  const booking = await db.booking.findUnique({
    where: { id: bookingId, buyerId: session.user.id },
    include: { listing: { select: { title: true } } },
  });

  if (!booking) return NextResponse.json({ error: E.bookingNotExist }, { status: 404 });
  if (booking.status !== "confirmed") {
    return NextResponse.json({ error: E.bookingNotConfirmed }, { status: 400 });
  }

  const existingPayment = await db.payment.findUnique({ where: { bookingId } });
  if (existingPayment?.status === "success") {
    return NextResponse.json({ error: E.bookingAlreadyPaid }, { status: 400 });
  }

  const ipAddr =
    req.headers.get("x-forwarded-for")?.split(",")[0] ||
    req.headers.get("x-real-ip") ||
    "127.0.0.1";

  const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL}/payment/callback`;
  const orderInfo = `Dat coc thue xe - Booking ${bookingId.slice(0, 8)}`;

  const payUrl = createVNPayUrl(
    bookingId,
    Number(booking.depositAmount),
    orderInfo,
    ipAddr,
    returnUrl
  );

  return NextResponse.json({ payUrl });
}
