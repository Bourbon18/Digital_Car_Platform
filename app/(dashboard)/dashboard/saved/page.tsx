import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { getServerDictionary } from "@/lib/i18n/server";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  return { title: getServerDictionary().meta.saved };
}

export default async function SavedListingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const M = getServerDictionary().mine;

  const saved = await db.savedListing.findMany({
    where: { userId: session.user.id },
    include: {
      listing: {
        include: { images: { take: 1, orderBy: { order: "asc" } }, brand: true, model: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{M.savedTitle} ({saved.length})</h1>

      {saved.length === 0 ? (
        <div className="text-center py-16 border rounded-lg">
          <p className="text-muted-foreground mb-4">{M.savedEmpty}</p>
          <Link href="/mua-xe" className="text-primary hover:underline">{M.findCars}</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {saved.map(({ listing }) => {
            const isActive = listing.status === "active";
            return (
              <div key={listing.id} className={`rounded-lg border overflow-hidden ${!isActive ? "opacity-60" : ""}`}>
                <div className="relative h-40 bg-muted">
                  {listing.images[0] && (
                    <img src={listing.images[0].thumbnailUrl || listing.images[0].url} alt={listing.title} className="w-full h-full object-cover" />
                  )}
                  {!isActive && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <Badge variant="secondary">{listing.status === "deleted" ? M.deleted : M.unavailable}</Badge>
                    </div>
                  )}
                </div>
                <div className="p-3 space-y-1">
                  <p className="text-sm font-medium line-clamp-2">
                    {isActive ? <Link href={`/xe/${listing.slug}`} className="hover:text-primary">{listing.title}</Link> : listing.title}
                  </p>
                  <p className="text-sm text-primary font-semibold">{formatPrice(Number(listing.price))}</p>
                  <p className="text-xs text-muted-foreground">{listing.city}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
