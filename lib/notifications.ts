import { db } from "@/lib/db";
import type { NotificationType } from "@prisma/client";

export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  body: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata?: Record<string, any>
) {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 90);

  return db.notification.create({
    data: {
      userId,
      type,
      title,
      body,
      metadata,
      expiresAt,
    },
  });
}

export async function getUnreadCount(userId: string): Promise<number> {
  return db.notification.count({
    where: { userId, read: false, expiresAt: { gt: new Date() } },
  });
}
