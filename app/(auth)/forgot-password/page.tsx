"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/components/i18n/language-provider";

export default function ForgotPasswordPage() {
  const { t } = useI18n();
  const a = t.auth;
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setLoading(false);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="text-4xl">📧</div>
            <h2 className="text-xl font-semibold">{a.checkEmail}</h2>
            <p className="text-muted-foreground text-sm">
              {a.resetSentMsg.split("{email}")[0]}<strong>{email}</strong>{a.resetSentMsg.split("{email}")[1]}
            </p>
            <Link href="/login" className="text-primary text-sm hover:underline">{a.backToLogin}</Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{a.forgotTitle}</CardTitle>
          <p className="text-sm text-muted-foreground">{a.forgotSubtitle}</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">{a.email}</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? a.sendingReset : a.sendReset}
            </Button>
            <div className="text-center text-sm">
              <Link href="/login" className="text-primary hover:underline">{a.backToLogin}</Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
