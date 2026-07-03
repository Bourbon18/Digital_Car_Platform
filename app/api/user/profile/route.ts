import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, phone, businessName, showroomAddress } = await req.json();

  await db.user.update({
    where: { id: session.user.id },
    data: { name: name?.trim() || null, phone: phone?.trim() || null },
  });

  if (session.user.role === "dealer" && businessName) {
    await db.dealerProfile.updateMany({
      where: { userId: session.user.id },
      data: {
        businessName: businessName.trim(),
        showroomAddress: showroomAddress?.trim() || null,
      },
    });
  }

  return NextResponse.json({ success: true });
}
