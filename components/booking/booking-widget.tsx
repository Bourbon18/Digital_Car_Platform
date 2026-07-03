"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { calculateRentalPrice, formatPrice } from "@/lib/utils";
import { createBooking } from "@/lib/actions/bookings";
import { useI18n } from "@/components/i18n/language-provider";

interface BookingWidgetProps {
  listing: {
    id: string;
    pricePerDay: number;
    weeklyDiscount: boolean;
    pickupLocation?: string;
  };
  isLoggedIn: boolean;
  isOwner: boolean;
}

export function BookingWidget({ listing, isLoggedIn, isOwner }: BookingWidgetProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useI18n();
  const c = t.car;
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  const priceInfo =
    startDate && endDate && new Date(endDate) > new Date(startDate)
      ? calculateRentalPrice(
          listing.pricePerDay,
          new Date(startDate),
          new Date(endDate),
          listing.weeklyDiscount
        )
      : null;

  async function handleBook() {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }
    if (!startDate || !endDate) return;

    setLoading(true);
    try {
      const result = await createBooking(
        listing.id,
        new Date(startDate),
        new Date(endDate),
        listing.pickupLocation
      );

      if (result.error) {
        toast({ title: typeof result.error === "string" ? result.error : c.bookError, variant: "destructive" });
      } else {
        toast({ title: c.bookSuccess });
        router.push(`/dashboard/bookings`);
      }
    } finally {
      setLoading(false);
    }
  }

  if (isOwner) {
    return (
      <div className="rounded-lg border p-4 text-center text-sm text-muted-foreground">
        {c.ownCar}
      </div>
    );
  }

  return (
    <div className="rounded-lg border p-4 space-y-4">
      <h3 className="font-semibold">{c.bookTitle}</h3>

      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="start-date">{c.pickupDate}</Label>
          <Input
            id="start-date"
            type="date"
            min={minDate}
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="end-date">{c.returnDate}</Label>
          <Input
            id="end-date"
            type="date"
            min={startDate || minDate}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </div>

      {priceInfo && (
        <div className="rounded-md bg-muted p-3 space-y-1 text-sm">
          <div className="flex justify-between">
            <span>{formatPrice(listing.pricePerDay)} × {priceInfo.totalDays} {c.days}</span>
            <span>{formatPrice(listing.pricePerDay * priceInfo.totalDays)}</span>
          </div>
          {priceInfo.discountApplied && (
            <div className="flex justify-between text-green-600">
              <span>{c.discount10}</span>
              <span>-{formatPrice(priceInfo.savedAmount)}</span>
            </div>
          )}
          <div className="flex justify-between font-semibold border-t pt-1 mt-1">
            <span>{c.total}</span>
            <span>{formatPrice(priceInfo.totalPrice)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>{c.deposit30}</span>
            <span>{formatPrice(priceInfo.totalPrice * 0.3)}</span>
          </div>
        </div>
      )}

      <Button
        className="w-full"
        onClick={handleBook}
        disabled={loading || !startDate || !endDate || !priceInfo}
      >
        {!isLoggedIn ? c.loginToBook : loading ? c.processing : c.bookNow}
      </Button>
    </div>
  );
}
