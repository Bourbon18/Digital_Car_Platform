// Danh mục gói dịch vụ (plan catalog).
// Định nghĩa ở code để dễ chỉnh giá/quyền lợi mà không cần migrate DB.
// Giá tính bằng VND. Gói năm = 10 tháng (tặng 2 tháng).

export type PlanId = "free" | "pro" | "business";
export type BillingCycle = "monthly" | "yearly";

export interface PlanDef {
  id: PlanId;
  name: string;
  tagline: string;
  monthlyPrice: number;
  yearlyPrice: number;
  /** Số tin được đăng mới mỗi ngày */
  postsPerDay: number;
  /** Tin được ưu tiên trong hàng chờ duyệt (SLA ~4h) */
  priorityReview: boolean;
  /** Số lượt "tin nổi bật" được cấp mỗi tháng */
  featuredPerMonth: number;
  /** Số tài khoản/QR nhận tiền tối đa */
  maxPaymentQr: number;
  /** Badge "đã xác thực" hiển thị công khai */
  verifiedBadge: boolean;
  /** Các dòng quyền lợi hiển thị trên thẻ gói */
  perks: string[];
}

export const PLANS: Record<PlanId, PlanDef> = {
  free: {
    id: "free",
    name: "Free",
    tagline: "Bắt đầu miễn phí",
    monthlyPrice: 0,
    yearlyPrice: 0,
    postsPerDay: 2,
    priorityReview: false,
    featuredPerMonth: 0,
    maxPaymentQr: 1,
    verifiedBadge: false,
    perks: [
      "Đăng 2 tin mỗi ngày",
      "Duyệt tin tiêu chuẩn (trong 24h)",
      "1 tài khoản nhận tiền (QR)",
    ],
  },
  pro: {
    id: "pro",
    name: "Pro",
    tagline: "Cho người bán/cho thuê thường xuyên",
    monthlyPrice: 199_000,
    yearlyPrice: 1_990_000,
    postsPerDay: 5,
    priorityReview: true,
    featuredPerMonth: 4,
    maxPaymentQr: 1,
    verifiedBadge: false,
    perks: [
      "Đăng 5 tin mỗi ngày",
      "Duyệt ưu tiên (trong ~4h)",
      "4 lượt đẩy tin nổi bật / tháng",
      "1 tài khoản nhận tiền (QR)",
    ],
  },
  business: {
    id: "business",
    name: "Business",
    tagline: "Cho đại lý & doanh nghiệp",
    monthlyPrice: 499_000,
    yearlyPrice: 4_990_000,
    postsPerDay: 30,
    priorityReview: true,
    featuredPerMonth: 20,
    maxPaymentQr: 3,
    verifiedBadge: true,
    perks: [
      "Đăng tới 30 tin mỗi ngày",
      "Duyệt ưu tiên (trong ~4h)",
      "20 lượt đẩy tin nổi bật / tháng",
      "Tối đa 3 tài khoản nhận tiền (QR)",
      "Badge \"Đại lý xác thực\"",
    ],
  },
};

export const PLAN_ORDER: PlanId[] = ["free", "pro", "business"];

export function getPlanPrice(planId: PlanId, cycle: BillingCycle): number {
  const plan = PLANS[planId];
  return cycle === "yearly" ? plan.yearlyPrice : plan.monthlyPrice;
}

export function formatVnd(amount: number): string {
  return amount.toLocaleString("vi-VN") + "đ";
}

/**
 * Chủ tin có được hiển thị badge "đã xác thực" không — dựa vào gói còn hiệu lực.
 * Thuần (không đụng DB) nên dùng được cả ở client component.
 */
export function isVerifiedPlan(
  plan: string | null | undefined,
  planExpiresAt: string | Date | null | undefined
): boolean {
  if (!plan || plan === "free") return false;
  if (planExpiresAt && new Date(planExpiresAt).getTime() < Date.now()) return false;
  return PLANS[plan as PlanId]?.verifiedBadge ?? false;
}
