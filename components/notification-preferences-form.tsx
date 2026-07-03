"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/components/i18n/language-provider";

interface Pref {
  type: string;
  label: string;
  canDisable: boolean;
  email: boolean;
  inApp: boolean;
}

export function NotificationPreferencesForm({ initialPrefs }: { initialPrefs: Pref[] }) {
  const [prefs, setPrefs] = useState(initialPrefs);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const { t } = useI18n();
  const N = t.notif;

  function toggle(type: string, channel: "email" | "inApp") {
    setPrefs((p) => p.map((pref) => pref.type === type ? { ...pref, [channel]: !pref[channel] } : pref));
  }

  async function handleSave() {
    setSaving(true);
    const res = await fetch("/api/notifications/preferences", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ preferences: prefs }),
    });
    setSaving(false);
    if (res.ok) toast({ title: N.saved });
    else toast({ title: N.saveErr, variant: "destructive" });
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border overflow-hidden">
        <div className="grid grid-cols-[1fr_auto_auto] gap-4 px-4 py-2 bg-muted text-xs font-medium text-muted-foreground">
          <span>{N.colType}</span>
          <span className="text-center w-16">{N.colEmail}</span>
          <span className="text-center w-16">{N.colInApp}</span>
        </div>
        {prefs.map((pref) => (
          <div key={pref.type} className="grid grid-cols-[1fr_auto_auto] gap-4 items-center px-4 py-3 border-t">
            <div>
              <span className="text-sm">{pref.label}</span>
              {!pref.canDisable && <span className="ml-2 text-xs text-muted-foreground">{N.required}</span>}
            </div>
            <div className="flex justify-center w-16">
              <input type="checkbox" checked={pref.email} disabled={!pref.canDisable}
                onChange={() => pref.canDisable && toggle(pref.type, "email")}
                className="h-4 w-4 cursor-pointer disabled:cursor-not-allowed" />
            </div>
            <div className="flex justify-center w-16">
              <input type="checkbox" checked={pref.inApp} disabled={!pref.canDisable}
                onChange={() => pref.canDisable && toggle(pref.type, "inApp")}
                className="h-4 w-4 cursor-pointer disabled:cursor-not-allowed" />
            </div>
          </div>
        ))}
      </div>
      <Button onClick={handleSave} disabled={saving}>{saving ? N.saving : N.saveSettings}</Button>
    </div>
  );
}
