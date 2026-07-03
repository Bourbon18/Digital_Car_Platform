import { Suspense } from "react";
import type { Metadata } from "next";
import { ListingGrid } from "@/components/listing/listing-grid";
import { FilterSidebar } from "@/components/search/filter-sidebar";
import { getServerDictionary } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const m = getServerDictionary().meta;
  return { title: m.buyTitle, description: m.buyDesc };
}

export default function BuyCarPage({
  searchParams,
}: {
  searchParams: Record<string, string>;
}) {
  const L = getServerDictionary().listings;
  return (
    <div className="container py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{L.buyTitle}</h1>
        <p className="text-muted-foreground">{L.buySubtitle}</p>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        <aside className="w-full lg:w-72 flex-shrink-0">
          <FilterSidebar searchParams={searchParams} />
        </aside>

        <main className="flex-1">
          <Suspense key={JSON.stringify(searchParams)} fallback={<div className="text-muted-foreground">{L.loading}</div>}>
            <ListingGrid searchParams={{ ...searchParams, listingType: "for_sale" }} />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
