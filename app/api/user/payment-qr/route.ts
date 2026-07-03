import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { getServerDictionary } from "@/lib/i18n/server";

const SELLER_ROLES = ["individual_seller", "individual_renter", "dealer"];

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!SELLER_ROLES.includes(session.user.role)) {
    return NextResponse.json({ error: getServerDictionary().errors.onlySellerQr }, { status: 403 });
  }

  const { paymentQrUrl, bankAccountInfo } = await req.json();

  if (paymentQrUrl && paymentQrUrl.length > 2 * 1024 * 1024) {
    return NextResponse.json({ error: getServerDictionary().errors.qrTooLarge2mb }, { status: 400 });
  }

  await db.user.update({
    where: { id: session.user.id },
    data: {
      paymentQrUrl: paymentQrUrl || null,
      bankAccountInfo: bankAccountInfo?.trim() || null,
    },
  });

  return NextResponse.json({ success: true });
}
