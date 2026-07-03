import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/login?error=invalid-token", req.url));
  }

  const verificationToken = await db.verificationToken.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!verificationToken) {
    return NextResponse.redirect(new URL("/login?error=invalid-token", req.url));
  }

  if (verificationToken.expiresAt < new Date()) {
    return NextResponse.redirect(new URL("/login?error=token-expired", req.url));
  }

  if (verificationToken.usedAt) {
    return NextResponse.redirect(new URL("/login?message=already-verified", req.url));
  }

  await db.$transaction([
    db.user.update({
      where: { id: verificationToken.userId },
      data: { status: "active", emailVerified: new Date() },
    }),
    db.verificationToken.update({
      where: { id: verificationToken.id },
      data: { usedAt: new Date() },
    }),
  ]);

  return NextResponse.redirect(new URL("/login?message=verified", req.url));
}
