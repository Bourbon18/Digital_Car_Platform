import { auth } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { NotificationPreferencesForm } from "@/components/notification-preferences-form";
import { getServerDictionary } from "@/lib/i18n/server";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  return { title: getServerDictionary().meta.notifSettings };
}

const TYPE_CONFIG: { type: string; canDisable: boolean }[] = [
  { type: "booking_new", canDisable: true },
  { type: "booking_confirmed", canDisable: true },
  { type: "booking_rejected", canDisable: true },
  { type: "booking_cancelled", canDisable: true },
  { type: "booking_completed", canDisable: true },
  { type: "payment_success", canDisable: false },
  { type: "payment_refund", canDisable: false },
  { type: "listing_approved", canDisable: true },
  { type: "listing_rejected", canDisable: true },
  { type: "new_message", canDisable: true },
  { type: "review_new", canDisable: true },
  { type: "review_reported", canDisable: true },
  { type: "dealer_verified", canDisable: false },
  { type: "account_suspended", canDisable: false },
];

export default async function NotificationSettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const N = getServerDictionary().notif;

  const prefs = await db.notificationPreference.findMany({ where: { userId: session.user.id } });
  const prefMap: Record<string, { email: boolean; inApp: boolean }> = {};
  for (const p of prefs) { prefMap[p.type] = { email: p.email, inApp: p.inApp }; }

  const initialPrefs = TYPE_CONFIG.map((t) => ({
    ...t,
    label: N.types[t.type as keyof typeof N.types] ?? t.type,
    email: prefMap[t.type]?.email ?? true,
    inApp: prefMap[t.type]?.inApp ?? true,
  }));

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">{N.settingsTitle}</h1>
        <p className="text-muted-foreground text-sm mt-1">{N.settingsSubtitle}</p>
      </div>
      <NotificationPreferencesForm initialPrefs={initialPrefs} />
    </div>
  );
}
