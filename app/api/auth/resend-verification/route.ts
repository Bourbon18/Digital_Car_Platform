import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { sendVerificationEmail } from "@/lib/auth/email";
import { getServerDictionary } from "@/lib/i18n/server";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: getServerDictionary().errors.emailRequired }, { status: 400 });

    const user = await db.user.findUnique({ where: { email } });

    // Always return success to avoid email enumeration
    if (!user || user.status === "active") {
      return NextResponse.json({ message: "Nếu email tồn tại và chưa xác thực, bạn sẽ nhận được email mới." });
    }

    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await db.verificationToken.create({
      data: { userId: user.id, token, expiresAt },
    });

    try {
      await sendVerificationEmail(email, user.name || email, token);
    } catch (emailError) {
      console.warn("[RESEND_VERIFICATION] Email not configured:", emailError);
    }

    return NextResponse.json({ message: "Đã gửi lại email xác thực." });
  } catch (error) {
    console.error("[RESEND_VERIFICATION]", error);
    return NextResponse.json({ error: getServerDictionary().errors.serverError }, { status: 500 });
  }
}
