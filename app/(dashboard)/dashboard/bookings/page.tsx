import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatPrice, formatDate } from "@/lib/utils";
import { CancelBookingButton } from "@/components/booking/cancel-booking-button";
import { PaymentButton } from "@/components/booking/payment-button";
import { getServerDictionary } from "@/lib/i18n/server";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  return { title: getServerDictionary().meta.bookings };
}

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "success" | "destructive" | "warning"> = {
  pending: "warning", confirmed: "default", paid: "success",
  active: "success", completed: "secondary", rejected: "destructive", cancelled: "secondary",
};

export default async function BookingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const M = getServerDictionary().mine;
  const STATUS_LABELS: Record<string, string> = {
    pending: M.stPending, confirmed: M.stConfirmed, paid: M.stPaid,
    active: M.stActive, completed: M.stCompleted, rejected: M.stRejected, cancelled: M.stCancelled,
  };

  const bookings = await db.booking.findMany({
    where: { buyerId: session.user.id },
    include: {
      listing: {
        include: { images: { take: 1, orderBy: { order: "asc" } }, brand: true, model: true },
      },
      payment: true,
      review: { select: { id: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{M.bookingsTitle}</h1>

      {bookings.length === 0 ? (
        <div className="text-center py-16 border rounded-lg">
          <p className="text-muted-foreground mb-4">{M.bookingsEmpty}</p>
          <Link href="/thue-xe" className="text-primary hover:underline">{M.findToRent}</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div key={booking.id} className="rounded-lg border p-4 space-y-3">
              <div className="flex items-start gap-4">
                {booking.listing.images[0] ? (
                  <img src={booking.listing.images[0].thumbnailUrl || booking.listing.images[0].url} alt="" className="h-16 w-24 rounded object-cover flex-shrink-0" />
                ) : (
                  <div className="h-16 w-24 rounded bg-muted flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <Link href={`/xe/${booking.listing.slug}`} className="font-medium hover:text-primary line-clamp-1">
                    {booking.listing.title}
                  </Link>
                  <div className="text-sm text-muted-foreground mt-0.5">
                    {formatDate(booking.startDate)} → {formatDate(booking.endDate)} ({booking.totalDays} {M.days})
                  </div>
                  <div className="text-sm font-medium mt-0.5">{formatPrice(Number(booking.totalAmount))}</div>
                </div>
                <Badge variant={STATUS_VARIANTS[booking.status] || "secondary"}>{STATUS_LABELS[booking.status] || booking.status}</Badge>
              </div>

              <div className="flex items-center justify-between pt-1 border-t">
                <div className="text-xs text-muted-foreground">{M.bookedOn} {formatDate(booking.createdAt)}</div>
                <div className="flex gap-2">
                  {booking.status === "confirmed" && (
                    <PaymentButton bookingId={booking.id} />
                  )}
                  {["pending", "confirmed"].includes(booking.status) && (
                    <CancelBookingButton bookingId={booking.id} />
                  )}
                  {booking.status === "completed" && !booking.review && (
                    <Link href={`/xe/${booking.listing.slug}#review`} className="text-xs border px-3 py-1.5 rounded hover:bg-muted">
                      {M.writeReview}
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
