import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { getEffectivePlan } from "@/lib/subscription";
import { getServerDictionary } from "@/lib/i18n/server";

const SELLER_ROLES = ["individual_seller", "individual_renter", "dealer"];

// Số cổng BỔ SUNG được phép = maxPaymentQr của gói - 1 (trừ cổng mặc định).
async function extraQuota(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { plan: true, planExpiresAt: true },
  });
  const plan = user ? getEffectivePlan(user) : null;
  const max = plan ? Math.max(0, plan.maxPaymentQr - 1) : 0;
  const used = await db.paymentQr.count({ where: { userId } });
  return { max, used, planName: plan?.name ?? "Free" };
}

// POST — thêm 1 cổng nhận tiền bổ sung
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!SELLER_ROLES.includes(session.user.role)) {
    return NextResponse.json({ error: getServerDictionary().errors.noPermission }, { status: 403 });
  }

  const { qrUrl, bankInfo, label } = await req.json();
  if (!qrUrl || typeof qrUrl !== "string" || !qrUrl.startsWith("data:image/")) {
    return NextResponse.json({ error: getServerDictionary().errors.uploadValidQr }, { status: 400 });
  }
  if (qrUrl.length > 1_500_000) {
    return NextResponse.json({ error: getServerDictionary().errors.qrTooLarge1mb }, { status: 400 });
  }

  const E = getServerDictionary().errors;
  const { max, used, planName } = await extraQuota(session.user.id);
  if (max <= 0) {
    return NextResponse.json(
      { error: E.planNoExtraChannels.replace("{plan}", planName) },
      { status: 403 }
    );
  }
  if (used >= max) {
    return NextResponse.json({ error: E.maxExtraChannels.replace("{max}", String(max)) }, { status: 400 });
  }

  const channel = await db.paymentQr.create({
    data: {
      userId: session.user.id,
      qrUrl,
      bankInfo: bankInfo?.trim() || null,
      label: label?.trim() || null,
    },
    select: { id: true, qrUrl: true, bankInfo: true, label: true },
  });

  return NextResponse.json({ success: true, channel });
}

// DELETE — xóa 1 cổng bổ sung (?id=...)
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: getServerDictionary().errors.missingId }, { status: 400 });

  const channel = await db.paymentQr.findUnique({ where: { id }, select: { userId: true } });
  if (!channel || channel.userId !== session.user.id) {
    return NextResponse.json({ error: getServerDictionary().errors.channelNotFound }, { status: 404 });
  }

  await db.paymentQr.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
