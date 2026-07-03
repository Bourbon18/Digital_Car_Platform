import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { getServerDictionary } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

// GET /api/messages                          → danh sách conversations
// GET /api/messages?listingId=X&otherId=Y   → messages trong 1 conversation
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const listingId = req.nextUrl.searchParams.get("listingId");
  const otherId = req.nextUrl.searchParams.get("otherId");

  // --- Single conversation messages ---
  if (listingId && otherId) {
    const messages = await db.contactMessage.findMany({
      where: {
        listingId,
        OR: [
          { senderId: userId, receiverId: otherId },   // I sent to other (new)
          { senderId: otherId, receiverId: userId },   // Other sent to me (new)
          { senderId: userId, receiverId: null },      // I sent, old format (null receiverId)
          { senderId: otherId, receiverId: null },     // Other sent, old format (null receiverId)
        ],
      },
      include: {
        sender: { select: { id: true, name: true, avatarUrl: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    // Mark received messages as read
    await db.contactMessage.updateMany({
      where: { listingId, senderId: otherId, receiverId: userId, readAt: null },
      data: { readAt: new Date() },
    });

    return NextResponse.json(messages);
  }

  // --- Conversation list ---
  const allMessages = await db.contactMessage.findMany({
    where: {
      OR: [
        { senderId: userId },
        { receiverId: userId },
        { receiverId: null, listing: { userId } },
      ],
    },
    include: {
      listing: { select: { id: true, title: true, slug: true, userId: true } },
      sender: { select: { id: true, name: true, avatarUrl: true } },
      receiver: { select: { id: true, name: true, avatarUrl: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Group into unique conversations
  const convMap = new Map<string, {
    key: string;
    listingId: string;
    listing: { id: string; title: string; slug: string; userId: string };
    otherUser: { id: string; name: string | null; avatarUrl: string | null };
    lastMessage: string;
    lastMessageAt: Date;
    unread: number;
  }>();

  for (const msg of allMessages) {
    const otherId =
      msg.senderId === userId
        ? (msg.receiverId ?? msg.listing.userId) // sent by me → other is receiver
        : msg.senderId;                           // received by me → other is sender

    if (otherId === userId) continue; // skip self-messages

    const key = `${msg.listingId}_${otherId}`;
    if (!convMap.has(key)) {
      const otherUser =
        msg.senderId === userId
          ? msg.receiver ?? { id: msg.listing.userId, name: getServerDictionary().errors.sellerFallback, avatarUrl: null }
          : msg.sender;

      convMap.set(key, {
        key,
        listingId: msg.listingId,
        listing: msg.listing,
        otherUser,
        lastMessage: msg.content,
        lastMessageAt: msg.createdAt,
        unread: 0,
      });
    }

    // Count unread messages sent by other person to me
    if (msg.senderId === otherId && msg.receiverId === userId && !msg.readAt) {
      const conv = convMap.get(key)!;
      conv.unread += 1;
    }
  }

  return NextResponse.json(Array.from(convMap.values()));
}

// POST /api/messages — gửi tin nhắn trong conversation
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await db.user.findUnique({ where: { id: session.user.id }, select: { status: true } });
  if (!dbUser || dbUser.status === "suspended") {
    return NextResponse.json({ error: getServerDictionary().errors.accountSuspended }, { status: 403 });
  }

  const { listingId, receiverId, content } = await req.json();
  if (!listingId || !receiverId || !content?.trim()) {
    return NextResponse.json({ error: getServerDictionary().errors.missingInfo }, { status: 400 });
  }

  const listing = await db.listing.findUnique({ where: { id: listingId } });
  if (!listing) return NextResponse.json({ error: getServerDictionary().errors.listingNotExist }, { status: 404 });

  const message = await db.contactMessage.create({
    data: {
      listingId,
      senderId: session.user.id,
      receiverId,
      content: content.trim(),
    },
    include: {
      sender: { select: { id: true, name: true, avatarUrl: true } },
    },
  });

  return NextResponse.json(message, { status: 201 });
}
