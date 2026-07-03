import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice, formatDate } from "@/lib/utils";
import { canCreateListing } from "@/lib/auth/rbac";
import { getFeaturedQuota } from "@/lib/actions/featured";
import { BoostListingButton } from "@/components/listing/boost-listing-button";
import { Sparkles } from "lucide-react";
import { getServerDictionary } from "@/lib/i18n/server";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  return { title: getServerDictionary().meta.myListings };
}

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "success" | "destructive" | "warning"> = {
  draft: "secondary", pending: "warning", active: "success", rejected: "destructive", deleted: "secondary",
};

export default async function MyListingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!canCreateListing(session.user.role)) redirect("/dashboard");
  const M = getServerDictionary().mine;
  const STATUS_LABELS: Record<string, string> = {
    draft: M.lsDraft, pending: M.lsPending, active: M.lsActive,
    rejected: M.lsRejected, deleted: M.lsDeleted,
  };

  const [listings, quota] = await Promise.all([
    db.listing.findMany({
      where: { userId: session.user.id, status: { not: "deleted" } },
      include: { brand: true, model: true, images: { take: 1, orderBy: { order: "asc" } } },
      orderBy: { createdAt: "desc" },
    }),
    getFeaturedQuota(session.user.id),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{M.listingsTitle}</h1>
        <Button asChild><Link href="/dang-tin">{M.postNew}</Link></Button>
      </div>

      {/* Quota đẩy tin nổi bật */}
      <div className="flex items-center justify-between gap-4 rounded-lg border bg-amber-50/50 px-4 py-3">
        <div className="flex items-center gap-2 text-sm">
          <Sparkles className="h-4 w-4 text-amber-500" />
          {quota.limit > 0 ? (
            <span>
              {M.boostThisMonth}{" "}
              <strong>{quota.remaining}/{quota.limit}</strong> {M.remainingWord} ({quota.planName})
            </span>
          ) : (
            <span className="text-muted-foreground">
              {M.boostNone.replace("{plan}", quota.planName)}
            </span>
          )}
        </div>
        {quota.limit === 0 && (
          <Button asChild size="sm" variant="outline">
            <Link href="/dashboard/subscription">{M.upgradePlan}</Link>
          </Button>
        )}
      </div>

      {listings.length === 0 ? (
        <div className="text-center py-16 border rounded-lg">
          <p className="text-muted-foreground mb-4">{M.listingsEmpty}</p>
          <Button asChild><Link href="/dang-tin">{M.postNow}</Link></Button>
        </div>
      ) : (
        <div className="space-y-3">
          {listings.map((listing) => (
            <div key={listing.id} className="flex items-center gap-4 rounded-lg border p-4">
              {listing.images[0] ? (
                <img src={listing.images[0].thumbnailUrl || listing.images[0].url} alt={listing.title} className="h-16 w-24 rounded object-cover flex-shrink-0" />
              ) : (
                <div className="h-16 w-24 rounded bg-muted flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <Link href={`/xe/${listing.slug}`} className="font-medium hover:text-primary line-clamp-1">{listing.title}</Link>
                <div className="text-sm text-muted-foreground mt-0.5">
                  {listing.listingType === "for_rent"
                    ? `${formatPrice(Number(listing.pricePerDay))}${M.perDaySuffix}`
                    : formatPrice(Number(listing.price))}{" "}
                  · {listing.city}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">{formatDate(listing.createdAt)}</div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge variant={STATUS_VARIANTS[listing.status] || "secondary"}>{STATUS_LABELS[listing.status] || listing.status}</Badge>
                <div className="flex gap-3 text-xs text-muted-foreground">
                  <span>{listing.viewCount} {M.views}</span>
                  <span>{listing.contactCount} {M.contacts}</span>
                </div>
                {listing.status === "active" && (
                  <BoostListingButton
                    listingId={listing.id}
                    featuredUntil={listing.featuredUntil ? listing.featuredUntil.toISOString() : null}
                    remaining={quota.remaining}
                  />
                )}
                {listing.rejectionReason && (
                  <p className="text-xs text-destructive max-w-[200px] text-right">{listing.rejectionReason}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
