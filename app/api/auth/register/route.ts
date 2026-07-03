import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { db } from "@/lib/db";
import { registerSchema } from "@/lib/auth/schemas";
import { sendVerificationEmail } from "@/lib/auth/email";
import { getServerDictionary } from "@/lib/i18n/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const { email, password, name, role } = parsed.data;

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: getServerDictionary().errors.emailInUse }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await db.user.create({
      data: {
        email,
        passwordHash,
        name,
        role: role as "buyer" | "individual_seller" | "individual_renter" | "dealer",
        status: "unverified",
      },
    });

    // Create dealer profile if role is dealer
    if (role === "dealer") {
      await db.dealerProfile.create({
        data: {
          userId: user.id,
          businessName: name,
          verificationStatus: "pending",
        },
      });
    }

    // Create email verification token
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await db.verificationToken.create({
      data: { userId: user.id, token, expiresAt },
    });

    // Attempt to send verification email — if email is not configured (local dev),
    // auto-verify the user so they can log in immediately
    let emailSent = false;
    try {
      await sendVerificationEmail(email, name, token);
      emailSent = true;
    } catch (emailError) {
      console.warn("[REGISTER] Email not configured, auto-verifying user:", emailError);
      await db.user.update({
        where: { id: user.id },
        data: { emailVerified: new Date(), status: "active" },
      });
    }

    return NextResponse.json({
      message: emailSent
        ? "Đăng ký thành công. Vui lòng kiểm tra email để xác thực."
        : "Đăng ký thành công. Bạn có thể đăng nhập ngay.",
    }, { status: 201 });
  } catch (error) {
    console.error("[REGISTER]", error);
    return NextResponse.json({ error: getServerDictionary().errors.serverError }, { status: 500 });
  }
}
