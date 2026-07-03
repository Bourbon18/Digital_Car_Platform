"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Crown, QrCode, Trash2, Upload, Clock, AlertTriangle, Plus, Lock } from "lucide-react";
import { useI18n } from "@/components/i18n/language-provider";

interface Channel {
  id: string;
  qrUrl: string;
  bankInfo: string | null;
  label: string | null;
}

interface Props {
  planName: string;
  maxExtra: number; // số cổng bổ sung được phép (Business = 2, khác = 0)
  planExpiresAt: string | null;
  initialChannels: Channel[];
}

function useCountdown(target: string | null) {
  // null cho tới khi mount → server & lần render client đầu khớp nhau (tránh hydration error)
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    if (!target) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [target]);
  if (!target || now === null) return null;
  const ms = new Date(target).getTime() - now;
  if (ms <= 0) return { expired: true, d: 0, h: 0, m: 0, s: 0, days: 0 };
  const sec = Math.floor(ms / 1000);
  return {
    expired: false,
    days: Math.floor(sec / 86400),
    d: Math.floor(sec / 86400),
    h: Math.floor((sec % 86400) / 3600),
    m: Math.floor((sec % 3600) / 60),
    s: sec % 60,
  };
}

const pad = (n: number) => String(n).padStart(2, "0");

export function BusinessPaymentChannels({ planName, maxExtra, planExpiresAt, initialChannels }: Props) {
  const { toast } = useToast();
  const { t, locale } = useI18n();
  const P = t.pay;
  const dateLocale = locale === "en" ? "en-GB" : "vi-VN";
  const fileRef = useRef<HTMLInputElement>(null);
  const [channels, setChannels] = useState<Channel[]>(initialChannels);
  const [qrPreview, setQrPreview] = useState<string | null>(null);
  const [bankInfo, setBankInfo] = useState("");
  const [label, setLabel] = useState("");
  const [saving, setSaving] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const cd = useCountdown(planExpiresAt);

  // Không phải Business → thẻ mời nâng cấp
  if (maxExtra <= 0) {
    return (
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Lock className="h-4 w-4 text-muted-foreground" />
            {P.bizTitle}
          </CardTitle>
          <CardDescription>
            {P.bizLockedDesc}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild size="sm" variant="outline">
            <Link href="/dashboard/subscription">
              <Crown className="mr-2 h-4 w-4" /> {P.bizUpgrade}
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: P.bizOnlyImage, variant: "destructive" });
      return;
    }
    if (file.size >= 1024 * 1024) {
      toast({ title: P.bizImgTooLarge, description: P.bizImgTooLargeDesc, variant: "destructive" });
      e.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => setQrPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  async function handleAdd() {
    if (!qrPreview) {
      toast({ title: P.bizNeedQr, variant: "destructive" });
      return;
    }
    setSaving(true);
    const res = await fetch("/api/user/payment-channels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ qrUrl: qrPreview, bankInfo, label }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      toast({ title: P.error, description: data.error, variant: "destructive" });
      return;
    }
    setChannels((c) => [...c, data.channel]);
    setQrPreview(null);
    setBankInfo("");
    setLabel("");
    if (fileRef.current) fileRef.current.value = "";
    toast({ title: P.bizAdded });
  }

  async function handleRemove(id: string) {
    setRemovingId(id);
    const res = await fetch(`/api/user/payment-channels?id=${id}`, { method: "DELETE" });
    setRemovingId(null);
    if (!res.ok) {
      const d = await res.json();
      toast({ title: P.error, description: d.error, variant: "destructive" });
      return;
    }
    setChannels((c) => c.filter((ch) => ch.id !== id));
    toast({ title: P.bizRemoved });
  }

  const expired = cd?.expired ?? false;
  const nearExpiry = cd && !cd.expired && cd.days < 30;
  const canAdd = !expired && channels.length < maxExtra;

  return (
    <Card className="border-amber-200">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Crown className="h-4 w-4 text-amber-500" />
          {P.bizTitle}
          <Badge className="bg-amber-500 hover:bg-amber-600">{planName}</Badge>
        </CardTitle>
        <CardDescription>
          {P.bizDesc
            .split("{max}").join(String(maxExtra))
            .replace("{plan}", planName)
            .replace("{used}", String(channels.length))}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Hết hạn + đếm ngược */}
        {cd && !cd.expired && (
          <div className="rounded-lg border bg-muted/30 px-4 py-3">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-amber-600" />
              <span>{P.bizValidFor}</span>
              <span className="font-mono font-semibold tabular-nums">
                {cd.d} {P.days} {pad(cd.h)}:{pad(cd.m)}:{pad(cd.s)}
              </span>
            </div>
            {planExpiresAt && (
              <p className="mt-1 text-xs text-muted-foreground">
                {P.bizExpires} {new Date(planExpiresAt).toLocaleString(dateLocale)}
              </p>
            )}
          </div>
        )}

        {/* Ghi chú luôn hiển thị về việc xóa khi hết hạn */}
        <p className="text-xs text-muted-foreground">{P.bizDeleteNote}</p>

        {/* Cảnh báo gần hết hạn */}
        {nearExpiry && (
          <div className="rounded-lg border-2 border-amber-300 bg-amber-50 px-4 py-3 space-y-2">
            <div className="flex items-start gap-2 text-sm text-amber-800">
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>
                {P.bizNearExpiry.replace("{days}", String(cd!.days)).replace("{n}", String(channels.length))}
              </span>
            </div>
            <Button asChild size="sm" className="bg-amber-500 hover:bg-amber-600 text-white">
              <Link href="/dashboard/subscription">{P.bizRenew}</Link>
            </Button>
          </div>
        )}

        {/* Danh sách cổng bổ sung */}
        {channels.length > 0 && (
          <div className="space-y-3">
            {channels.map((ch) => (
              <div key={ch.id} className="rounded-lg border p-3 flex gap-3">
                <div className="h-20 w-20 flex-shrink-0 rounded-md border bg-white overflow-hidden">
                  <Image src={ch.qrUrl} alt="QR" width={80} height={80} className="object-contain w-full h-full" unoptimized />
                </div>
                <div className="flex-1 min-w-0">
                  {ch.label && <p className="font-medium text-sm truncate">{ch.label}</p>}
                  {ch.bankInfo && <p className="text-xs text-muted-foreground line-clamp-2">{ch.bankInfo}</p>}
                  <button
                    onClick={() => handleRemove(ch.id)}
                    disabled={removingId === ch.id}
                    className="mt-2 inline-flex items-center gap-1 text-xs text-destructive hover:underline disabled:opacity-50"
                  >
                    <Trash2 className="h-3 w-3" /> {removingId === ch.id ? P.bizRemoving : P.bizRemove}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Gói đã hết hạn → chặn hoàn toàn việc thêm cổng cho tới khi gia hạn */}
        {expired ? (
          <div className="rounded-lg border-2 border-destructive/30 bg-destructive/5 px-4 py-3 space-y-2">
            <div className="flex items-start gap-2 text-sm text-destructive">
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <div>
                <p className="font-medium">{P.bizExpired}</p>
                <p className="mt-0.5 text-xs text-destructive/80">{P.bizExpiredNote}</p>
              </div>
            </div>
            <Button asChild size="sm" className="bg-amber-500 text-white hover:bg-amber-600">
              <Link href="/dashboard/subscription">{P.bizRenew}</Link>
            </Button>
          </div>
        ) : /* Form thêm cổng */ canAdd ? (
          <div className="rounded-lg border border-dashed p-4 space-y-3">
            <p className="text-sm font-medium flex items-center gap-1.5">
              <Plus className="h-4 w-4" /> {P.bizAddNew}
            </p>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
            <div className="flex items-start gap-3">
              {qrPreview ? (
                <div className="h-24 w-24 flex-shrink-0 rounded-md border bg-white overflow-hidden">
                  <Image src={qrPreview} alt="QR" width={96} height={96} className="object-contain w-full h-full" unoptimized />
                </div>
              ) : (
                <div
                  onClick={() => fileRef.current?.click()}
                  className="h-24 w-24 flex-shrink-0 rounded-md border-2 border-dashed flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-primary/50 hover:bg-muted/30"
                >
                  <QrCode className="h-7 w-7 text-muted-foreground/40" />
                  <span className="text-[10px] text-muted-foreground text-center">{P.bizUploadQr}</span>
                </div>
              )}
              <div className="flex-1 space-y-2">
                <div className="space-y-1">
                  <Label className="text-xs">{P.bizChannelName}</Label>
                  <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder={P.bizChannelNamePlaceholder} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{P.bizAccountInfo}</Label>
                  <Input value={bankInfo} onChange={(e) => setBankInfo(e.target.value)} placeholder={P.bizAccountPlaceholder} />
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              {qrPreview && (
                <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()}>
                  <Upload className="mr-1.5 h-3.5 w-3.5" /> {P.bizChangeImg}
                </Button>
              )}
              <Button size="sm" onClick={handleAdd} disabled={saving || !qrPreview}>
                {saving ? P.bizAdding : P.bizAdd}
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">{P.bizMaxReached.replace("{max}", String(maxExtra))}</p>
        )}
      </CardContent>
    </Card>
  );
}
