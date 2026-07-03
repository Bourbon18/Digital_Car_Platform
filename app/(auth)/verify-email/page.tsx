import Link from "next/link";
import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Clock, Mail } from "lucide-react";
import { getServerDictionary } from "@/lib/i18n/server";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  return { title: getServerDictionary().meta.verifyEmail };
}

export default async function VerifyEmailPage({ searchParams }: { searchParams: { token?: string } }) {
  const { token } = searchParams;

  if (!token) return <InfoPage />;

  const record = await db.verificationToken.findUnique({
    where: { token },
    include: { user: { select: { emailVerified: true } } },
  });

  if (!record) return <Result status="invalid" />;
  if (record.usedAt || record.user.emailVerified) return <Result status="already-used" />;
  if (record.expiresAt < new Date()) return <Result status="expired" />;

  await db.$transaction([
    db.user.update({
      where: { id: record.userId },
      data: { emailVerified: new Date(), status: "active" },
    }),
    db.verificationToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
  ]);

  return <Result status="success" />;
}

function Wrap({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-10 pb-8 text-center space-y-4">{children}</CardContent>
      </Card>
    </div>
  );
}

function Result({ status }: { status: "success" | "invalid" | "expired" | "already-used" }) {
  const v = getServerDictionary().verify;
  const config = {
    success: {
      icon: <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />,
      title: v.successTitle,
      desc: v.successDesc,
      action: <Button asChild className="w-full"><Link href="/login">{v.loginNow}</Link></Button>,
    },
    "already-used": {
      icon: <CheckCircle2 className="h-16 w-16 text-blue-400 mx-auto" />,
      title: v.alreadyTitle,
      desc: v.alreadyDesc,
      action: <Button asChild className="w-full"><Link href="/login">{v.login}</Link></Button>,
    },
    expired: {
      icon: <Clock className="h-16 w-16 text-amber-500 mx-auto" />,
      title: v.expiredTitle,
      desc: v.expiredDesc,
      action: <Button asChild variant="outline" className="w-full"><Link href="/resend-verification">{v.resend}</Link></Button>,
    },
    invalid: {
      icon: <XCircle className="h-16 w-16 text-destructive mx-auto" />,
      title: v.invalidTitle,
      desc: v.invalidDesc,
      action: <Button asChild variant="outline" className="w-full"><Link href="/resend-verification">{v.resend}</Link></Button>,
    },
  }[status];

  return (
    <Wrap>
      {config.icon}
      <h1 className="text-2xl font-bold">{config.title}</h1>
      <p className="text-muted-foreground text-sm">{config.desc}</p>
      <div className="pt-2">{config.action}</div>
    </Wrap>
  );
}

function InfoPage() {
  const v = getServerDictionary().verify;
  return (
    <Wrap>
      <Mail className="h-16 w-16 text-primary mx-auto" />
      <h1 className="text-2xl font-bold">{v.checkEmailTitle}</h1>
      <p className="text-muted-foreground text-sm">{v.checkEmailDesc}</p>
      <p className="text-xs text-muted-foreground pt-1">
        {v.notSeeEmail}{" "}
        <Link href="/resend-verification" className="text-primary underline">{v.resend}</Link>.
      </p>
    </Wrap>
  );
}
