"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Phone, MessageSquare } from "lucide-react";
import { useI18n } from "@/components/i18n/language-provider";

interface ContactSellerFormProps {
  listingId: string;
  sellerId: string;
  sellerPhone?: string | null;
  isLoggedIn: boolean;
  label?: string;
  placeholder?: string;
}

export function ContactSellerForm({ listingId, sellerPhone, isLoggedIn, label, placeholder }: ContactSellerFormProps) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPhone, setShowPhone] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const { t } = useI18n();
  const c = t.car;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/listings/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId, content: message }),
      });
      if (res.ok) {
        toast({ title: c.contactSent });
        setMessage("");
      } else {
        const data = await res.json().catch(() => ({}));
        toast({ title: c.contactFailed, description: data.error || c.tryAgain, variant: "destructive" });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-lg border p-4 space-y-4">
      <h2 className="font-semibold flex items-center gap-2">
        <MessageSquare className="h-5 w-5" />
        {label ?? c.contactSeller}
      </h2>

      {sellerPhone && (
        <div>
          {isLoggedIn && showPhone ? (
            <div className="flex items-center gap-2 text-primary font-medium">
              <Phone className="h-4 w-4" />
              {sellerPhone}
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                if (!isLoggedIn) {
                  router.push("/login");
                } else {
                  setShowPhone(true);
                }
              }}
            >
              <Phone className="mr-2 h-4 w-4" />
              {c.showPhone}
            </Button>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="message">{c.yourMessage}</Label>
          <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={placeholder ?? c.contactPlaceholder}
            rows={4}
            className="w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            required
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading || !message.trim()}>
          {!isLoggedIn ? c.loginToContact : loading ? c.sending : c.sendContact}
        </Button>
      </form>
    </div>
  );
}
