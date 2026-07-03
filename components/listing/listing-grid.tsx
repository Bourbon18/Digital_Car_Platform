import { ListingCard } from "@/components/listing/listing-card";
import { getServerDictionary } from "@/lib/i18n/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ListingData = any;

interface ListingGridProps {
  searchParams: Record<string, string>;
}

async function fetchListings(searchParams: Record<string, string>) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const params = new URLSearchParams(searchParams).toString();
  // Trang lọc/tìm kiếm cần dữ liệu tươi: không cache để tránh trả kết quả cũ
  // (vd tin vừa thêm ảnh nhưng vẫn hiện bản cache không ảnh cho tới khi F5).
  const res = await fetch(`${appUrl}/api/listings/search?${params}`, {
    cache: "no-store",
  });
  if (!res.ok) return { listings: [], total: 0, totalPages: 0, page: 1 };
  return res.json();
}

export async function ListingGrid({ searchParams }: ListingGridProps) {
  const data = await fetchListings(searchParams);
  const { listings, total, totalPages, page } = data;
  const L = getServerDictionary().listings;

  if (listings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <p className="text-lg font-medium">{L.noResults}</p>
        <p className="text-sm">{L.noResultsHint}</p>
      </div>
    );
  }

  const labels = {
    forRent: L.forRent, forSale: L.forSale, dealer: L.dealer,
    featured: L.featured, verified: L.verified, perDay: L.perDay,
    noImage: L.noImage, condNew: L.condNew,
  };

  return (
    <div>
      <div className="mb-4 text-sm text-muted-foreground">
        {L.found} <strong>{total.toLocaleString("vi-VN")}</strong> {L.results}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(listings as ListingData[]).map((listing: ListingData) => (
          <ListingCard key={listing.id} listing={listing} labels={labels} />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="mt-8 flex justify-center gap-2">
          {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map((p) => (
            <a
              key={p}
              href={`?${new URLSearchParams({ ...searchParams, page: String(p) })}`}
              className={`flex h-9 w-9 items-center justify-center rounded-md border text-sm transition-colors ${
                p === Number(page)
                  ? "bg-primary text-primary-foreground border-primary"
                  : "hover:bg-muted"
              }`}
            >
              {p}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
