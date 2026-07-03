"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/components/i18n/language-provider";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t } = useI18n();
  const a = t.auth;
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) { setError(a.pwMismatch); return; }
    if (password.length < 8) { setError(a.pwMin); return; }
    setLoading(true);
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password, confirmPassword: confirm }),
    });
    setLoading(false);
    if (res.ok) {
      router.push("/login?message=password-reset");
    } else {
      const data = await res.json();
      setError(
        typeof data.error === "string"
          ? data.error
          : a.resetInvalid
      );
    }
  }

  if (!token) {
    return (
      <div className="text-center space-y-2">
        <p className="text-destructive">{a.linkInvalid}</p>
        <Link href="/forgot-password" className="text-primary hover:underline text-sm">{a.requestNewLink}</Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="password">{a.newPassword}</Label>
        <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={a.passwordMin} required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="confirm">{a.confirmNewPassword}</Label>
        <Input id="confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? a.updating : a.resetSubmit}
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  const { t } = useI18n();
  const a = t.auth;
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{a.resetTitle}</CardTitle>
          <p className="text-sm text-muted-foreground">{a.resetSubtitle}</p>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div className="text-center py-4">{a.loading}</div>}>
            <ResetPasswordForm />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
