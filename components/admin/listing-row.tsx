"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { AdminListingActions } from "@/components/admin/listing-actions";
import { formatPrice, formatDate } from "@/lib/utils";
import { ChevronDown, ChevronUp, MapPin, Car, User, Phone } from "lucide-react";

type ListingWithRelations = {
  id: string;
  title: string;
  slug: string;
  listingType: string;
  condition: string;
  price: unknown;
  pricePerDay: unknown;
  weeklyDiscount: boolean;
  year: number;
  mileage: number | null;
  color: string | null;
  city: string | null;
  address: string | null;
  description: string | null;
  createdAt: Date;
  priorityReview: boolean;
  brand: { name: string };
  model: { name: string };
  user: { name: string | null; email: string; phone: string | null };
  images: { url: string; thumbnailUrl: string | null }[];
};

export function AdminListingRow({ listing, status }: { listing: ListingWithRelations; status: string }) {
  const [expanded, setExpanded] = useState(false);

  const displayPrice = listing.listingType === "for_rent"
    ? `${formatPrice(Number(listing.pricePerDay))}/ngày`
    : formatPrice(Number(listing.price));

  return (
    <div className="rounded-lg border overflow-hidden">
      {/* Summary row — click to expand */}
      <div
        className="flex items-start gap-4 p-4 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        {listing.images[0] ? (
          <img
            src={listing.images[0].thumbnailUrl || listing.images[0].url}
            alt=""
            className="h-16 w-24 rounded object-cover flex-shrink-0"
          />
        ) : (
          <div className="h-16 w-24 rounded bg-muted flex-shrink-0 flex items-center justify-center">
            <Car className="h-6 w-6 text-muted-foreground" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <p className="font-medium line-clamp-1">{listing.title}</p>
          <p className="text-sm text-muted-foreground">
            {listing.user.name || listing.user.email} · {formatDate(listing.createdAt)}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-sm text-primary font-medium">{displayPrice}</p>
            <span className="text-xs text-muted-foreground border rounded px-1.5 py-0.5">
              {listing.listingType === "for_rent" ? "Cho thuê" : "Bán xe"}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          {listing.priorityReview && status === "pending" && (
            <Badge variant="warning">⚡ Ưu tiên</Badge>
          )}
          <Badge>{status}</Badge>
          <span className="text-muted-foreground">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </span>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t bg-muted/20 p-5 space-y-5">
          {/* Images */}
          {listing.images.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Ảnh xe ({listing.images.length})</p>
              <div className="flex gap-2 flex-wrap">
                {listing.images.map((img, i) => (
                  <img
                    key={i}
                    src={img.thumbnailUrl || img.url}
                    alt=""
                    className="h-28 w-40 rounded-md object-cover border"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Thông tin xe</p>
              <div className="space-y-1">
                <p><span className="text-muted-foreground">Hãng / Model:</span> {listing.brand.name} {listing.model.name}</p>
                <p><span className="text-muted-foreground">Năm SX:</span> {listing.year}</p>
                <p><span className="text-muted-foreground">Tình trạng:</span> {listing.condition === "new" ? "Xe mới" : "Xe cũ"}</p>
                {listing.mileage != null && (
                  <p><span className="text-muted-foreground">Số km:</span> {listing.mileage.toLocaleString("vi-VN")} km</p>
                )}
                {listing.color && (
                  <p><span className="text-muted-foreground">Màu:</span> {listing.color}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Giá & Vị trí</p>
              <div className="space-y-1">
                <p><span className="text-muted-foreground">Giá:</span> <strong className="text-primary">{displayPrice}</strong></p>
                {listing.listingType === "for_rent" && listing.weeklyDiscount && (
                  <p className="text-green-600 text-xs">✓ Giảm 10% khi thuê từ 7 ngày</p>
                )}
                {listing.city && (
                  <p className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                    {listing.city}{listing.address ? ` — ${listing.address}` : ""}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Người đăng */}
          <div className="space-y-1 text-sm">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Người đăng</p>
            <p className="flex items-center gap-1.5"><User className="h-3.5 w-3.5 text-muted-foreground" /> {listing.user.name || "—"}</p>
            <p className="text-muted-foreground">{listing.user.email}</p>
            {listing.user.phone && (
              <p className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-muted-foreground" /> {listing.user.phone}</p>
            )}
          </div>

          {/* Mô tả */}
          {listing.description && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Mô tả chi tiết</p>
              <p className="text-sm whitespace-pre-line leading-relaxed">{listing.description}</p>
            </div>
          )}

          {/* Actions */}
          {(status === "pending" || status === "active") && (
            <div className="pt-2 border-t flex gap-3">
              <AdminListingActions listingId={listing.id} showApprove={status === "pending"} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
