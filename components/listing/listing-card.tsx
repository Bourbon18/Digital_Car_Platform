import Image from "next/image";
import Link from "next/link";
import { MapPin, Star, Gauge, Sparkles, BadgeCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatPrice } from "@/lib/utils";
import { isVerifiedPlan } from "@/lib/plans";

interface ListingCardProps {
  listing: {
    id: string;
    slug: string;
    title: string;
    year: number;
    mileage?: number | null;
    price: number | string;
    pricePerDay?: number | string | null;
    listingType: string;
    condition: string;
    city: string;
    averageRating?: number | null;
    reviewCount?: number | null;
    featured?: boolean | null;
    featuredUntil?: string | Date | null;
    images: { url: string; thumbnailUrl?: string | null }[];
    brand: { name: string };
    model: { name: string };
    user: { name?: string | null; role: string; plan?: string | null; planExpiresAt?: string | Date | null };
  };
  labels: {
    forRent: string; forSale: string; dealer: string; featured: string;
    verified: string; perDay: string; noImage: string; condNew: string;
  };
}

export function ListingCard({ listing, labels }: ListingCardProps) {
  const thumbnail = listing.images[0]?.thumbnailUrl || listing.images[0]?.url;
  const isForRent = listing.listingType === "for_rent";
  const isDealer = listing.user.role === "dealer";
  const isVerified = isVerifiedPlan(listing.user.plan, listing.user.planExpiresAt);
  const isFeatured =
    !!listing.featured &&
    !!listing.featuredUntil &&
    new Date(listing.featuredUntil).getTime() > Date.now();

  return (
    <Link href={`/xe/${listing.slug}`}>
      <Card className={`overflow-hidden hover:shadow-md transition-shadow group ${isFeatured ? "border-amber-300 ring-1 ring-amber-200" : ""}`}>
        <div className="relative aspect-[4/3] bg-muted overflow-hidden">
          {thumbnail ? (
            <Image
              src={thumbnail}
              alt={listing.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
              {labels.noImage}
            </div>
          )}
          <div className="absolute top-2 left-2 right-2">
            <div className={`flex flex-wrap gap-1 ${isFeatured ? "pr-[5.5rem]" : ""}`}>
              <Badge variant={isForRent ? "default" : "secondary"}>
                {isForRent ? labels.forRent : labels.forSale}
              </Badge>
              {isDealer && <Badge variant="outline" className="bg-white/90">{labels.dealer}</Badge>}
              {isVerified && (
                <Badge className="bg-green-600 hover:bg-green-700 gap-1">
                  <BadgeCheck className="h-3 w-3" /> {labels.verified}
                </Badge>
              )}
              {listing.condition === "new" && (
                <Badge className="bg-blue-600 hover:bg-blue-700">{labels.condNew}</Badge>
              )}
            </div>
            {isFeatured && (
              <Badge className="bg-amber-500 hover:bg-amber-600 gap-1 absolute top-0 right-0">
                <Sparkles className="h-3 w-3" /> {labels.featured}
              </Badge>
            )}
          </div>
        </div>

        <CardContent className="p-3">
          <h3 className="font-semibold text-sm line-clamp-2 mb-1 group-hover:text-primary transition-colors">
            {listing.title}
          </h3>

          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
            <span>{listing.year}</span>
            {listing.mileage != null && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Gauge className="h-3 w-3" />
                  {listing.mileage.toLocaleString("vi-VN")} km
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
            <MapPin className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{listing.city}</span>
          </div>

          <div className="flex items-end justify-between mt-auto">
            <div>
              <div className="font-bold text-primary text-base">
                {formatPrice(Number(isForRent ? listing.pricePerDay : listing.price))}
                {isForRent && <span className="text-xs font-normal text-muted-foreground">{labels.perDay}</span>}
              </div>
            </div>
            {listing.averageRating != null && (
              <div className="flex items-center gap-1 text-xs">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <span>{listing.averageRating.toFixed(1)}</span>
                <span className="text-muted-foreground">({listing.reviewCount})</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
