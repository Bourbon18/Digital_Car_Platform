"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { MessageSquare, Send, ChevronLeft, Ban, UserX } from "lucide-react";
import { formatMessageTime } from "@/lib/utils";
import Link from "next/link";
import { useI18n } from "@/components/i18n/language-provider";

type OtherUser = { id: string; name: string | null; avatarUrl: string | null };
type Listing = { id: string; title: string; slug: string; userId: string };

type Conversation = {
  key: string;
  listingId: string;
  listing: Listing;
  otherUser: OtherUser;
  lastMessage: string;
  lastMessageAt: string;
  unread: number;
};

type Message = {
  id: string;
  content: string;
  senderId: string;
  createdAt: string;
  sender: { id: string; name: string | null; avatarUrl: string | null };
};

type OtherUserStatus = "active" | "suspended" | "deleted" | null;

function Avatar({ name, size = "md" }: { name: string | null; size?: "sm" | "md" }) {
  const initials = (name || "?").slice(0, 1).toUpperCase();
  const cls = size === "sm" ? "h-8 w-8 text-xs" : "h-10 w-10 text-sm";
  return (
    <div className={`${cls} rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold flex-shrink-0`}>
      {initials}
    </div>
  );
}

export function ChatShell({ currentUserId }: { currentUserId: string }) {
  const { t } = useI18n();
  const C = t.chat;
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [msgError, setMsgError] = useState("");
  const [showMobile, setShowMobile] = useState<"list" | "chat">("list");
  const [otherUserStatus, setOtherUserStatus] = useState<OtherUserStatus>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/messages", { cache: "no-store" });
      if (res.ok) setConversations(await res.json());
    } catch {
      // ignore network errors during polling
    } finally {
      setLoadingConvs(false);
    }
  }, []);

  const fetchOtherUserStatus = useCallback(async (otherId: string) => {
    try {
      const res = await fetch(`/api/user/other-status?id=${otherId}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setOtherUserStatus(data.status as OtherUserStatus);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const fetchMessages = useCallback(async (conv: Conversation) => {
    try {
      const res = await fetch(
        `/api/messages?listingId=${conv.listingId}&otherId=${conv.otherUser.id}`,
        { cache: "no-store" }
      );
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
        setMsgError("");
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
      } else {
        const err = await res.json().catch(() => ({}));
        setMsgError(err.error || C.loadFail);
      }
    } catch {
      setMsgError(C.connRetry);
    }
  }, []);

  useEffect(() => {
    if (!selected) return;
    setLoadingMsgs(true);
    setOtherUserStatus(null);
    Promise.all([
      fetchMessages(selected),
      fetchOtherUserStatus(selected.otherUser.id),
    ]).finally(() => setLoadingMsgs(false));

    pollRef.current = setInterval(() => {
      fetchMessages(selected);
      fetchConversations();
      fetchOtherUserStatus(selected.otherUser.id);
    }, 5000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [selected, fetchMessages, fetchConversations, fetchOtherUserStatus]);

  function selectConversation(conv: Conversation) {
    setSelected(conv);
    setMessages([]);
    setMsgError("");
    setShowMobile("chat");
  }

  const isChatDisabled = otherUserStatus === "suspended" || otherUserStatus === "deleted";

  async function sendMessage() {
    if (!input.trim() || !selected || sending || isChatDisabled) return;
    setSending(true);
    const content = input.trim();
    setInput("");

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: selected.listingId,
          receiverId: selected.otherUser.id,
          content,
        }),
      });

      if (res.ok) {
        const newMsg = await res.json();
        setMessages((prev) => [...prev, newMsg]);
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
        fetchConversations();
      } else {
        const data = await res.json().catch(() => ({}));
        setMsgError(data.error || C.sendFail);
      }
    } catch {
      // ignore send error — user can retry
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex overflow-hidden rounded-lg border bg-background" style={{ height: "calc(100vh - 160px)", minHeight: "500px" }}>
      {/* ── Conversation List ─────────────────────────── */}
      <aside className={`w-full md:w-72 flex-shrink-0 border-r flex flex-col ${showMobile === "chat" ? "hidden md:flex" : "flex"}`}>
        <div className="p-4 border-b">
          <h2 className="font-semibold">{C.title}</h2>
        </div>

        {loadingConvs ? (
          <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
            {C.loading}
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-2 p-6 text-center">
            <MessageSquare className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">{C.noConvs}</p>
            <Link href="/mua-xe" className="text-xs text-primary hover:underline">
              {C.findToContact}
            </Link>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            {conversations.map((conv) => (
              <button
                key={conv.key}
                onClick={() => selectConversation(conv)}
                className={`w-full flex items-start gap-3 p-4 border-b text-left hover:bg-muted/50 transition-colors ${
                  selected?.key === conv.key ? "bg-muted" : ""
                }`}
              >
                <Avatar name={conv.otherUser.name} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span className="font-medium text-sm truncate">
                      {conv.otherUser.name || C.user}
                    </span>
                    {conv.unread > 0 && (
                      <span className="flex-shrink-0 h-5 w-5 rounded-full bg-primary text-white text-xs flex items-center justify-center">
                        {conv.unread}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{conv.listing.title}</p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{conv.lastMessage}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </aside>

      {/* ── Chat Panel ────────────────────────────────── */}
      <div className={`flex-1 flex flex-col min-w-0 ${showMobile === "list" ? "hidden md:flex" : "flex"}`}>
        {!selected ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-muted-foreground">
            <MessageSquare className="h-12 w-12 opacity-20" />
            <p className="text-sm">{C.selectConv}</p>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b">
              <button
                onClick={() => setShowMobile("list")}
                className="md:hidden text-muted-foreground"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <Avatar name={selected.otherUser.name} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm">{selected.otherUser.name || C.user}</p>
                  {otherUserStatus === "suspended" && (
                    <span className="inline-flex items-center gap-1 text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-medium">
                      <Ban className="h-3 w-3" />
                      {C.suspended}
                    </span>
                  )}
                  {otherUserStatus === "deleted" && (
                    <span className="inline-flex items-center gap-1 text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-medium">
                      <UserX className="h-3 w-3" />
                      {C.deletedAcct}
                    </span>
                  )}
                </div>
                <Link
                  href={`/xe/${selected.listing.slug}`}
                  className="text-xs text-primary hover:underline truncate block"
                >
                  {selected.listing.title}
                </Link>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loadingMsgs && messages.length === 0 ? (
                <div className="text-center text-sm text-muted-foreground py-8">{C.loadingMsgs}</div>
              ) : msgError ? (
                <div className="text-center text-sm text-destructive py-8">{msgError}</div>
              ) : messages.length === 0 ? (
                <div className="text-center text-sm text-muted-foreground py-8">{C.noMsgs}</div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.senderId === currentUserId;
                  return (
                    <div key={msg.id} className={`flex gap-2 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                      {!isMe && <Avatar name={msg.sender.name} size="sm" />}
                      <div className={`max-w-[70%] ${isMe ? "items-end" : "items-start"} flex flex-col gap-1`}>
                        <div
                          className={`px-3 py-2 rounded-2xl text-sm ${
                            isMe
                              ? "bg-primary text-primary-foreground rounded-tr-sm"
                              : "bg-muted rounded-tl-sm"
                          }`}
                        >
                          {msg.content}
                        </div>
                        <span className="text-xs text-muted-foreground px-1">
                          {formatMessageTime(new Date(msg.createdAt))}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={bottomRef} />
            </div>

            {/* Disabled notice or Input */}
            {isChatDisabled ? (
              <div className={`p-4 border-t flex items-center gap-3 ${
                otherUserStatus === "deleted"
                  ? "bg-red-50 border-red-100"
                  : "bg-amber-50 border-amber-100"
              }`}>
                {otherUserStatus === "deleted" ? (
                  <>
                    <UserX className="h-5 w-5 text-red-500 flex-shrink-0" />
                    <p className="text-sm text-red-600 font-medium">
                      {C.deletedNotice}
                    </p>
                  </>
                ) : (
                  <>
                    <Ban className="h-5 w-5 text-amber-600 flex-shrink-0" />
                    <p className="text-sm text-amber-700 font-medium">
                      {C.suspendedNotice}
                    </p>
                  </>
                )}
              </div>
            ) : (
              <div className="p-3 border-t flex gap-2 items-end">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder={C.inputPlaceholder}
                  rows={1}
                  className="flex-1 resize-none rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary min-h-[40px] max-h-[120px]"
                  style={{ height: "auto" }}
                  onInput={(e) => {
                    const t = e.currentTarget;
                    t.style.height = "auto";
                    t.style.height = `${Math.min(t.scrollHeight, 120)}px`;
                  }}
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || sending}
                  className="flex-shrink-0 h-10 w-10 rounded-lg bg-primary text-white flex items-center justify-center hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
