import { auth } from "@/lib/auth/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import Image from "next/image";
import { Car, Calendar, MapPin, ArrowLeft, ShieldCheck, QrCode, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice, formatDate } from "@/lib/utils";
import { ConfirmTransferButton } from "@/components/booking/confirm-transfer-button";
import { getServerDictionary, getServerLocale } from "@/lib/i18n/server";
import { cityLabel } from "@/lib/constants";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  return { title: getServerDictionary().meta.payment };
}

export default async function PaymentPage({ params }: { params: { bookingId: string } }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const c = getServerDictionary().checkout;
  const locale = getServerLocale();

  const booking = await db.booking.findUnique({
    where: { id: params.bookingId, buyerId: session.user.id },
    include: {
      listing: {
        include: {
          images: { take: 1, orderBy: { order: "asc" } },
          brand: true,
          model: true,
          user: {
            select: {
              name: true, phone: true, paymentQrUrl: true, bankAccountInfo: true,
              paymentQrs: { select: { id: true, qrUrl: true, bankInfo: true, label: true } },
            },
          },
        },
      },
      payment: true,
    },
  });

  if (!booking) notFound();
  if (booking.status === "paid" || booking.payment?.status === "success") redirect("/payment/success");
  if (booking.status !== "confirmed") redirect("/dashboard/bookings");

  const depositAmount = Number(booking.depositAmount);
  const totalAmount = Number(booking.totalAmount);
  const remainingAmount = totalAmount - depositAmount;
  const thumbnail = booking.listing.images[0]?.thumbnailUrl || booking.listing.images[0]?.url;
  const seller = booking.listing.user;
  const transferNote = `FAST ${booking.id.slice(0, 8).toUpperCase()} ${session.user.name || ""}`.trim();

  // Gộp cổng mặc định + các cổng bổ sung (Business) để người mua chọn
  const channels: { qrUrl: string; bankInfo: string | null; label: string | null; primary: boolean }[] = [
    ...(seller.paymentQrUrl
      ? [{ qrUrl: seller.paymentQrUrl, bankInfo: seller.bankAccountInfo, label: null, primary: true }]
      : []),
    ...seller.paymentQrs.map((q) => ({ qrUrl: q.qrUrl, bankInfo: q.bankInfo, label: q.label, primary: false })),
  ];

  return (
    <div className="container max-w-4xl py-8">
      <Link href="/dashboard/bookings" className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        {c.back}
      </Link>

      <h1 className="mb-6 text-2xl font-bold">{c.title}</h1>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Left */}
        <div className="lg:col-span-3 space-y-4">
          {/* Car info */}
          <div className="rounded-lg border p-4">
            <h2 className="mb-3 font-semibold text-sm text-muted-foreground uppercase tracking-wide">{c.carInfo}</h2>
            <div className="flex gap-4">
              {thumbnail ? (
                <img src={thumbnail} alt={booking.listing.title} className="h-24 w-32 rounded-md object-cover flex-shrink-0" />
              ) : (
                <div className="flex h-24 w-32 flex-shrink-0 items-center justify-center rounded-md bg-muted">
                  <Car className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold line-clamp-2">{booking.listing.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {booking.listing.brand.name} {booking.listing.model.name} • {booking.listing.year}
                </p>
                {booking.listing.city && (
                  <div className="mt-1.5 flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" /> {cityLabel(booking.listing.city, locale)}
                  </div>
                )}
                <Link href={`/xe/${booking.listing.slug}`} className="mt-2 inline-block text-xs text-primary hover:underline">
                  {c.viewListing}
                </Link>
              </div>
            </div>
          </div>

          {/* Booking period */}
          <div className="rounded-lg border p-4">
            <h2 className="mb-3 font-semibold text-sm text-muted-foreground uppercase tracking-wide">{c.rentalPeriod}</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-start gap-2">
                <Calendar className="mt-0.5 h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">{c.pickup}</p>
                  <p className="font-medium">{formatDate(booking.startDate)}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Calendar className="mt-0.5 h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">{c.dropoff}</p>
                  <p className="font-medium">{formatDate(booking.endDate)}</p>
                </div>
              </div>
            </div>
            <div className="mt-3 rounded-md bg-muted px-3 py-2 text-sm">
              {c.totalDays.split("{days}")[0]}<strong>{booking.totalDays}</strong>{c.totalDays.split("{days}")[1]}
            </div>
          </div>

          {/* Payment QR */}
          <div className="rounded-lg border p-4">
            <h2 className="mb-3 font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
              <QrCode className="h-4 w-4" />
              {c.depositTransfer}
            </h2>

            {channels.length > 0 ? (
              <div className="space-y-4">
                {/* Số tiền + nội dung (dùng chung mọi cổng) */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-md bg-primary/5 border border-primary/20 px-3 py-2">
                    <p className="text-xs text-muted-foreground mb-0.5">{c.amountToTransfer}</p>
                    <p className="text-lg font-bold text-primary">{formatPrice(depositAmount)}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{c.depositNote}</p>
                  </div>
                  <div className="rounded-md bg-muted px-3 py-2">
                    <p className="text-xs text-muted-foreground mb-0.5">{c.transferContent}</p>
                    <p className="text-sm font-mono font-semibold">{transferNote}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{c.transferContentHint}</p>
                  </div>
                </div>

                {/* Các cổng nhận tiền */}
                <div>
                  <p className="text-xs text-muted-foreground mb-2">
                    {channels.length > 1
                      ? c.chooseChannel.replace("{n}", String(channels.length))
                      : c.scanQr}
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {channels.map((ch, i) => (
                      <div key={i} className="rounded-lg border p-3 flex gap-3 items-start">
                        <div className="flex-shrink-0 rounded-md border bg-white p-1">
                          <Image src={ch.qrUrl} alt="QR" width={110} height={110} className="object-contain" unoptimized />
                        </div>
                        <div className="min-w-0 text-sm">
                          <p className="font-medium">{ch.label || (ch.primary ? c.defaultChannel : c.channelN.replace("{n}", String(i + 1)))}</p>
                          {ch.bankInfo && <p className="text-xs text-muted-foreground break-words mt-0.5">{ch.bankInfo}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-start gap-2 rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-800">
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <span>{c.afterTransfer}</span>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2 rounded-md bg-muted px-3 py-3 text-sm text-muted-foreground">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>{c.noQr}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right — Summary */}
        <div className="lg:col-span-2">
          <div className="sticky top-6 rounded-lg border p-4 space-y-4">
            <h2 className="font-semibold">{c.summary}</h2>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{c.pricePerDay}</span>
                <span>{formatPrice(Number(booking.pricePerDay))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{c.numDays}</span>
                <span>{booking.totalDays} {c.daysUnit}</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-medium">
                <span>{c.totalRent}</span>
                <span>{formatPrice(totalAmount)}</span>
              </div>
            </div>

            <div className="rounded-md bg-primary/10 border border-primary/20 p-3 space-y-1">
              <div className="flex justify-between text-sm font-semibold text-primary">
                <span>{c.depositNow}</span>
                <span>{formatPrice(depositAmount)}</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{c.payOnPickup}</span>
                <span>{formatPrice(remainingAmount)}</span>
              </div>
            </div>

            <div className="space-y-2">
              <ConfirmTransferButton bookingId={booking.id} hasQr={channels.length > 0} />
              <Button variant="outline" className="w-full" asChild>
                <Link href="/dashboard/bookings">{c.cancel}</Link>
              </Button>
            </div>

            <div className="border-t pt-3 space-y-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
                {c.protected}
              </div>
            </div>

            <Badge variant="secondary" className="w-full justify-center text-xs">
              {c.bookingCode.replace("{code}", booking.id.slice(0, 8).toUpperCase())}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
