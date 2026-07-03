import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (!token) {
    return NextResponse.redirect(new URL("/dashboard/profile?email_change=invalid", appUrl));
  }

  const record = await db.emailChangeToken.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!record) {
    return NextResponse.redirect(new URL("/dashboard/profile?email_change=invalid", appUrl));
  }
  if (record.usedAt) {
    return NextResponse.redirect(new URL("/dashboard/profile?email_change=already-used", appUrl));
  }
  if (record.expiresAt < new Date()) {
    return NextResponse.redirect(new URL("/dashboard/profile?email_change=expired", appUrl));
  }

  // Check new email still available
  const conflict = await db.user.findUnique({ where: { email: record.newEmail } });
  if (conflict && conflict.id !== record.userId) {
    return NextResponse.redirect(new URL("/dashboard/profile?email_change=conflict", appUrl));
  }

  await db.$transaction([
    db.user.update({
      where: { id: record.userId },
      data: { email: record.newEmail, emailChangedAt: new Date() },
    }),
    db.emailChangeToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
  ]);

  return NextResponse.redirect(new URL("/dashboard/profile?email_change=success", appUrl));
}
