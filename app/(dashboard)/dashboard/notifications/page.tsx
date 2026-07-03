import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import { notificationLink } from "@/lib/notification-links";
import { MarkAllReadButton } from "@/components/notification-mark-all-read-button";
import { getServerDictionary } from "@/lib/i18n/server";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  return { title: getServerDictionary().meta.notifications };
}

export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const N = getServerDictionary().notif;

  const notifications = await db.notification.findMany({
    where: { userId: session.user.id, expiresAt: { gt: new Date() } },
    orderBy: [{ read: "asc" }, { createdAt: "desc" }],
    take: 50,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{N.title}</h1>
        {notifications.some((n) => !n.read) && <MarkAllReadButton />}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-16 border rounded-lg">
          <p className="text-muted-foreground">{N.empty}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif) => (
            <Link
              key={notif.id}
              href={notificationLink(notif.type, notif.metadata)}
              className={`block rounded-lg border p-4 hover:bg-muted/50 transition-colors ${!notif.read ? "bg-primary/5 border-primary/20" : ""}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className={`font-medium text-sm ${!notif.read ? "text-primary" : ""}`}>{notif.title}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">{notif.body}</p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(notif.createdAt)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
