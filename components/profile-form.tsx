"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { UserRound, Building2, Save } from "lucide-react";
import { useI18n } from "@/components/i18n/language-provider";

interface User {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  role: string;
  emailChangedAt: Date | null;
  dealerProfile: { businessName: string; showroomAddress: string | null; licenseUrl: string | null } | null;
}

export function ProfileForm({ user }: { user: User & { emailChangedAt: Date | null } }) {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useI18n();
  const P = t.profile;
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: user.name || "",
    phone: user.phone || "",
    businessName: user.dealerProfile?.businessName || "",
    showroomAddress: user.dealerProfile?.showroomAddress || "",
  });

  function set(field: string, value: string) { setForm((f) => ({ ...f, [field]: value })); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/user/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (res.ok) {
      toast({ title: P.profileUpdated });
      router.refresh();
    } else {
      toast({ title: P.updateError, variant: "destructive" });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <UserRound className="h-4 w-4 text-primary" />
              {P.personalInfo}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">{P.fullName}</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder={P.namePlaceholder}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">{P.phone}</Label>
              <Input
                id="phone"
                type="tel"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="0901234567"
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              <Save className="mr-2 h-4 w-4" />
              {loading ? P.saving : P.saveChanges}
            </Button>
          </CardContent>
        </Card>

        {user.role === "dealer" && (
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                {P.dealerInfo}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="businessName">{P.businessName}</Label>
                <Input
                  id="businessName"
                  value={form.businessName}
                  onChange={(e) => set("businessName", e.target.value)}
                  placeholder={P.businessNamePlaceholder}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="showroomAddress">{P.showroomAddress}</Label>
                <Input
                  id="showroomAddress"
                  value={form.showroomAddress}
                  onChange={(e) => set("showroomAddress", e.target.value)}
                  placeholder={P.showroomAddressPlaceholder}
                />
              </div>
            </CardContent>
          </Card>
        )}
    </form>
  );
}
