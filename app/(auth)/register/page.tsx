"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Car, CheckCircle } from "lucide-react";
import { useI18n } from "@/components/i18n/language-provider";

export default function RegisterPage() {
  const router = useRouter();
  const { t } = useI18n();
  const a = t.auth;
  const [form, setForm] = useState({ email: "", password: "", confirmPassword: "", name: "", role: "buyer" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const ROLES = [
    { value: "buyer", label: a.roleBuyer, description: a.roleBuyerDesc },
    { value: "individual_seller", label: a.roleSeller, description: a.roleSellerDesc },
    { value: "individual_renter", label: a.roleRenter, description: a.roleRenterDesc },
    { value: "dealer", label: a.roleDealer, description: a.roleDealerDesc },
  ];

  function handleChange(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (form.password !== form.confirmPassword) {
      setError(a.mismatch);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : a.registerFailed);
      } else {
        setSuccess(true);
      }
    } catch {
      setError(a.connError);
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center py-12 px-4">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold mb-2">{a.successTitle}</h2>
          <p className="text-muted-foreground mb-6">
            {a.successBodyPre} <strong>{form.email}</strong>.<br />
            {a.successBodyPost}
          </p>
          {form.role !== "buyer" && (
            <p className="text-sm text-muted-foreground mb-6 rounded-lg border bg-muted/30 px-4 py-3">
              {a.planNote}
            </p>
          )}
          <Button onClick={() => router.push("/login")}>{a.backToLogin}</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center py-12 px-4">
      <div className="w-full max-w-lg">
        <div className="flex items-center justify-center gap-2 mb-8 text-primary font-bold text-2xl">
          <Car className="h-7 w-7" />
          <span>Fast</span>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{a.registerTitle}</CardTitle>
            <CardDescription>{a.registerSubtitle}</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">{error}</div>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">{a.fullName}</Label>
                <Input
                  id="name"
                  placeholder={a.namePlaceholder}
                  value={form.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">{a.email}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@example.com"
                  value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{a.password}</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder={a.passwordMin}
                  value={form.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{a.confirmPassword}</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder={a.confirmPlaceholder}
                  value={form.confirmPassword}
                  onChange={(e) => handleChange("confirmPassword", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>{a.youAre}</Label>
                <div className="grid gap-2">
                  {ROLES.map((r) => (
                    <label
                      key={r.value}
                      className={`flex cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors ${
                        form.role === r.value ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="role"
                        value={r.value}
                        checked={form.role === r.value}
                        onChange={(e) => handleChange("role", e.target.value)}
                        className="mt-1"
                      />
                      <div>
                        <div className="font-medium text-sm">{r.label}</div>
                        <div className="text-xs text-muted-foreground">{r.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? a.registerSubmitting : a.registerSubmit}
              </Button>
              <p className="text-sm text-muted-foreground text-center">
                {a.haveAccount}{" "}
                <Link href="/login" className="text-primary hover:underline font-medium">
                  {a.loginLink}
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
