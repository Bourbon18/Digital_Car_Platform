import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { sendGenericEmail } from "@/lib/auth/email";
import { getServerDictionary } from "@/lib/i18n/server";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const E = getServerDictionary().errors;

  const dbUser = await db.user.findUnique({ where: { id: session.user.id }, select: { status: true } });
  if (!dbUser || dbUser.status === "suspended") {
    return NextResponse.json({ error: E.accountSuspended }, { status: 403 });
  }

  const { listingId, content } = await req.json();
  if (!listingId || !content?.trim()) {
    return NextResponse.json({ error: E.listingIdContentRequired }, { status: 400 });
  }

  const listing = await db.listing.findUnique({
    where: { id: listingId },
    include: { user: { select: { email: true, name: true } } },
  });
  if (!listing) return NextResponse.json({ error: E.listingNotExist }, { status: 404 });

  const message = await db.contactMessage.create({
    data: {
      listingId,
      senderId: session.user.id,
      receiverId: listing.userId,
      content: content.trim(),
    },
  });

  await db.listing.update({
    where: { id: listingId },
    data: { contactCount: { increment: 1 } },
  });

  const senderName = session.user.name || session.user.email;
  try {
    await sendGenericEmail(
      listing.user.email,
      `[Fast] Tin nhắn mới về "${listing.title}"`,
      `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Bạn có tin nhắn mới!</h2>
          <p><strong>${senderName}</strong> gửi về xe <strong>${listing.title}</strong>:</p>
          <blockquote style="border-left: 3px solid #2563eb; margin: 16px 0; padding: 12px 16px; background: #f0f4ff;">
            ${content.trim()}
          </blockquote>
          <p>Đăng nhập để xem và trả lời tin nhắn.</p>
        </div>
      `
    );
  } catch (emailError) {
    console.warn("[CONTACT] Email not configured, skipping notification:", emailError);
  }

  return NextResponse.json({ success: true, messageId: message.id });
}
