import type { MetadataRoute } from "next";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  try {
    const { db } = await import("@/lib/db");
    const listings = await db.listing.findMany({
      where: { status: "active" },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: 5000,
    });

    const listingUrls: MetadataRoute.Sitemap = listings.map((l) => ({
      url: `${appUrl}/xe/${l.slug}`,
      lastModified: l.updatedAt,
      changeFrequency: "daily",
      priority: 0.8,
    }));

    return [
      { url: appUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
      { url: `${appUrl}/mua-xe`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.9 },
      { url: `${appUrl}/thue-xe`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.9 },
      ...listingUrls,
    ];
  } catch {
    return [
      { url: appUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
      { url: `${appUrl}/mua-xe`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.9 },
      { url: `${appUrl}/thue-xe`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.9 },
    ];
  }
}
