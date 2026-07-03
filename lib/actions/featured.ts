"use server";

import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/rbac";
import { getEffectivePlan } from "@/lib/subscription";
import { getServerDictionary } from "@/lib/i18n/server";
import { revalidatePath } from "next/cache";

// Số ngày một lượt "đẩy tin nổi bật" có hiệu lực.
const BOOST_DURATION_DAYS = 7;

function startOfMonth(d = new Date()): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}

export interface FeaturedQuota {
  limit: number; // số lượt/tháng theo gói
  used: number; // đã dùng trong tháng này
  remaining: number;
  planName: string;
}

/** Số lượt đẩy tin còn lại trong tháng của user (tính theo gói hiệu lực). */
export async function getFeaturedQuota(userId: string): Promise<FeaturedQuota> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { plan: true, planExpiresAt: true },
  });
  const plan = user ? getEffectivePlan(user) : null;
  const limit = plan?.featuredPerMonth ?? 0;

  const used = await db.featuredBoost.count({
    where: { userId, createdAt: { gte: startOfMonth() } },
  });

  return {
    limit,
    used,
    remaining: Math.max(0, limit - used),
    planName: plan?.name ?? "Free",
  };
}

/** Dùng 1 lượt để đẩy một tin lên nổi bật trong BOOST_DURATION_DAYS ngày. */
export async function boostListing(listingId: string) {
  const user = await requireRole(["individual_seller", "individual_renter", "dealer"]);

  const listing = await db.listing.findUnique({
    where: { id: listingId },
    select: { id: true, userId: true, status: true, slug: true, featuredUntil: true },
  });
  const E = getServerDictionary().errors;
  if (!listing || listing.userId !== user.id) {
    return { error: E.listingNotFound };
  }
  if (listing.status !== "active") {
    return { error: E.onlyBoostActive };
  }

  const quota = await getFeaturedQuota(user.id);
  if (quota.limit === 0) {
    return { error: E.noBoostQuota };
  }
  if (quota.remaining <= 0) {
    return { error: E.boostMonthlyUsedUp.replace("{n}", String(quota.limit)) };
  }

  const now = new Date();
  // Nếu tin còn đang nổi bật thì cộng dồn thời gian, ngược lại tính từ bây giờ.
  const base =
    listing.featuredUntil && listing.featuredUntil > now ? listing.featuredUntil : now;
  const expiresAt = new Date(base.getTime() + BOOST_DURATION_DAYS * 24 * 60 * 60 * 1000);

  await db.$transaction([
    db.featuredBoost.create({
      data: { userId: user.id, listingId, expiresAt },
    }),
    db.listing.update({
      where: { id: listingId },
      data: { featured: true, featuredUntil: expiresAt },
    }),
  ]);

  revalidatePath("/dashboard/listings");
  revalidatePath(`/xe/${listing.slug}`);
  return { success: true, featuredUntil: expiresAt.toISOString() };
}
