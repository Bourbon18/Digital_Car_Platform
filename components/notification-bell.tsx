"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { notificationLink } from "@/lib/notification-links";
import { useI18n } from "@/components/i18n/language-provider";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata?: any;
}

export function NotificationBell({ initialCount }: { initialCount: number }) {
  const { t } = useI18n();
  const N = t.notif;
  const [count, setCount] = useState(initialCount);
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/notifications", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setCount(data.unreadCount);
        }
      } catch {
        // Network error during polling — ignore silently
      }
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleOpen() {
    setOpen((o) => !o);
    if (!open) {
      setLoading(true);
      try {
        const res = await fetch("/api/notifications");
        if (res.ok) {
          const data = await res.json();
          setNotifications(data.notifications);
          setCount(data.unreadCount);
        }
      } catch {
        // ignore network errors
      } finally {
        setLoading(false);
      }
    }
  }

  async function markAllRead() {
    try {
      await fetch("/api/notifications/read-all", { method: "POST" });
      setNotifications((n) => n.map((notif) => ({ ...notif, read: true })));
      setCount(0);
    } catch {
      // ignore
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button onClick={handleOpen} className="relative p-2 hover:bg-muted rounded-md" aria-label={N.bellAria}>
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-80 rounded-lg border bg-background shadow-lg z-50">
          <div className="flex items-center justify-between border-b px-4 py-2">
            <span className="font-medium text-sm">{N.title}</span>
            {count > 0 && (
              <button onClick={markAllRead} className="text-xs text-primary hover:underline">{N.readAll}</button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="py-8 text-center text-sm text-muted-foreground">{N.loading}</div>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">{N.emptyShort}</div>
            ) : (
              notifications.slice(0, 10).map((notif) => (
                <Link
                  key={notif.id}
                  href={notificationLink(notif.type, notif.metadata)}
                  onClick={() => setOpen(false)}
                  className={`block px-4 py-3 border-b last:border-0 hover:bg-muted/60 transition-colors ${!notif.read ? "bg-primary/5" : ""}`}
                >
                  <p className={`text-sm font-medium ${!notif.read ? "text-primary" : ""}`}>{notif.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notif.body}</p>
                  <p className="text-xs text-muted-foreground mt-1">{formatDate(new Date(notif.createdAt))}</p>
                </Link>
              ))
            )}
          </div>
          <div className="border-t p-2">
            <Link href="/dashboard/notifications" className="block text-center text-xs text-primary hover:underline py-1" onClick={() => setOpen(false)}>
              {N.viewAll}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
