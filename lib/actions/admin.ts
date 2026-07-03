"use server";

import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/rbac";
import { createNotification } from "@/lib/notifications";
import { revalidatePath } from "next/cache";

export async function approveListing(listingId: string) {
  await requireRole(["admin"]);

  const listing = await db.listing.findUnique({
    where: { id: listingId },
    include: { user: { select: { id: true } } },
  });
  if (!listing) return { error: "Listing không tồn tại" };

  await db.listing.update({
    where: { id: listingId },
    data: { status: "active", rejectionReason: null },
  });

  await createNotification(
    listing.userId,
    "listing_approved",
    "Tin đăng đã được duyệt!",
    `Tin đăng "${listing.title}" đã được duyệt và hiển thị công khai.`,
    { listingId }
  );

  revalidatePath("/admin/listings");
  return { success: true };
}

export async function rejectListing(listingId: string, reason: string) {
  await requireRole(["admin"]);

  const listing = await db.listing.findUnique({ where: { id: listingId } });
  if (!listing) return { error: "Listing không tồn tại" };

  await db.listing.update({
    where: { id: listingId },
    data: { status: "rejected", rejectionReason: reason },
  });

  await createNotification(
    listing.userId,
    "listing_rejected",
    "Tin đăng bị từ chối",
    `Tin đăng "${listing.title}" bị từ chối. Lý do: ${reason}`,
    { listingId }
  );

  revalidatePath("/admin/listings");
  return { success: true };
}

export async function deleteListing(listingId: string) {
  await requireRole(["admin"]);

  const listing = await db.listing.findUnique({ where: { id: listingId } });
  if (!listing) return { error: "Listing không tồn tại" };

  await db.listing.update({
    where: { id: listingId },
    data: { status: "deleted" },
  });

  await createNotification(
    listing.userId,
    "listing_rejected",
    "Tin đăng đã bị xóa",
    `Tin đăng "${listing.title}" đã bị admin xóa khỏi hệ thống.`,
    { listingId }
  );

  revalidatePath("/admin/listings");
  return { success: true };
}

export async function suspendUser(userId: string, reason: string) {
  await requireRole(["admin"]);

  await db.$transaction([
    db.user.update({ where: { id: userId }, data: { status: "suspended" } }),
    db.listing.updateMany({
      where: { userId, status: "active" },
      data: { status: "draft" },
    }),
  ]);

  await createNotification(
    userId,
    "account_suspended",
    "Tài khoản đã bị tạm khóa",
    `Tài khoản của bạn đã bị tạm khóa. Lý do: ${reason}`,
    {}
  );

  revalidatePath("/admin/users");
  return { success: true };
}

export async function unsuspendUser(userId: string) {
  await requireRole(["admin"]);
  await db.user.update({ where: { id: userId }, data: { status: "active" } });
  revalidatePath("/admin/users");
  return { success: true };
}

export async function verifyDealer(userId: string) {
  await requireRole(["admin"]);

  await db.$transaction([
    db.user.update({ where: { id: userId }, data: { role: "dealer" } }),
    db.dealerProfile.update({
      where: { userId },
      data: { verificationStatus: "verified", verifiedAt: new Date() },
    }),
  ]);

  await createNotification(
    userId,
    "dealer_verified",
    "Tài khoản đại lý đã được xác minh!",
    "Chúc mừng! Tài khoản đại lý của bạn đã được xác minh. Bạn có thể đăng tin thương mại.",
    {}
  );

  revalidatePath("/admin/users");
  return { success: true };
}

export async function getAdminStats() {
  await requireRole(["admin"]);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [totalListings, totalUsers, bookingsLast30d, pendingListings] = await Promise.all([
    db.listing.count({ where: { status: { not: "deleted" } } }),
    db.user.count(),
    db.booking.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    db.listing.count({ where: { status: "pending" } }),
  ]);

  return { totalListings, totalUsers, bookingsLast30d, pendingListings };
}
