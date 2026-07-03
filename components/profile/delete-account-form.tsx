"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { deleteAccount } from "@/lib/actions/account";
import { Trash2, TriangleAlert } from "lucide-react";
import { useI18n } from "@/components/i18n/language-provider";

export function DeleteAccountForm({ email }: { email: string }) {
  const { toast } = useToast();
  const { t } = useI18n();
  const P = t.profile;
  const [open, setOpen] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const emailConfirmed = emailInput.trim().toLowerCase() === email.toLowerCase();

  async function handleDelete() {
    if (!emailConfirmed || !password) return;
    setLoading(true);
    const result = await deleteAccount(password);
    setLoading(false);
    if (result?.error) {
      toast({ title: result.error, variant: "destructive" });
    } else {
      // Clear client session then redirect
      await signOut({ callbackUrl: "/?deleted=1" });
    }
  }

  return (
    <Card className="border-destructive/40">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2 text-destructive">
          <Trash2 className="h-4 w-4" />
          {P.deleteAccount}
        </CardTitle>
        <CardDescription>
          {P.deleteDesc}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!open ? (
          <Button
            variant="outline"
            size="sm"
            className="text-destructive border-destructive/50 hover:bg-destructive/10"
            onClick={() => setOpen(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {P.deleteMyAccount}
          </Button>
        ) : (
          <div className="space-y-4">
            {/* Warning */}
            <div className="flex gap-2 rounded-lg bg-destructive/10 border border-destructive/30 p-3 text-sm text-destructive">
              <TriangleAlert className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <p className="font-medium">{P.dataWillDelete}</p>
                <ul className="list-disc list-inside text-xs space-y-0.5 text-destructive/80">
                  <li>{P.delListings}</li>
                  <li>{P.delBookings}</li>
                  <li>{P.delMessages}</li>
                  <li>{P.delAccount}</li>
                </ul>
              </div>
            </div>

            {/* Email confirm */}
            <div className="space-y-1.5">
              <Label className="text-sm">
                {P.confirmEmailPre} <span className="font-mono font-semibold">{email}</span> {P.confirmEmailPost}
              </Label>
              <Input
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder={email}
                className={emailConfirmed ? "border-green-500 focus-visible:ring-green-500" : ""}
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label className="text-sm">{P.currentPassword}</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={P.passwordConfirmPlaceholder}
              />
            </div>

            <div className="flex gap-2 pt-1">
              <Button
                variant="destructive"
                size="sm"
                disabled={!emailConfirmed || !password || loading}
                onClick={handleDelete}
              >
                {loading ? P.deleting : P.deletePermanent}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setOpen(false); setEmailInput(""); setPassword(""); }}
                disabled={loading}
              >
                {P.cancel}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
