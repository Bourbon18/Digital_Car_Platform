import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import type { NotificationType } from "@prisma/client";

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { preferences } = await req.json();
  if (!Array.isArray(preferences)) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  for (const pref of preferences) {
    await db.notificationPreference.upsert({
      where: { userId_type: { userId: session.user.id, type: pref.type as NotificationType } },
      create: { userId: session.user.id, type: pref.type, email: pref.email, inApp: pref.inApp },
      update: { email: pref.email, inApp: pref.inApp },
    });
  }

  return NextResponse.json({ success: true });
}
