import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatPrice, formatDate } from "@/lib/utils";
import { canCreateListing } from "@/lib/auth/rbac";
import { BookingActionButtons } from "@/components/booking/booking-action-buttons";
import { getServerDictionary } from "@/lib/i18n/server";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  return { title: getServerDictionary().meta.rentals };
}

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "success" | "destructive" | "warning"> = {
  pending: "warning", confirmed: "default", paid: "success",
  active: "success", completed: "secondary", rejected: "destructive", cancelled: "secondary",
};

export default async function RentalsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!canCreateListing(session.user.role)) redirect("/dashboard");
  const M = getServerDictionary().mine;
  const STATUS_LABELS: Record<string, string> = {
    pending: M.stPendingReview, confirmed: M.stConfirmed, paid: M.stPaid,
    active: M.stActive, completed: M.stCompleted, rejected: M.stRejected, cancelled: M.stCancelled,
  };

  const bookings = await db.booking.findMany({
    where: { listing: { userId: session.user.id } },
    include: {
      listing: { select: { title: true, slug: true } },
      buyer: { select: { name: true, email: true, phone: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{M.rentalsTitle}</h1>

      {bookings.length === 0 ? (
        <div className="text-center py-16 border rounded-lg">
          <p className="text-muted-foreground">{M.rentalsEmpty}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div key={booking.id} className="rounded-lg border p-4 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Link href={`/xe/${booking.listing.slug}`} className="font-medium hover:text-primary">{booking.listing.title}</Link>
                  <div className="text-sm text-muted-foreground mt-0.5">
                    {M.customer}: {booking.buyer.name || booking.buyer.email}
                    {booking.buyer.phone && ` · ${booking.buyer.phone}`}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatDate(booking.startDate)} → {formatDate(booking.endDate)} ({booking.totalDays} {M.days})
                  </div>
                  <div className="text-sm font-medium">{formatPrice(Number(booking.totalAmount))}</div>
                </div>
                <Badge variant={STATUS_VARIANTS[booking.status] || "secondary"}>{STATUS_LABELS[booking.status] || booking.status}</Badge>
              </div>

              {booking.status !== "cancelled" && booking.status !== "rejected" && booking.status !== "completed" && (
                <div className="pt-2 border-t">
                  <BookingActionButtons booking={booking} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
