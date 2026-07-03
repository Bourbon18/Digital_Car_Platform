"use server";

import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth/rbac";
import bcrypt from "bcryptjs";
import { getServerDictionary } from "@/lib/i18n/server";
import { revalidatePath } from "next/cache";

export async function deleteAccount(password: string) {
  const user = await requireAuth();

  const dbUser = await db.user.findUnique({
    where: { id: user.id },
    select: { passwordHash: true },
  });

  const E = getServerDictionary().errors;
  if (!dbUser?.passwordHash) return { error: E.accountNotFound };

  const passwordMatch = await bcrypt.compare(password, dbUser.passwordHash);
  if (!passwordMatch) return { error: E.passwordWrong };

  // Xóa toàn bộ trong 1 transaction: hoặc xóa hết, hoặc không xóa gì (không để
  // tài khoản ở trạng thái dở dang nếu có sự cố giữa chừng).
  await db.$transaction(async (tx) => {
    // Thu thập các id thuộc sở hữu của user
    const listings = await tx.listing.findMany({
      where: { userId: user.id },
      select: { id: true },
    });
    const listingIds = listings.map((l) => l.id);

    const bookings = await tx.booking.findMany({
      where: { OR: [{ buyerId: user.id }, { listingId: { in: listingIds } }] },
      select: { id: true },
    });
    const bookingIds = bookings.map((b) => b.id);

    const reviews = await tx.review.findMany({
      where: {
        OR: [
          { reviewerId: user.id },
          { bookingId: { in: bookingIds } },
          { listingId: { in: listingIds } },
        ],
      },
      select: { id: true },
    });
    const reviewIds = reviews.map((r) => r.id);

    // Xóa từ bảng lá → gốc (các quan hệ không có onDelete: Cascade)
    await tx.reviewReport.deleteMany({ where: { reviewId: { in: reviewIds } } });
    await tx.review.deleteMany({ where: { id: { in: reviewIds } } });
    await tx.payment.deleteMany({ where: { bookingId: { in: bookingIds } } });
    await tx.booking.deleteMany({ where: { id: { in: bookingIds } } });
    // Tin nhắn: của user (gửi/nhận) + mọi tin trên tin đăng của user (kể cả
    // tin định dạng cũ receiverId = null) để không vướng khóa ngoại khi xóa tin.
    await tx.contactMessage.deleteMany({
      where: {
        OR: [
          { senderId: user.id },
          { receiverId: user.id },
          { listingId: { in: listingIds } },
        ],
      },
    });
    await tx.listing.deleteMany({ where: { userId: user.id } });

    // Xóa user — DB tự cascade: notifications, savedListings, subscriptions,
    // featuredBoosts, dealerProfile, tokens, accounts, sessions...
    await tx.user.delete({ where: { id: user.id } });
  });

  // Clear cached listing pages so deleted listings disappear immediately
  revalidatePath("/mua-xe");
  revalidatePath("/thue-xe");
  revalidatePath("/", "layout");

  return { success: true };
}
