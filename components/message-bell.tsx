"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { MessageSquare, X } from "lucide-react";
import { useI18n } from "@/components/i18n/language-provider";

interface Conversation {
  key: string;
  listingId: string;
  listing: { id: string; title: string; slug: string };
  otherUser: { id: string; name: string | null; avatarUrl: string | null };
  lastMessage: string;
  lastMessageAt: string;
  unread: number;
}

interface Popup {
  key: string;
  senderName: string;
  initials: string;
  message: string;
  href: string;
}

export function MessageBell() {
  const { t } = useI18n();
  const N = t.notif;
  const [unread, setUnread] = useState(0);
  const [popup, setPopup] = useState<Popup | null>(null);
  const prevConvsRef = useRef<Map<string, number>>(new Map());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstFetch = useRef(true);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch("/api/messages", { cache: "no-store" });
      if (!res.ok) return;
      const convs: Conversation[] = await res.json();

      const total = convs.reduce((sum, c) => sum + (c.unread || 0), 0);
      setUnread(total);

      if (!isFirstFetch.current) {
        // Find a conversation whose unread count just increased
        for (const conv of convs) {
          if ((conv.unread || 0) > (prevConvsRef.current.get(conv.key) ?? 0)) {
            const name = conv.otherUser.name || N.user;
            const initials = name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
            const href = `/dashboard/messages?listing=${conv.listingId}&other=${conv.otherUser.id}`;

            setPopup({ key: conv.key, senderName: name, initials, message: conv.lastMessage, href });

            if (timerRef.current) clearTimeout(timerRef.current);
            timerRef.current = setTimeout(() => setPopup(null), 6000);
            break;
          }
        }
      }

      isFirstFetch.current = false;
      prevConvsRef.current = new Map(convs.map((c) => [c.key, c.unread || 0]));
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 10000);
    return () => {
      clearInterval(interval);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [fetchMessages]);

  function dismissPopup() {
    setPopup(null);
    if (timerRef.current) clearTimeout(timerRef.current);
  }

  return (
    <>
      {/* Icon in header */}
      <Link
        href="/dashboard/messages"
        className="relative p-2 hover:bg-muted rounded-md flex items-center justify-center"
        aria-label={N.msgAria}
      >
        <MessageSquare className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </Link>

      {/* Popup toast — rendered at body level via portal to avoid backdrop-blur clipping */}
      {popup && typeof document !== "undefined" && createPortal(
        <div className="fixed bottom-5 right-5 z-[9999] w-80 rounded-xl border bg-background shadow-xl animate-in slide-in-from-bottom-4 fade-in duration-300">
          <div className="flex items-start gap-3 p-4">
            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold select-none">
              {popup.initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">{popup.senderName}</p>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{popup.message}</p>
              <Link
                href={popup.href}
                onClick={dismissPopup}
                className="inline-block mt-2 text-xs font-medium text-primary hover:underline"
              >
                {N.reply}
              </Link>
            </div>
            <button
              onClick={dismissPopup}
              className="flex-shrink-0 p-1 rounded hover:bg-muted text-muted-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="h-0.5 bg-muted rounded-b-xl overflow-hidden">
            <div className="h-full bg-primary animate-[shrink_6s_linear_forwards]" />
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
