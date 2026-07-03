import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/auth/email";
import { getServerDictionary } from "@/lib/i18n/server";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    const user = await db.user.findUnique({ where: { email } });

    // Always return success to avoid email enumeration
    if (user) {
      const token = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await db.passwordResetToken.create({
        data: { userId: user.id, token, expiresAt },
      });

      try {
        await sendPasswordResetEmail(email, user.name || email, token);
      } catch (emailError) {
        console.warn("[FORGOT_PASSWORD] Email not configured:", emailError);
      }
    }

    return NextResponse.json({
      message: "Nếu email tồn tại trong hệ thống, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu.",
    });
  } catch (error) {
    console.error("[FORGOT_PASSWORD]", error);
    return NextResponse.json({ error: getServerDictionary().errors.serverError }, { status: 500 });
  }
}
