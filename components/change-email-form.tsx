"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Mail, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { useI18n } from "@/components/i18n/language-provider";

interface ChangeEmailFormProps {
  currentEmail: string;
  emailChangedAt: Date | null;
}

const COOLDOWN_DAYS = 60;

function getDaysRemaining(emailChangedAt: Date | null): number {
  if (!emailChangedAt) return 0;
  const daysSince = Math.floor((Date.now() - new Date(emailChangedAt).getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, COOLDOWN_DAYS - daysSince);
}

function ChangeEmailFormInner({ currentEmail, emailChangedAt }: ChangeEmailFormProps) {
  const { toast } = useToast();
  const { t } = useI18n();
  const P = t.profile;
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const daysRemaining = getDaysRemaining(emailChangedAt);
  const canChange = daysRemaining === 0;

  // Show toast based on redirect query param after email confirmation
  useEffect(() => {
    const status = searchParams.get("email_change");
    if (!status) return;
    const messages: Record<string, { title: string; variant?: "destructive" }> = {
      success: { title: P.ecSuccess },
      invalid: { title: P.ecInvalid, variant: "destructive" },
      expired: { title: P.ecExpired, variant: "destructive" },
      conflict: { title: P.ecConflict, variant: "destructive" },
      "already-used": { title: P.ecUsed, variant: "destructive" },
    };
    const msg = messages[status];
    if (msg) toast({ title: msg.title, variant: msg.variant });
  }, [searchParams, toast]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newEmail.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/user/change-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newEmail: newEmail.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: data.error || P.requestFailed, variant: "destructive" });
      } else if (data.autoApplied) {
        toast({ title: P.emailUpdatedDev });
        setOpen(false);
      } else {
        setSent(true);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Mail className="h-4 w-4" />
          {P.changeEmail}
        </CardTitle>
        <CardDescription>
          {emailChangedAt
            ? `${P.lastChanged} ${new Date(emailChangedAt).toLocaleDateString("vi-VN")}`
            : P.neverChanged}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1.5">
          <Label>{P.currentEmail}</Label>
          <Input value={currentEmail} disabled />
        </div>

        {!canChange ? (
          <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            <Clock className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>
              {P.cooldownMsg.replace("{n}", String(daysRemaining)).replace("{N}", String(COOLDOWN_DAYS))}
            </span>
          </div>
        ) : sent ? (
          <div className="flex items-start gap-2 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">
            <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>{P.sentMsg.replace("{email}", newEmail)}</span>
          </div>
        ) : open ? (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="newEmail">{P.newEmail}</Label>
              <Input
                id="newEmail"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="email-moi@example.com"
                required
                autoFocus
              />
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {P.emailHint}
              </p>
            </div>
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={loading || !newEmail.trim()}>
                {loading ? P.sending : P.sendConfirm}
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
                {P.cancel}
              </Button>
            </div>
          </form>
        ) : (
          <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
            {P.requestChange}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export function ChangeEmailForm(props: ChangeEmailFormProps) {
  return (
    <Suspense fallback={null}>
      <ChangeEmailFormInner {...props} />
    </Suspense>
  );
}
