"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/rbac";
import { createNotification } from "@/lib/notifications";
import { getServerDictionary } from "@/lib/i18n/server";
import { revalidatePath } from "next/cache";

type Errs = ReturnType<typeof getServerDictionary>["errors"];

function makeReviewSchema(m: Errs) {
  return z.object({
    bookingId: z.string(),
    rating: z.number().int().min(1).max(5),
    content: z.string().min(10, m.reviewMin).max(500, m.reviewMax),
  });
}

export async function createReview(data: z.infer<ReturnType<typeof makeReviewSchema>>) {
  const user = await requireRole(["buyer", "individual_seller", "individual_renter", "dealer"]);

  const E = getServerDictionary().errors;
  const parsed = makeReviewSchema(E).safeParse(data);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const booking = await db.booking.findUnique({
    where: { id: parsed.data.bookingId, buyerId: user.id },
    include: { listing: true, review: true },
  });

  if (!booking) return { error: E.bookingNotExist };
  if (booking.status !== "completed") return { error: E.onlyReviewAfterComplete };
  if (booking.review) return { error: E.alreadyReviewed, code: "DUPLICATE" };

  const review = await db.review.create({
    data: {
      bookingId: booking.id,
      reviewerId: user.id,
      listingId: booking.listingId,
      rating: parsed.data.rating,
      content: parsed.data.content,
    },
  });

  await recalculateRating(booking.listingId);

  await createNotification(
    booking.listing.userId,
    "review_new",
    "Bạn có đánh giá mới!",
    `Khách hàng đã đánh giá ${parsed.data.rating} sao cho xe của bạn.`,
    { reviewId: review.id, listingId: booking.listingId }
  );

  revalidatePath(`/xe/${booking.listing.slug}`);
  return { success: true, reviewId: review.id };
}

export async function recalculateRating(listingId: string) {
  const result = await db.review.aggregate({
    where: { listingId, hidden: false },
    _avg: { rating: true },
    _count: { id: true },
  });

  await db.listing.update({
    where: { id: listingId },
    data: {
      averageRating: result._avg.rating,
      reviewCount: result._count.id,
    },
  });
}

export async function reportReview(reviewId: string, reason: string) {
  const user = await requireRole(["buyer", "individual_seller", "individual_renter", "dealer", "admin"]);

  const review = await db.review.findUnique({ where: { id: reviewId } });
  if (!review) return { error: getServerDictionary().errors.reviewNotExist };

  await db.reviewReport.create({
    data: { reviewId, reporterId: user.id, reason },
  });

  return { success: true };
}

export async function hideReview(reviewId: string) {
  await requireRole(["admin"]);

  const review = await db.review.findUnique({
    where: { id: reviewId },
    include: { listing: true },
  });
  if (!review) return { error: getServerDictionary().errors.reviewNotExist };

  await db.review.update({
    where: { id: reviewId },
    data: { hidden: true, hiddenAt: new Date() },
  });

  await db.reviewReport.updateMany({
    where: { reviewId, resolved: false },
    data: { resolved: true },
  });

  await recalculateRating(review.listingId);

  await createNotification(
    review.reviewerId,
    "review_reported",
    "Đánh giá của bạn đã bị ẩn",
    "Đánh giá của bạn đã bị ẩn do vi phạm chính sách cộng đồng.",
    { reviewId }
  );

  revalidatePath(`/xe/${review.listing.slug}`);
  return { success: true };
}
