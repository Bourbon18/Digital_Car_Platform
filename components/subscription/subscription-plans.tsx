"use client";

import { useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Check, Crown, Upload, Clock, AlertTriangle } from "lucide-react";
import {
  PLANS,
  PLAN_ORDER,
  getPlanPrice,
  formatVnd,
  type PlanId,
  type BillingCycle,
} from "@/lib/plans";
import {
  requestSubscription,
  submitSubscriptionProof,
  cancelSubscription,
  cancelActivePlan,
} from "@/lib/actions/subscriptions";
import { useI18n } from "@/components/i18n/language-provider";

interface Pending {
  id: string;
  plan: string;
  billingCycle: string;
  amount: number;
  hasProof: boolean;
}

interface Props {
  currentPlan: PlanId;
  currentCycle: string | null;
  planExpiresAt: string | null;
  platformBankInfo: string;
  platformQrUrl: string;
  pending: Pending | null;
}

interface Flow {
  subscriptionId: string;
  plan: PlanId;
  amount: number;
}

export function SubscriptionPlans({ currentPlan, currentCycle, planExpiresAt, platformBankInfo, platformQrUrl, pending }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const { t, locale } = useI18n();
  const S = t.sub;
  const fileRef = useRef<HTMLInputElement>(null);

  const [cycle, setCycle] = useState<BillingCycle>(
    (pending?.billingCycle as BillingCycle) || "monthly"
  );
  const [flow, setFlow] = useState<Flow | null>(
    pending ? { subscriptionId: pending.id, plan: pending.plan as PlanId, amount: pending.amount } : null
  );
  // Gói đang được "chọn" (highlight) nhưng CHƯA vào bước thanh toán.
  const [selected, setSelected] = useState<PlanId | null>(
    pending ? (pending.plan as PlanId) : null
  );
  const [choosing, setChoosing] = useState<PlanId | null>(null);
  const [proof, setProof] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(!!pending?.hasProof);
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  // Portal chỉ render sau khi mount (tránh lỗi document undefined khi SSR)
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  async function handleChoose(plan: PlanId) {
    setChoosing(plan);
    const res = await requestSubscription(plan, cycle);
    setChoosing(null);
    if (res.error) {
      toast({ title: S.errTitle, description: res.error as string, variant: "destructive" });
      return;
    }
    setFlow({ subscriptionId: res.subscriptionId!, plan, amount: res.amount! });
    setProof(null);
    setSubmitted(false);
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: S.onlyImage, variant: "destructive" });
      e.target.value = "";
      return;
    }
    if (file.size >= 1024 * 1024) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      toast({
        title: S.imgTooLarge,
        description: S.imgTooLargeDesc.replace("{size}", sizeMb),
        variant: "destructive",
      });
      e.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => setProof(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSubmitProof() {
    if (!flow || !proof) {
      toast({ title: S.needProof, variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const res = await submitSubscriptionProof(flow.subscriptionId, proof);
    setSubmitting(false);
    if (res.error) {
      toast({ title: S.errTitle, description: res.error as string, variant: "destructive" });
      return;
    }
    setSubmitted(true);
    toast({ title: S.proofSent });
    router.refresh();
  }

  async function handleCancel() {
    if (flow) await cancelSubscription(flow.subscriptionId);
    setFlow(null);
    setSelected(null);
    setProof(null);
    setSubmitted(false);
    toast({ title: S.cancelled });
    router.refresh();
  }

  const expiryText = planExpiresAt
    ? new Date(planExpiresAt).toLocaleDateString(locale === "en" ? "en-GB" : "vi-VN")
    : null;

  // Số ngày còn lại của gói đang dùng (để cảnh báo khi hủy)
  const remainingDays = planExpiresAt
    ? Math.max(0, Math.ceil((new Date(planExpiresAt).getTime() - Date.now()) / 86_400_000))
    : 0;
  const hasActivePaid = currentPlan !== "free";

  async function confirmCancelPlan() {
    setCancelling(true);
    const res = await cancelActivePlan();
    setCancelling(false);
    if (res.error) {
      toast({ title: S.errTitle, description: res.error as string, variant: "destructive" });
      return;
    }
    setConfirmingCancel(false);
    setFlow(null);
    setSelected(null);
    toast({ title: S.cancelledPlan });
    router.refresh();
  }

  return (
    <div className="space-y-8">
      {/* Trạng thái gói hiện tại */}
      <div className="rounded-lg border bg-muted/30 px-4 py-3 flex items-center gap-3">
        <Crown className="h-5 w-5 text-primary flex-shrink-0" />
        <div className="text-sm flex-1">
          {S.currentPlan} <strong>{PLANS[currentPlan].name}</strong>
          {currentPlan !== "free" && currentCycle && (
            <span className="text-muted-foreground">
              {" "}({currentCycle === "yearly" ? S.perYearLabel : S.perMonthLabel})
            </span>
          )}
          {currentPlan !== "free" && expiryText && (
            <span className="text-muted-foreground"> — {S.validUntil} {expiryText}</span>
          )}
        </div>
        {hasActivePaid && !flow && (
          <Button
            variant="outline"
            size="sm"
            className="text-destructive border-destructive hover:bg-destructive/5 flex-shrink-0"
            onClick={() => setConfirmingCancel(true)}
          >
            {S.cancelPlan}
          </Button>
        )}
      </div>

      {/* Toggle chu kỳ */}
      <div className="flex items-center justify-center gap-1 rounded-full border p-1 w-fit mx-auto">
        {(["monthly", "yearly"] as BillingCycle[]).map((c) => (
          <button
            key={c}
            onClick={() => setCycle(c)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              cycle === c ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {c === "monthly" ? S.cycleMonthly : S.cycleYearly}
          </button>
        ))}
      </div>

      {/* Thẻ gói */}
      <div className="grid gap-4 md:grid-cols-3">
        {PLAN_ORDER.map((id) => {
          const plan = PLANS[id];
          const price = getPlanPrice(id, cycle);
          const isCurrentPlan = currentPlan === id;
          // "Đang sử dụng" chỉ khi trùng cả gói LẪN chu kỳ đang chọn.
          const isCurrentExact = isCurrentPlan && currentCycle === cycle;
          const isHighlight = id === "pro";
          // Đang có gói trả phí mà thẻ này là gói KHÁC → phải hủy gói cũ trước.
          const blockedDifferentPlan = hasActivePaid && id !== currentPlan && id !== "free";
          // Gói đang dùng (kể cả trùng chu kỳ) vẫn chọn được để GIA HẠN.
          const selectable = id !== "free" && !blockedDifferentPlan;
          const isSelected = selected === id;
          return (
            <div
              key={id}
              onClick={() => selectable && setSelected(id)}
              className={`rounded-xl border p-5 flex flex-col transition-all ${
                selectable ? "cursor-pointer" : ""
              } ${
                isSelected
                  ? "border-primary ring-2 ring-primary shadow-md"
                  : isHighlight
                  ? "border-primary shadow-sm ring-1 ring-primary/20"
                  : selectable
                  ? "hover:border-primary/50"
                  : ""
              }`}
            >
              <div className="mb-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold">{plan.name}</h3>
                  {isCurrentPlan && id !== "free" && (
                    <span className="rounded-full bg-green-100 text-green-700 text-xs px-2 py-0.5">{S.inUse}</span>
                  )}
                  {isHighlight && !isCurrentPlan && (
                    <span className="rounded-full bg-primary/10 text-primary text-xs px-2 py-0.5">{S.popular}</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{S.tag[id]}</p>
              </div>

              <div className="mb-4">
                {id === "free" ? (
                  <span className="text-2xl font-bold">{S.free}</span>
                ) : (
                  <>
                    <span className="text-2xl font-bold">{formatVnd(price)}</span>
                    <span className="text-sm text-muted-foreground">/{cycle === "monthly" ? S.monthShort : S.yearShort}</span>
                  </>
                )}
              </div>

              <ul className="space-y-2 mb-5 flex-1">
                {S.perks[id].map((p) => (
                  <li key={p} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>

              {id === "free" ? (
                <Button variant="outline" disabled className="w-full">
                  {S.defaultPlan}
                </Button>
              ) : blockedDifferentPlan ? (
                <Button variant="outline" disabled className="w-full text-xs">
                  {S.cancelToChange}
                </Button>
              ) : isSelected ? (
                <Button
                  className="w-full"
                  disabled={choosing !== null}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleChoose(id);
                  }}
                >
                  {choosing === id ? S.processing : S.continuePay}
                </Button>
              ) : (
                <Button
                  className="w-full"
                  variant={isHighlight || isCurrentExact ? "default" : "outline"}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelected(id);
                  }}
                >
                  {isCurrentExact
                    ? S.renew
                    : isCurrentPlan
                    ? cycle === "yearly"
                      ? S.switchYear
                      : S.switchMonth
                    : S.choosePlan}
                </Button>
              )}
            </div>
          );
        })}
      </div>

      {/* Bảng thanh toán */}
      {flow && (
        <div className="rounded-xl border p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">{S.payFor} {PLANS[flow.plan].name}</h3>
            <span className="text-lg font-bold text-primary">{formatVnd(flow.amount)}</span>
          </div>

          {submitted ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
                <Clock className="h-4 w-4 flex-shrink-0" />
                {S.proofReceived}
              </div>
              <Button variant="outline" size="sm" onClick={handleCancel}>
                {S.cancelRequest}
              </Button>
            </div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-sm font-medium">{S.step1}</p>
                  <div className="rounded-lg border p-3 text-sm space-y-1 bg-muted/20">
                    <p>{S.amount} <strong>{formatVnd(flow.amount)}</strong></p>
                    <p className="text-muted-foreground">{S.content} <span className="font-mono">GOI {flow.plan.toUpperCase()}</span></p>
                    {platformBankInfo ? (
                      <p className="whitespace-pre-line">{platformBankInfo}</p>
                    ) : (
                      <p className="text-amber-600 text-xs">
                        {S.noBankInfo}
                      </p>
                    )}
                  </div>
                  {platformQrUrl && (
                    <div className="h-40 w-40 rounded-lg border overflow-hidden bg-white">
                      <Image src={platformQrUrl} alt="QR" width={160} height={160} className="object-contain w-full h-full" unoptimized />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">{S.step2}</p>
                  <p className="text-xs text-muted-foreground">{S.imgFormat}</p>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
                  {proof ? (
                    <div className="h-40 w-40 rounded-lg border overflow-hidden bg-white">
                      <Image src={proof} alt="Proof" width={160} height={160} className="object-contain w-full h-full" unoptimized />
                    </div>
                  ) : (
                    <div
                      onClick={() => fileRef.current?.click()}
                      className="h-40 w-40 rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors"
                    >
                      <Upload className="h-8 w-8 text-muted-foreground/40" />
                      <span className="text-xs text-muted-foreground">{S.clickUpload}</span>
                    </div>
                  )}
                  {proof && (
                    <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                      {S.changeImg}
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button onClick={handleSubmitProof} disabled={submitting || !proof}>
                  {submitting ? S.sending : S.submitProof}
                </Button>
                <Button variant="outline" onClick={handleCancel} disabled={submitting}>
                  {S.cancelOrOther}
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Modal xác nhận hủy gói — render qua portal để phủ toàn màn hình (kể cả header) */}
      {confirmingCancel && mounted && createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 animate-in fade-in"
          onClick={() => !cancelling && setConfirmingCancel(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold">{S.cancelTitle.replace("{plan}", PLANS[currentPlan].name)}</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {S.backToFree}
              </p>

              <div className="mt-4 w-full rounded-xl border-2 border-red-200 bg-red-50 px-4 py-4">
                <p className="text-sm text-red-700">{S.youWillLose}</p>
                <p className="text-3xl font-extrabold text-red-600 leading-tight">
                  {remainingDays} {S.daysWord}
                </p>
                <p className="text-sm text-red-700">
                  {S.remainingUse}{expiryText ? ` (${S.until} ${expiryText})` : ""}
                </p>
              </div>

              <p className="mt-3 text-xs text-muted-foreground">
                {S.noRefund}
              </p>
            </div>

            <div className="mt-6 flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setConfirmingCancel(false)}
                disabled={cancelling}
              >
                {S.keepMyPlan}
              </Button>
              <Button
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                onClick={confirmCancelPlan}
                disabled={cancelling}
              >
                {cancelling ? S.cancellingText : S.stillCancel}
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
