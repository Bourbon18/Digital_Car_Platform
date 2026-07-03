"use server";

import { db } from "@/lib/db";
import { requireRole, requireEmailVerified } from "@/lib/auth/rbac";
import { calculateRentalPrice, calculateRefundAmount } from "@/lib/utils";
import { createNotification } from "@/lib/notifications";
import { getServerDictionary } from "@/lib/i18n/server";
import { revalidatePath } from "next/cache";

const E = () => getServerDictionary().errors;

export async function createBooking(
  listingId: string,
  startDate: Date,
  endDate: Date,
  pickupLocation?: string
) {
  let user;
  try {
    user = await requireRole(["buyer", "individual_seller", "individual_renter", "dealer"]);
  } catch (e) {
    if (e instanceof Error && e.message === "SUSPENDED")
      return { error: E().accountSuspendedAdmin };
    throw e;
  }
  await requireEmailVerified();

  if (startDate <= new Date()) {
    return { error: E().startTomorrow };
  }
  if (endDate <= startDate) {
    return { error: E().endAfterStart };
  }

  const listing = await db.listing.findUnique({
    where: { id: listingId, status: "active", listingType: "for_rent" },
  });
  if (!listing) return { error: E().carUnavailable };
  if (listing.userId === user.id) return { error: E().cannotBookOwn };

  const { totalDays, totalPrice } = calculateRentalPrice(
    Number(listing.pricePerDay),
    startDate,
    endDate,
    listing.weeklyDiscount
  );

  const depositAmount = totalPrice * 0.3;

  // Lock and check availability in a transaction
  let booking;
  try {
    booking = await db.$transaction(async (tx) => {
      const conflict = await tx.booking.findFirst({
        where: {
          listingId,
          status: { in: ["confirmed", "paid", "active"] },
          OR: [{ startDate: { lte: endDate }, endDate: { gte: startDate } }],
        },
      });

      if (conflict) throw new Error("BOOKING_CONFLICT");

      return tx.booking.create({
        data: {
          listingId,
          buyerId: user.id,
          startDate,
          endDate,
          totalDays,
          pricePerDay: listing.pricePerDay!,
          totalAmount: totalPrice,
          depositAmount,
          pickupLocation,
          status: "pending",
        },
      });
    });
  } catch (e) {
    if (e instanceof Error && e.message === "BOOKING_CONFLICT") {
      return { error: E().datesTaken };
    }
    throw e;
  }

  // Notify listing owner
  await createNotification(
    listing.userId,
    "booking_new",
    "Bạn có booking mới!",
    `${user.name || "Khách hàng"} đã đặt thuê xe của bạn từ ${startDate.toLocaleDateString("vi-VN")} đến ${endDate.toLocaleDateString("vi-VN")}.`,
    { bookingId: booking.id }
  );

  revalidatePath(`/xe/${listing.slug}`);
  return { success: true, bookingId: booking.id };
}

export async function confirmBooking(bookingId: string) {
  const user = await requireRole(["individual_seller", "individual_renter", "dealer"]);

  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    include: { listing: true, buyer: true },
  });

  if (!booking || booking.listing.userId !== user.id) {
    return { error: E().noPermConfirmBooking };
  }
  if (booking.status !== "pending") {
    return { error: E().bookingNotPending };
  }

  await db.booking.update({
    where: { id: bookingId },
    data: { status: "confirmed", confirmedAt: new Date() },
  });

  await createNotification(
    booking.buyerId,
    "booking_confirmed",
    "Booking đã được xác nhận!",
    `Chủ xe đã xác nhận booking của bạn. Vui lòng thanh toán đặt cọc để hoàn tất.`,
    { bookingId }
  );

  revalidatePath("/dashboard/rentals");
  return { success: true };
}

export async function rejectBooking(bookingId: string, reason: string) {
  const user = await requireRole(["individual_seller", "individual_renter", "dealer"]);

  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    include: { listing: true },
  });

  if (!booking || booking.listing.userId !== user.id) {
    return { error: E().noPermRejectBooking };
  }
  if (booking.status !== "pending") {
    return { error: E().bookingNotPending };
  }

  await db.booking.update({
    where: { id: bookingId },
    data: { status: "rejected", rejectionReason: reason, cancelledAt: new Date() },
  });

  await createNotification(
    booking.buyerId,
    "booking_rejected",
    "Booking đã bị từ chối",
    `Lý do: ${reason}`,
    { bookingId }
  );

  revalidatePath("/dashboard/rentals");
  return { success: true };
}

export async function cancelBooking(bookingId: string) {
  const user = await requireRole(["buyer", "individual_seller", "individual_renter", "dealer"]);

  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    include: { listing: true, payment: true },
  });

  if (!booking || booking.buyerId !== user.id) {
    return { error: E().noPermCancelBooking };
  }
  if (!["pending", "confirmed", "paid"].includes(booking.status)) {
    return { error: E().cannotCancelBookingStatus };
  }

  let refundAmount = 0;
  if (booking.payment && booking.status === "paid") {
    const { refundAmount: ra } = calculateRefundAmount(
      Number(booking.depositAmount),
      booking.startDate
    );
    refundAmount = ra;
  }

  await db.booking.update({
    where: { id: bookingId },
    data: { status: "cancelled", cancelledAt: new Date() },
  });

  await createNotification(
    booking.listing.userId,
    "booking_cancelled",
    "Booking đã bị hủy",
    `Khách hàng đã hủy booking thuê xe từ ${booking.startDate.toLocaleDateString("vi-VN")}.`,
    { bookingId }
  );

  revalidatePath("/dashboard/bookings");
  return { success: true, refundAmount };
}

export async function activateBooking(bookingId: string) {
  const user = await requireRole(["individual_seller", "individual_renter", "dealer"]);

  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    include: { listing: true },
  });

  if (!booking || booking.listing.userId !== user.id) {
    return { error: E().noPermAction };
  }
  if (booking.status !== "paid") {
    return { error: E().bookingNotPaid };
  }

  await db.booking.update({
    where: { id: bookingId },
    data: { status: "active" },
  });

  await createNotification(
    booking.buyerId,
    "booking_confirmed",
    "Xe đã được bàn giao!",
    `Chủ xe đã xác nhận bàn giao xe. Chúc bạn có chuyến đi vui vẻ!`,
    { bookingId }
  );

  revalidatePath("/dashboard/rentals");
  return { success: true };
}

export async function completeBooking(bookingId: string) {
  const user = await requireRole(["individual_seller", "individual_renter", "dealer"]);

  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    include: { listing: true },
  });

  if (!booking || booking.listing.userId !== user.id) {
    return { error: E().noPermCompleteBooking };
  }
  if (booking.status !== "active") {
    return { error: E().bookingNotActive };
  }

  await db.booking.update({
    where: { id: bookingId },
    data: { status: "completed", completedAt: new Date() },
  });

  await createNotification(
    booking.buyerId,
    "booking_completed",
    "Chuyến đi hoàn thành!",
    `Cảm ơn bạn đã sử dụng dịch vụ. Hãy để lại đánh giá cho xe bạn vừa thuê nhé.`,
    { bookingId }
  );

  revalidatePath("/dashboard/rentals");
  return { success: true };
}
