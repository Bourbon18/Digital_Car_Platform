import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth/auth";
import { Badge } from "@/components/ui/badge";
import { formatPrice, formatDate } from "@/lib/utils";
import { MapPin, Star, Calendar, Gauge, Car, User, BadgeCheck } from "lucide-react";
import { isVerifiedPlan } from "@/lib/plans";
import { getServerDictionary, getServerLocale } from "@/lib/i18n/server";
import { cityLabel } from "@/lib/constants";
import { ContactSellerForm } from "@/components/listing/contact-seller-form";
import { ReviewList } from "@/components/listing/review-list";
import { ReviewForm } from "@/components/listing/review-form";
import { BookingWidget } from "@/components/booking/booking-widget";
import { SaveButton } from "@/components/listing/save-button";
import { JsonLd } from "@/components/seo/json-ld";

interface Props {
  params: { slug: string };
}

async function getListing(slug: string) {
  const listing = await db.listing.findUnique({
    where: { slug, status: "active" },
    include: {
      brand: true,
      model: true,
      images: { orderBy: { order: "asc" } },
      user: { select: { id: true, name: true, phone: true, role: true, createdAt: true, avatarUrl: true, plan: true, planExpiresAt: true } },
      reviews: {
        where: { hidden: false },
        include: { reviewer: { select: { name: true, avatarUrl: true } } },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });
  return listing;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const m = getServerDictionary().meta;
  const listing = await getListing(params.slug);
  if (!listing) return { title: m.notFound };

  const thumbnail = listing.images[0]?.url;
  const isRent = listing.listingType === "for_rent";
  const price = isRent ? listing.pricePerDay : listing.price;
  const priceText = price ? formatPrice(Number(price)) : "";

  return {
    title: `${listing.title} ${listing.year} - ${priceText}${isRent ? m.perDay : ""}`,
    description: listing.description.slice(0, 160),
    openGraph: {
      title: listing.title,
      description: listing.description.slice(0, 100),
      images: thumbnail ? [{ url: thumbnail, width: 1200, height: 630, alt: listing.title }] : [],
    },
  };
}

export default async function ListingDetailPage({ params }: Props) {
  const [listing, session] = await Promise.all([getListing(params.slug), auth()]);

  if (!listing) notFound();

  // Tìm booking đã hoàn thành & chưa đánh giá của user hiện tại cho xe này
  let reviewableBookingId: string | null = null;
  if (session?.user && session.user.id !== listing.userId) {
    const booking = await db.booking.findFirst({
      where: {
        listingId: listing.id,
        buyerId: session.user.id,
        status: "completed",
        review: null,
      },
      select: { id: true },
    });
    reviewableBookingId = booking?.id ?? null;
  }

  // Increment view count (fire and forget)
  db.listing.update({ where: { id: listing.id }, data: { viewCount: { increment: 1 } } }).catch(() => {});

  const isRent = listing.listingType === "for_rent";
  const price = isRent ? listing.pricePerDay : listing.price;
  const D = getServerDictionary().detail;
  const locale = getServerLocale();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: listing.title,
    description: listing.description,
    image: listing.images.map((i) => i.url),
    offers: {
      "@type": "Offer",
      price: Number(price),
      priceCurrency: "VND",
      availability: "https://schema.org/InStock",
    },
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <div className="container py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <div className="grid gap-2 grid-cols-4">
              <div className="col-span-4 relative aspect-video rounded-lg overflow-hidden bg-muted">
                {listing.images[0] ? (
                  <Image
                    src={listing.images[0].url}
                    alt={listing.title}
                    fill
                    className="object-cover"
                    priority
                    sizes="(max-width: 1024px) 100vw, 66vw"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">
                    <Car className="h-16 w-16" />
                  </div>
                )}
              </div>
              {listing.images.slice(1, 5).map((img) => (
                <div key={img.id} className="relative aspect-video rounded-md overflow-hidden bg-muted">
                  <Image src={img.thumbnailUrl || img.url} alt="" fill className="object-cover" sizes="25vw" />
                </div>
              ))}
            </div>

            {/* Listing info */}
            <div>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={isRent ? "default" : "secondary"}>
                      {isRent ? D.forRent : D.forSale}
                    </Badge>
                    <Badge variant={listing.condition === "new" ? "success" : "outline"}>
                      {listing.condition === "new" ? D.condNew : D.condUsed}
                    </Badge>
                  </div>
                  <h1 className="text-2xl font-bold">{listing.title}</h1>
                </div>
                {session?.user && <SaveButton listingId={listing.id} userId={session.user.id} />}
              </div>

              <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> {listing.year}</span>
                {listing.mileage != null && (
                  <span className="flex items-center gap-1"><Gauge className="h-4 w-4" /> {listing.mileage.toLocaleString("vi-VN")} km</span>
                )}
                {listing.color && <span className="flex items-center gap-1"><span className="h-4 w-4 rounded-full border" style={{ backgroundColor: listing.color }} /> {listing.color}</span>}
                <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {cityLabel(listing.city, locale)}{listing.address ? `, ${listing.address}` : ""}</span>
              </div>

              {listing.averageRating != null && (
                <div className="mt-3 flex items-center gap-2">
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold">{listing.averageRating.toFixed(1)}</span>
                  <span className="text-muted-foreground text-sm">({listing.reviewCount} {D.reviews})</span>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="rounded-lg border p-4">
              <h2 className="font-semibold mb-3">{D.description}</h2>
              <p className="text-sm leading-relaxed whitespace-pre-line">{listing.description}</p>
            </div>

            {/* Seller info */}
            <div className="rounded-lg border p-4">
              <h2 className="font-semibold mb-3">{D.sellerInfo}</h2>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  {listing.user.avatarUrl ? (
                    <Image src={listing.user.avatarUrl} alt="" width={48} height={48} className="rounded-full" />
                  ) : (
                    <User className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <div className="font-medium flex items-center gap-1.5 flex-wrap">
                    {listing.user.name}
                    {isVerifiedPlan(listing.user.plan, listing.user.planExpiresAt) && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 text-green-700 text-xs font-medium px-2 py-0.5">
                        <BadgeCheck className="h-3.5 w-3.5" /> {D.verifiedDealer}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {listing.user.role === "dealer" ? D.officialDealer : D.individual} •{" "}
                    {D.joined} {formatDate(listing.user.createdAt)}
                  </div>
                </div>
              </div>
            </div>

            {/* Review form — chỉ hiện khi user có booking đã hoàn thành & chưa đánh giá */}
            {reviewableBookingId && <ReviewForm bookingId={reviewableBookingId} />}

            {/* Reviews */}
            <ReviewList reviews={listing.reviews} listingId={listing.id} currentUserId={session?.user?.id} />

            {/* Contact / message form */}
            <ContactSellerForm
              listingId={listing.id}
              sellerId={listing.user.id}
              sellerPhone={listing.user.phone}
              isLoggedIn={!!session?.user}
              label={isRent ? D.contactRentLabel : D.contactSaleLabel}
              placeholder={isRent ? D.contactRentPlaceholder : D.contactSalePlaceholder}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="sticky top-24">
              <div className="rounded-lg border p-4 mb-4">
                <div className="text-3xl font-bold text-primary">
                  {formatPrice(Number(price))}
                  {isRent && <span className="text-base font-normal text-muted-foreground">{D.perDay}</span>}
                </div>
                {listing.weeklyDiscount && (
                  <p className="text-sm text-green-600 mt-1">✓ {D.weeklyDiscount}</p>
                )}
              </div>

              {isRent ? (
                <BookingWidget
                  listing={{
                    id: listing.id,
                    pricePerDay: Number(listing.pricePerDay),
                    weeklyDiscount: listing.weeklyDiscount,
                    pickupLocation: listing.address || listing.city,
                  }}
                  isLoggedIn={!!session?.user}
                  isOwner={session?.user?.id === listing.userId}
                />
              ) : (
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-3">
                    {D.contactForPrice}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
