"use client";

import { useRouter } from "next/navigation";
import { useI18n } from "@/components/i18n/language-provider";

export function PaymentButton({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const { t } = useI18n();

  return (
    <button
      onClick={() => router.push(`/payment/${bookingId}`)}
      className="text-xs bg-primary text-white px-3 py-1.5 rounded hover:bg-primary/90"
    >
      {t.mine.pay}
    </button>
  );
}
