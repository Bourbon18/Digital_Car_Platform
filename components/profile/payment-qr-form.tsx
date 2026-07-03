"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { QrCode, Upload, Trash2, CheckCircle2, AlertTriangle } from "lucide-react";
import { useI18n } from "@/components/i18n/language-provider";

interface PaymentQrFormProps {
  currentQrUrl: string | null;
  currentBankInfo: string | null;
}

export function PaymentQrForm({ currentQrUrl, currentBankInfo }: PaymentQrFormProps) {
  const { toast } = useToast();
  const { t } = useI18n();
  const P = t.pay;
  const randomPhrase = () => P.confirmPhrases[Math.floor(Math.random() * P.confirmPhrases.length)];
  const fileRef = useRef<HTMLInputElement>(null);

  const [qrPreview, setQrPreview] = useState<string | null>(currentQrUrl);
  const [savedQrUrl, setSavedQrUrl] = useState<string | null>(currentQrUrl);
  const [bankInfo, setBankInfo] = useState(currentBankInfo || "");
  const [loading, setLoading] = useState(false);

  // Confirm-to-remove state
  const [confirmMode, setConfirmMode] = useState<"remove" | "change" | null>(null);
  const [confirmInput, setConfirmInput] = useState("");
  const [confirmPhrase, setConfirmPhrase] = useState("");
  const [removing, setRemoving] = useState(false);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: P.qrTooLarge, variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => setQrPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSave() {
    setLoading(true);
    try {
      const res = await fetch("/api/user/payment-qr", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentQrUrl: qrPreview, bankAccountInfo: bankInfo }),
      });
      if (res.ok) {
        setSavedQrUrl(qrPreview);
        toast({ title: P.qrSaved });
      } else {
        const d = await res.json();
        toast({ title: d.error || P.qrSaveErr, variant: "destructive" });
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmRemove() {
    setRemoving(true);
    try {
      const res = await fetch("/api/user/payment-qr", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentQrUrl: null, bankAccountInfo: bankInfo }),
      });
      if (res.ok) {
        setQrPreview(null);
        setSavedQrUrl(null);
        setConfirmMode(null);
        setConfirmInput("");
        if (fileRef.current) fileRef.current.value = "";
        toast({ title: P.qrDeleted });
        if (confirmMode === "change") {
          setTimeout(() => fileRef.current?.click(), 100);
        }
      } else {
        const d = await res.json();
        toast({ title: d.error || P.qrDeleteErr, variant: "destructive" });
      }
    } finally {
      setRemoving(false);
    }
  }

  function cancelConfirm() {
    setConfirmMode(null);
    setConfirmInput("");
  }

  const confirmed = confirmInput.trim().toLowerCase() === confirmPhrase;
  const changed = qrPreview !== savedQrUrl || bankInfo !== (currentBankInfo || "");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <QrCode className="h-4 w-4" />
          {P.qrTitle}
        </CardTitle>
        <CardDescription>
          {P.qrDesc}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* QR Preview */}
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            {qrPreview ? (
              <div className="relative">
                <div className="h-36 w-36 rounded-lg border overflow-hidden bg-white">
                  <Image
                    src={qrPreview}
                    alt="QR"
                    width={144}
                    height={144}
                    className="object-contain w-full h-full"
                    unoptimized
                  />
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileRef.current?.click()}
                className="h-36 w-36 rounded-lg border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors"
              >
                <QrCode className="h-10 w-10 text-muted-foreground/40" />
                <span className="text-xs text-muted-foreground text-center">{P.uploadQrHint}</span>
              </div>
            )}
          </div>

          <div className="flex-1 space-y-3">
            <div className="space-y-1.5">
              <Label>{P.bankInfoLabel}</Label>
              <Input
                value={bankInfo}
                onChange={(e) => setBankInfo(e.target.value)}
                placeholder={P.bankInfoPlaceholder}
              />
              <p className="text-xs text-muted-foreground">
                {P.bankInfoHint}
              </p>
            </div>

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            {savedQrUrl ? (
              <div className="flex gap-2 flex-wrap">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => { setConfirmMode("change"); setConfirmInput(""); setConfirmPhrase(randomPhrase()); }}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {P.changeQr}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-destructive border-destructive hover:bg-destructive/10"
                  onClick={() => { setConfirmMode("remove"); setConfirmInput(""); setConfirmPhrase(randomPhrase()); }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {P.deleteQr}
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileRef.current?.click()}
              >
                <Upload className="mr-2 h-4 w-4" />
                {P.uploadQr}
              </Button>
            )}
          </div>
        </div>

        {/* Confirm remove / change */}
        {confirmMode && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 space-y-3">
            <div className="flex items-center gap-2 text-destructive text-sm font-medium">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              {confirmMode === "remove" ? P.confirmRemove : P.confirmChange}
            </div>
            <p className="text-sm text-muted-foreground">
              {P.typeExact}
            </p>
            <p className="font-mono text-sm font-semibold select-all px-3 py-2 bg-background rounded border w-fit">
              {confirmPhrase}
            </p>
            <Input
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              placeholder={P.typeToConfirm.replace("{phrase}", confirmPhrase)}
              className={confirmed ? "border-green-500 focus-visible:ring-green-500" : ""}
              autoFocus
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="destructive"
                disabled={!confirmed || removing}
                onClick={handleConfirmRemove}
              >
                {removing ? P.deleting : confirmMode === "remove" ? P.deleteQr : P.deleteChangeBtn}
              </Button>
              <Button size="sm" variant="outline" onClick={cancelConfirm} disabled={removing}>
                {P.cancel}
              </Button>
            </div>
          </div>
        )}

        {/* Save new upload */}
        {changed && !confirmMode && (
          <Button onClick={handleSave} disabled={loading} size="sm">
            <CheckCircle2 className="mr-2 h-4 w-4" />
            {loading ? P.saving : P.saveInfo}
          </Button>
        )}

        {!savedQrUrl && !qrPreview && !bankInfo && (
          <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
            {P.noQrWarn}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
