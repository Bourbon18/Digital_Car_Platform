"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Car, AlertCircle, CheckCircle } from "lucide-react";
import { useI18n } from "@/components/i18n/language-provider";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useI18n();
  const a = t.auth;
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const message = searchParams.get("message");
  const error = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setLoginError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      const code = (result as { code?: string }).code ?? "";
      if (code === "SUSPENDED") {
        setLoginError("SUSPENDED");
      } else if (code === "UNVERIFIED") {
        setLoginError("UNVERIFIED");
      } else {
        setLoginError(a.invalidCreds);
      }
      setLoading(false);
    } else {
      router.push(callbackUrl);
    }
  }

  return (
    <>
      {message === "verified" && (
        <div className="mb-4 flex items-center gap-2 rounded-md bg-green-50 p-3 text-green-800 text-sm">
          <CheckCircle className="h-4 w-4 flex-shrink-0" />
          {a.verifiedMsg}
        </div>
      )}
      {loginError === "UNVERIFIED" && (
        <div className="mb-4 rounded-md bg-amber-50 border border-amber-200 p-3 text-amber-800 text-sm space-y-1">
          <div className="flex items-center gap-2 font-medium">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {a.unverifiedTitle}
          </div>
          <p>{a.unverifiedBody}{" "}
            <a href="/resend-verification" className="underline font-medium">{a.resend}</a>
          </p>
        </div>
      )}
      {loginError === "SUSPENDED" && (
        <div className="mb-4 flex items-center gap-2 rounded-md bg-red-50 border border-red-200 p-3 text-red-800 text-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {a.suspended}
        </div>
      )}
      {loginError && loginError !== "UNVERIFIED" && loginError !== "SUSPENDED" && (
        <div className="mb-4 flex items-center gap-2 rounded-md bg-red-50 border border-red-200 p-3 text-red-800 text-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {loginError}
        </div>
      )}
      {!loginError && error && (
        <div className="mb-4 flex items-center gap-2 rounded-md bg-red-50 border border-red-200 p-3 text-red-800 text-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {a.loginFailed}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{a.loginTitle}</CardTitle>
          <CardDescription>{a.loginSubtitle}</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{a.email}</Label>
              <Input id="email" type="email" placeholder="email@example.com" value={email}
                onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">{a.password}</Label>
                <Link href="/forgot-password" className="text-xs text-primary hover:underline">{a.forgot}</Link>
              </div>
              <Input id="password" type="password" placeholder="••••••••" value={password}
                onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? a.loginSubmitting : a.loginSubmit}
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              {a.noAccount}{" "}
              <Link href="/register" className="text-primary hover:underline font-medium">{a.registerNow}</Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8 text-primary font-bold text-2xl">
          <Car className="h-7 w-7" />
          <span>Fast</span>
        </div>
        <Suspense fallback={<div className="text-center py-4">...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
