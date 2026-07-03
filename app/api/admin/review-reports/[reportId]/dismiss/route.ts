import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest, { params }: { params: { reportId: string } }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await db.reviewReport.update({
    where: { id: params.reportId },
    data: { resolved: true },
  });

  return NextResponse.json({ success: true });
}
