import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyVNPayCallback } from "@/lib/vnpay";
import { createNotification } from "@/lib/notifications";

export async function GET(req: NextRequest) {
  const query = Object.fromEntries(req.nextUrl.searchParams.entries());

  const isValid = verifyVNPayCallback(query);
  if (!isValid) {
    console.error("[VNPAY_CALLBACK] Invalid signature");
    return NextResponse.redirect(new URL("/payment/failed?error=invalid-signature", req.url));
  }

  const responseCode = query["vnp_ResponseCode"];
  const bookingId = query["vnp_TxnRef"];
  const vnpayTransactionNo = query["vnp_TransactionNo"];
  const amount = Number(query["vnp_Amount"]) / 100;

  // Idempotency check
  const existingPayment = await db.payment.findFirst({
    where: { vnpayTransactionNo },
  });
  if (existingPayment) {
    return NextResponse.redirect(new URL("/payment/success?bookingId=" + bookingId, req.url));
  }

  if (responseCode !== "00") {
    await db.payment.create({
      data: {
        bookingId,
        amount,
        vnpayTransactionNo,
        vnpayResponseCode: responseCode,
        status: "failed",
      },
    });
    return NextResponse.redirect(new URL("/payment/failed?bookingId=" + bookingId, req.url));
  }

  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    include: { listing: { select: { userId: true, title: true } } },
  });

  if (!booking) {
    return NextResponse.redirect(new URL("/payment/failed?error=booking-not-found", req.url));
  }

  await db.$transaction([
    db.payment.create({
      data: {
        bookingId,
        amount,
        vnpayTransactionNo,
        vnpayResponseCode: responseCode,
        status: "success",
      },
    }),
    db.booking.update({
      where: { id: bookingId },
      data: { status: "paid" },
    }),
  ]);

  await Promise.all([
    createNotification(
      booking.buyerId,
      "payment_success",
      "Thanh toán thành công!",
      `Đặt cọc ${amount.toLocaleString("vi-VN")} VND cho booking xe đã được xác nhận.`,
      { bookingId, url: "/dashboard/bookings" }
    ),
    createNotification(
      booking.listing.userId,
      "payment_success",
      "Khách hàng đã thanh toán đặt cọc",
      `Booking thuê ${booking.listing.title} đã được thanh toán đặt cọc. Hãy bàn giao xe khi tới ngày nhận.`,
      { bookingId, url: "/dashboard/rentals" }
    ),
  ]);

  return NextResponse.redirect(new URL("/payment/success?bookingId=" + bookingId, req.url));
}
