import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { SubscriptionPlans } from "@/components/subscription/subscription-plans";
import { getEffectivePlanId } from "@/lib/subscription";
import { getServerDictionary } from "@/lib/i18n/server";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  return { title: getServerDictionary().meta.subscription };
}

const SELLER_ROLES = ["individual_seller", "individual_renter", "dealer"];

export default async function SubscriptionPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!SELLER_ROLES.includes(session.user.role)) redirect("/dashboard");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true, planExpiresAt: true },
  });
  if (!user) redirect("/login");

  const effectivePlan = getEffectivePlanId(user);

  // Chu kỳ (tháng/năm) của gói đang có hiệu lực — lấy từ subscription active gần nhất.
  // Dùng để phân biệt "đang dùng gói năm" vs "đang dùng gói tháng".
  let currentCycle: string | null = null;
  if (effectivePlan !== "free") {
    const activeSub = await db.subscription.findFirst({
      where: { userId: session.user.id, status: "active", plan: effectivePlan },
      orderBy: { updatedAt: "desc" },
      select: { billingCycle: true },
    });
    currentCycle = activeSub?.billingCycle ?? null;
  }

  // Yêu cầu đang chờ thanh toán (nếu có) để tiếp tục dở dang
  const pending = await db.subscription.findFirst({
    where: { userId: session.user.id, status: "pending_payment" },
    orderBy: { createdAt: "desc" },
    select: { id: true, plan: true, billingCycle: true, amount: true, paymentProofUrl: true },
  });

  return (
    <div className="container py-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">{getServerDictionary().sub.pageTitle}</h1>
        <p className="text-muted-foreground mt-1">
          {getServerDictionary().sub.pageSubtitle}
        </p>
      </div>

      <SubscriptionPlans
        currentPlan={effectivePlan}
        currentCycle={currentCycle}
        planExpiresAt={user.planExpiresAt ? user.planExpiresAt.toISOString() : null}
        platformBankInfo={process.env.NEXT_PUBLIC_PLATFORM_BANK_INFO || ""}
        platformQrUrl={process.env.NEXT_PUBLIC_PLATFORM_QR_URL || ""}
        pending={
          pending
            ? {
                id: pending.id,
                plan: pending.plan,
                billingCycle: pending.billingCycle,
                amount: Number(pending.amount),
                hasProof: !!pending.paymentProofUrl,
              }
            : null
        }
      />
    </div>
  );
}
