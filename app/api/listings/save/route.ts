import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { getServerDictionary } from "@/lib/i18n/server";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { listingId } = await req.json();

  const count = await db.savedListing.count({ where: { userId: session.user.id } });
  if (count >= 100) {
    return NextResponse.json({ error: getServerDictionary().errors.maxSavedListings }, { status: 400 });
  }

  await db.savedListing.upsert({
    where: { userId_listingId: { userId: session.user.id, listingId } },
    create: { userId: session.user.id, listingId },
    update: {},
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { listingId } = await req.json();

  await db.savedListing.deleteMany({
    where: { userId: session.user.id, listingId },
  });

  return NextResponse.json({ success: true });
}
