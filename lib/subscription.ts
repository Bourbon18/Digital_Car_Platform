import { db } from "@/lib/db";
import { PLANS, type PlanId, type PlanDef } from "@/lib/plans";

interface PlanFields {
  plan: PlanId;
  planExpiresAt: Date | null;
}

/** Trả về gói đang thực sự có hiệu lực: nếu đã hết hạn thì coi như free. */
export function getEffectivePlanId(user: PlanFields): PlanId {
  if (user.plan === "free") return "free";
  if (user.planExpiresAt && user.planExpiresAt.getTime() < Date.now()) return "free";
  return user.plan;
}

export function getEffectivePlan(user: PlanFields): PlanDef {
  return PLANS[getEffectivePlanId(user)];
}

/** Lấy gói hiệu lực của user theo id (đọc từ DB). */
export async function getUserEffectivePlan(userId: string): Promise<PlanDef> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { plan: true, planExpiresAt: true },
  });
  if (!user) return PLANS.free;
  return getEffectivePlan(user);
}

/**
 * Kiểm tra hạn mức đăng tin trong ngày theo gói (đếm trực tiếp từ DB — tin cậy,
 * không phụ thuộc Redis). Tính từ 00:00 hôm nay theo giờ máy chủ.
 */
export async function checkDailyPostLimit(
  userId: string
): Promise<{ ok: boolean; plan: PlanDef; used: number; limit: number }> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { plan: true, planExpiresAt: true },
  });
  const plan = user ? getEffectivePlan(user) : PLANS.free;

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const used = await db.listing.count({
    where: {
      userId,
      status: { not: "deleted" },
      createdAt: { gte: startOfDay },
    },
  });

  return { ok: used < plan.postsPerDay, plan, used, limit: plan.postsPerDay };
}
