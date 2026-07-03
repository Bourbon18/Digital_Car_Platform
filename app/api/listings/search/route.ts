import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;

  const q = sp.get("q") || "";
  const listingType = sp.get("listingType") as "for_sale" | "for_rent" | null;
  const brandSlug = sp.get("brand");
  const modelSlug = sp.get("model");
  const yearMin = sp.get("yearMin") ? Number(sp.get("yearMin")) : undefined;
  const yearMax = sp.get("yearMax") ? Number(sp.get("yearMax")) : undefined;
  const priceMin = sp.get("priceMin") ? Number(sp.get("priceMin")) : undefined;
  const priceMax = sp.get("priceMax") ? Number(sp.get("priceMax")) : undefined;
  const city = sp.get("city") || undefined;
  const condition = sp.get("condition") as "new" | "used" | null;
  const sort = sp.get("sort") || "newest";
  const page = Math.max(1, Number(sp.get("page") || 1));
  const pageSize = 20;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: Record<string, any> = {
    status: "active",
  };

  if (listingType) where.listingType = listingType;
  if (city) where.city = { contains: city, mode: "insensitive" };
  if (condition) where.condition = condition;
  if (yearMin !== undefined || yearMax !== undefined) {
    where.year = {};
    if (yearMin !== undefined) (where.year as any).gte = yearMin;
    if (yearMax !== undefined) (where.year as any).lte = yearMax;
  }
  if (priceMin !== undefined || priceMax !== undefined) {
    where.price = {};
    if (priceMin !== undefined) (where.price as any).gte = priceMin;
    if (priceMax !== undefined) (where.price as any).lte = priceMax;
  }

  if (brandSlug) {
    where.brand = { slug: brandSlug };
  }
  if (modelSlug) {
    where.model = { slug: modelSlug };
  }

  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      { brand: { name: { contains: q, mode: "insensitive" } } },
      { model: { name: { contains: q, mode: "insensitive" } } },
    ];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const baseOrder: Record<string, any> =
    sort === "price_asc"
      ? { price: "asc" }
      : sort === "price_desc"
      ? { price: "desc" }
      : sort === "popular"
      ? { viewCount: "desc" }
      : sort === "rating"
      ? { averageRating: "desc" }
      : { createdAt: "desc" };

  // Tin đang nổi bật (đẩy tin) luôn xếp trước, sau đó mới theo tiêu chí sắp xếp.
  // featured boolean được cron /api/cron/expire-featured hạ xuống khi hết hạn.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const orderBy: Record<string, any>[] = [{ featured: "desc" }, baseOrder];

  const [listings, total] = await Promise.all([
    db.listing.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        brand: { select: { name: true, slug: true } },
        model: { select: { name: true } },
        images: { select: { thumbnailUrl: true, url: true }, orderBy: { order: "asc" }, take: 1 },
        user: { select: { name: true, role: true, plan: true, planExpiresAt: true } },
      },
    }),
    db.listing.count({ where }),
  ]);

  return NextResponse.json({
    listings,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
}
