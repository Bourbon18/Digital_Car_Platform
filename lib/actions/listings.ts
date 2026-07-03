"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { requireRole, requireEmailVerified } from "@/lib/auth/rbac";
import { checkDailyPostLimit } from "@/lib/subscription";
import { createNotification } from "@/lib/notifications";
import { getServerDictionary } from "@/lib/i18n/server";
import { generateSlug } from "@/lib/utils";
import { revalidatePath } from "next/cache";

type Errs = ReturnType<typeof getServerDictionary>["errors"];

function makeListingSchema(m: Errs) {
  return z.object({
    brandId: z.string().min(1, m.chooseBrand),
    modelId: z.string().min(1, m.chooseModel),
    title: z.string().min(5, m.titleMin),
    year: z.number().int().min(1980).max(new Date().getFullYear() + 1),
    mileage: z.number().int().min(0).optional(),
    color: z.string().optional(),
    condition: z.enum(["new", "used"]),
    listingType: z.enum(["for_sale", "for_rent"]),
    price: z.number().min(0),
    pricePerDay: z.number().positive().optional(),
    weeklyDiscount: z.boolean().optional(),
    description: z.string().min(20, m.descMin),
    city: z.string().min(1, m.chooseCity),
    address: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    images: z.array(z.object({ url: z.string().url(), thumbnailUrl: z.string().optional(), publicId: z.string(), order: z.number() })).min(1, m.uploadImage),
  }).refine(
    (d) => d.listingType === "for_rent" || d.price > 0,
    { message: m.priceGt0, path: ["price"] }
  ).refine(
    (d) => d.listingType === "for_sale" || (d.pricePerDay !== undefined && d.pricePerDay > 0),
    { message: m.rentPriceGt0, path: ["pricePerDay"] }
  );
}

export type CreateListingInput = z.infer<ReturnType<typeof makeListingSchema>>;

export async function createListing(data: CreateListingInput) {
  const user = await requireRole(["individual_seller", "individual_renter", "dealer"]);
  await requireEmailVerified();

  const E = getServerDictionary().errors;
  const parsed = makeListingSchema(E).safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const limitCheck = await checkDailyPostLimit(user.id);
  if (!limitCheck.ok) {
    const upgradeHint = limitCheck.plan.id === "business" ? "" : E.upgradeHint;
    return {
      error: E.dailyLimit
        .replace("{limit}", String(limitCheck.limit))
        .replace("{plan}", limitCheck.plan.name)
        .replace("{hint}", upgradeHint),
    };
  }

  const { images, ...listingData } = parsed.data;

  const brand = await db.brand.findUnique({ where: { id: listingData.brandId } });
  const model = await db.carModel.findUnique({ where: { id: listingData.modelId } });
  if (!brand || !model) return { error: E.brandModelInvalid };

  const tempId = Math.random().toString(36).slice(2, 10);
  const titleForSlug = `${brand.name} ${model.name} ${listingData.year}`;
  const slug = generateSlug(titleForSlug, tempId);

  const listing = await db.listing.create({
    data: {
      ...listingData,
      title: listingData.title || titleForSlug,
      slug,
      userId: user.id,
      price: listingData.price,
      pricePerDay: listingData.pricePerDay,
      status: "pending",
      priorityReview: limitCheck.plan.priorityReview,
      images: {
        create: images.map((img) => ({
          url: img.url,
          thumbnailUrl: img.thumbnailUrl,
          publicId: img.publicId,
          order: img.order,
        })),
      },
    },
  });

  // Fix slug to include real ID
  await db.listing.update({
    where: { id: listing.id },
    data: { slug: generateSlug(titleForSlug, listing.id) },
  });

  // Thông báo cho admin: có tin đăng mới chờ duyệt
  const admins = await db.user.findMany({ where: { role: "admin" }, select: { id: true } });
  await Promise.all(
    admins.map((a) =>
      createNotification(
        a.id,
        "listing_pending_review",
        "Có tin đăng mới chờ duyệt",
        `"${listing.title || titleForSlug}" vừa được đăng, vào kiểm tra để duyệt.`,
        { listingId: listing.id, url: "/admin/listings" }
      )
    )
  );

  revalidatePath("/dashboard/listings");
  return { success: true, listingId: listing.id };
}

export async function updateListing(listingId: string, data: Partial<CreateListingInput>) {
  const user = await requireRole(["individual_seller", "individual_renter", "dealer"]);

  const E = getServerDictionary().errors;
  const listing = await db.listing.findUnique({ where: { id: listingId } });
  if (!listing || listing.userId !== user.id) {
    return { error: E.noPermEditListing };
  }

  const activeBooking = await db.booking.findFirst({
    where: { listingId, status: { in: ["pending", "confirmed", "active"] } },
  });
  if (activeBooking) {
    return { error: E.cannotEditActiveTx };
  }

  const newStatus = listing.status === "active" ? "pending" : listing.status;

  await db.listing.update({
    where: { id: listingId },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: { ...data, status: newStatus, updatedAt: new Date() } as any,
  });

  revalidatePath(`/xe/${listing.slug}`);
  revalidatePath("/dashboard/listings");
  return { success: true };
}

export async function deleteListing(listingId: string) {
  const user = await requireRole(["individual_seller", "individual_renter", "dealer", "admin"]);

  const E = getServerDictionary().errors;
  const listing = await db.listing.findUnique({ where: { id: listingId } });
  if (!listing || (listing.userId !== user.id && user.role !== "admin")) {
    return { error: E.noPermDeleteListing };
  }

  const pendingBooking = await db.booking.findFirst({
    where: { listingId, status: { in: ["pending", "confirmed"] } },
  });
  if (pendingBooking) {
    return { error: E.cancelBookingsBeforeDelete };
  }

  await db.listing.update({
    where: { id: listingId },
    data: { status: "deleted" },
  });

  revalidatePath("/dashboard/listings");
  return { success: true };
}

export async function getSignedUploadUrl(folder: string = "listings") {
  const cloudinary = await import("cloudinary");
  cloudinary.v2.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  const timestamp = Math.round(Date.now() / 1000);
  const signature = cloudinary.v2.utils.api_sign_request(
    { timestamp, folder, transformation: "c_limit,w_1200,q_auto,f_webp" },
    process.env.CLOUDINARY_API_SECRET!
  );

  return {
    signature,
    timestamp,
    cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    folder,
  };
}
