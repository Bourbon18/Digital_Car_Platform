"use server";

import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/rbac";
import { createNotification } from "@/lib/notifications";
import { getEffectivePlanId } from "@/lib/subscription";
import { PLANS, getPlanPrice, formatVnd, type PlanId, type BillingCycle } from "@/lib/plans";
import { getServerDictionary } from "@/lib/i18n/server";
import { revalidatePath } from "next/cache";

const E = () => getServerDictionary().errors;

function addToDate(base: Date, cycle: BillingCycle): Date {
  const d = new Date(base);
  if (cycle === "yearly") d.setFullYear(d.getFullYear() + 1);
  else d.setMonth(d.getMonth() + 1);
  return d;
}

/** Người bán/cho thuê/đại lý tạo yêu cầu mua gói (chờ thanh toán). */
export async function requestSubscription(plan: PlanId, billingCycle: BillingCycle) {
  const user = await requireRole(["individual_seller", "individual_renter", "dealer"]);

  if (plan === "free") return { error: E().freeNoPayment };
  if (!PLANS[plan]) return { error: E().invalidPlan };
  if (billingCycle !== "monthly" && billingCycle !== "yearly") {
    return { error: E().invalidBillingCycle };
  }

  // Mỗi lúc chỉ giữ 1 gói: nếu đang có gói trả phí hiệu lực và muốn đăng ký gói
  // KHÁC → phải hủy gói hiện tại trước. Gia hạn/đổi chu kỳ cùng gói thì vẫn cho.
  const dbUser = await db.user.findUnique({
    where: { id: user.id },
    select: { plan: true, planExpiresAt: true },
  });
  const effective = dbUser ? getEffectivePlanId(dbUser) : "free";
  if (effective !== "free" && plan !== effective) {
    return {
      error: E().alreadyOnPlanCancelFirst.replace("{plan}", PLANS[effective].name),
    };
  }

  const amount = getPlanPrice(plan, billingCycle);

  // Hủy các yêu cầu chờ thanh toán cũ để tránh trùng lặp
  await db.subscription.updateMany({
    where: { userId: user.id, status: "pending_payment" },
    data: { status: "cancelled" },
  });

  const sub = await db.subscription.create({
    data: {
      userId: user.id,
      plan,
      billingCycle,
      amount,
      status: "pending_payment",
    },
  });

  revalidatePath("/dashboard/subscription");
  return { success: true, subscriptionId: sub.id, amount };
}

/** Người dùng tải ảnh chứng từ chuyển khoản lên cho yêu cầu mua gói. */
export async function submitSubscriptionProof(subscriptionId: string, proofUrl: string) {
  const user = await requireRole(["individual_seller", "individual_renter", "dealer"]);

  const sub = await db.subscription.findUnique({ where: { id: subscriptionId } });
  if (!sub || sub.userId !== user.id) return { error: E().requestNotFound };
  if (sub.status !== "pending_payment") return { error: E().requestNotPending };

  if (!proofUrl || !proofUrl.startsWith("data:image/")) {
    return { error: E().proofInvalid };
  }
  // Chuỗi base64 của ảnh 1MB ≈ 1.4M ký tự → chặn nếu lớn hơn (biên an toàn).
  if (proofUrl.length > 1_500_000) {
    return { error: E().proofTooLarge };
  }

  await db.subscription.update({
    where: { id: subscriptionId },
    data: { paymentProofUrl: proofUrl },
  });

  // Báo cho admin để duyệt
  const admins = await db.user.findMany({ where: { role: "admin" }, select: { id: true } });
  await Promise.all(
    admins.map((a) =>
      createNotification(
        a.id,
        "subscription_pending",
        "Có yêu cầu mua gói chờ duyệt",
        `${user.name || user.email} đã thanh toán gói ${PLANS[sub.plan].name} (${formatVnd(Number(sub.amount))}).`,
        { subscriptionId }
      )
    )
  );

  revalidatePath("/dashboard/subscription");
  return { success: true };
}

/** Người dùng tự hủy yêu cầu mua gói đang chờ thanh toán (đổi ý / muốn đổi gói khác). */
export async function cancelSubscription(subscriptionId: string) {
  const user = await requireRole(["individual_seller", "individual_renter", "dealer"]);

  const sub = await db.subscription.findUnique({ where: { id: subscriptionId } });
  if (!sub || sub.userId !== user.id) return { error: E().requestNotFound };
  if (sub.status !== "pending_payment") {
    return { error: E().onlyCancelPending };
  }

  await db.subscription.update({
    where: { id: subscriptionId },
    data: { status: "cancelled" },
  });

  revalidatePath("/dashboard/subscription");
  return { success: true };
}

/**
 * Người dùng hủy GÓI ĐANG DÙNG (đang hiệu lực) để quay về Free — thường để đổi
 * sang gói khác. Cảnh báo mất số ngày còn lại được xử lý ở phía UI trước khi gọi.
 */
export async function cancelActivePlan() {
  const user = await requireRole(["individual_seller", "individual_renter", "dealer"]);

  const dbUser = await db.user.findUnique({
    where: { id: user.id },
    select: { plan: true },
  });
  if (!dbUser || dbUser.plan === "free") {
    return { error: E().freeNothingToCancel };
  }

  await db.$transaction([
    // Đánh dấu các gói đang active của user là đã hủy (dữ liệu sạch)
    db.subscription.updateMany({
      where: { userId: user.id, status: "active" },
      data: { status: "cancelled" },
    }),
    // Đưa tài khoản về Free ngay lập tức
    db.user.update({
      where: { id: user.id },
      data: { plan: "free", planExpiresAt: null },
    }),
  ]);

  revalidatePath("/dashboard/subscription");
  return { success: true };
}

/** Admin xác nhận đã nhận tiền → kích hoạt gói cho người dùng. */
export async function activateSubscription(subscriptionId: string) {
  const admin = await requireRole(["admin"]);

  const sub = await db.subscription.findUnique({
    where: { id: subscriptionId },
    include: { user: { select: { plan: true, planExpiresAt: true } } },
  });
  if (!sub) return { error: E().requestNotFound };
  if (sub.status === "active") return { error: E().planAlreadyActive };

  // Nếu user đang còn hạn cùng gói → cộng dồn; ngược lại tính từ bây giờ
  const now = new Date();
  const base =
    sub.user.plan === sub.plan && sub.user.planExpiresAt && sub.user.planExpiresAt > now
      ? sub.user.planExpiresAt
      : now;
  const expiresAt = addToDate(base, sub.billingCycle as BillingCycle);

  await db.$transaction([
    db.subscription.update({
      where: { id: subscriptionId },
      data: { status: "active", startedAt: now, expiresAt, activatedBy: admin.id },
    }),
    db.user.update({
      where: { id: sub.userId },
      data: { plan: sub.plan, planExpiresAt: expiresAt },
    }),
  ]);

  await createNotification(
    sub.userId,
    "subscription_activated",
    "Gói dịch vụ đã được kích hoạt!",
    `Gói ${PLANS[sub.plan].name} của bạn đã được kích hoạt, hiệu lực đến ${expiresAt.toLocaleDateString("vi-VN")}.`,
    { subscriptionId }
  );

  revalidatePath("/admin/subscriptions");
  return { success: true };
}

/** Admin từ chối yêu cầu (vd: không thấy tiền về). */
export async function rejectSubscription(subscriptionId: string, reason: string) {
  await requireRole(["admin"]);

  const sub = await db.subscription.findUnique({ where: { id: subscriptionId } });
  if (!sub) return { error: E().requestNotFound };
  if (sub.status === "active") return { error: E().planActiveCannotReject };

  await db.subscription.update({
    where: { id: subscriptionId },
    data: { status: "rejected", rejectionReason: reason },
  });

  await createNotification(
    sub.userId,
    "subscription_rejected",
    "Yêu cầu mua gói bị từ chối",
    `Yêu cầu mua gói ${PLANS[sub.plan].name} bị từ chối. Lý do: ${reason}`,
    { subscriptionId }
  );

  revalidatePath("/admin/subscriptions");
  return { success: true };
}
