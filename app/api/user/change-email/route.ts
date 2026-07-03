import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { sendEmailChangeVerification } from "@/lib/auth/email";
import { getServerDictionary } from "@/lib/i18n/server";
import { randomBytes } from "crypto";

const EMAIL_CHANGE_COOLDOWN_DAYS = 60;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const E = getServerDictionary().errors;
  const { newEmail } = await req.json();
  if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
    return NextResponse.json({ error: E.emailInvalid }, { status: 400 });
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, name: true, emailChangedAt: true },
  });
  if (!user) return NextResponse.json({ error: E.accountNotFound }, { status: 404 });

  if (newEmail.toLowerCase() === user.email.toLowerCase()) {
    return NextResponse.json({ error: E.emailSame }, { status: 400 });
  }

  // Check 60-day cooldown
  if (user.emailChangedAt) {
    const daysSinceLastChange = Math.floor(
      (Date.now() - user.emailChangedAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceLastChange < EMAIL_CHANGE_COOLDOWN_DAYS) {
      const daysRemaining = EMAIL_CHANGE_COOLDOWN_DAYS - daysSinceLastChange;
      return NextResponse.json(
        { error: E.emailCooldown.replace("{days}", String(daysRemaining)) },
        { status: 429 }
      );
    }
  }

  // Check new email not already in use
  const existing = await db.user.findUnique({ where: { email: newEmail.toLowerCase() } });
  if (existing) {
    return NextResponse.json({ error: E.emailInUseOther }, { status: 409 });
  }

  // Invalidate old pending tokens
  await db.emailChangeToken.updateMany({
    where: { userId: user.id, usedAt: null },
    data: { usedAt: new Date() },
  });

  // Create new token
  const token = randomBytes(32).toString("hex");
  await db.emailChangeToken.create({
    data: {
      userId: user.id,
      newEmail: newEmail.toLowerCase(),
      token,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
    },
  });

  try {
    await sendEmailChangeVerification(newEmail, user.name || user.email, token);
  } catch {
    console.warn("[CHANGE-EMAIL] Email not configured, auto-confirming for dev");
    // In dev without email: apply change immediately
    await db.$transaction([
      db.user.update({
        where: { id: user.id },
        data: { email: newEmail.toLowerCase(), emailChangedAt: new Date() },
      }),
      db.emailChangeToken.update({ where: { token }, data: { usedAt: new Date() } }),
    ]);
    return NextResponse.json({ success: true, autoApplied: true });
  }

  return NextResponse.json({ success: true, autoApplied: false });
}
