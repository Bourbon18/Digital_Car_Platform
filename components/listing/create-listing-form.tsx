"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { createListing } from "@/lib/actions/listings";
import { VN_CITIES, cityLabel } from "@/lib/constants";
import { useI18n } from "@/components/i18n/language-provider";

interface Brand { id: string; name: string; slug: string; }
interface Model { id: string; name: string; slug: string; }

type Step = 1 | 2 | 3;

export function CreateListingForm() {
  const router = useRouter();
  const { toast } = useToast();
  const { t, locale } = useI18n();
  const C = t.create;
  const [step, setStep] = useState<Step>(1);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    brandId: "", modelId: "", title: "",
    year: new Date().getFullYear(), mileage: 0, color: "",
    condition: "used", listingType: "for_sale",
    price: 0, pricePerDay: 0, weeklyDiscount: false,
    description: "", city: "", address: "",
    images: [] as { url: string; thumbnailUrl: string; publicId: string; order: number }[],
  });

  useEffect(() => {
    fetch("/api/brands").then((r) => r.json()).then(setBrands);
  }, []);

  useEffect(() => {
    if (form.brandId) {
      fetch(`/api/brands/${form.brandId}/models`).then((r) => r.json()).then(setModels);
    }
  }, [form.brandId]);

  function set(field: string, value: unknown) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (form.images.length + files.length > 10) {
      toast({ title: C.maxImages, variant: "destructive" });
      return;
    }

    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: `${file.name} ${C.imgTooLarge}`, variant: "destructive" });
        continue;
      }
      const fd = new FormData();
      fd.append("file", file);
      fd.append("upload_preset", uploadPreset || "");

      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: "POST", body: fd });
      const data = await res.json();

      if (data.secure_url) {
        const newImage = {
          url: data.secure_url,
          thumbnailUrl: data.secure_url.replace("/upload/", "/upload/c_fill,w_400,h_300,q_auto/"),
          publicId: data.public_id,
          order: form.images.length,
        };
        setForm((f) => ({ ...f, images: [...f.images, newImage] }));
      }
    }
  }

  async function handleSubmit() {
    setLoading(true);
    try {
      const result = await createListing({
        ...form,
        price: Number(form.price),
        pricePerDay: form.listingType === "for_rent" ? Number(form.pricePerDay) : undefined,
        mileage: form.condition === "used" ? Number(form.mileage) : undefined,
        condition: form.condition as "new" | "used",
        listingType: form.listingType as "for_sale" | "for_rent",
      });

      if (result.error) {
        const desc = typeof result.error === "string"
          ? result.error
          : Object.values(result.error).flat().join(", ");
        toast({ title: C.createErr, description: desc || C.checkAgain, variant: "destructive" });
      } else {
        toast({ title: C.submitted });
        router.push("/dashboard/listings");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="flex gap-2">
        {([1, 2, 3] as Step[]).map((s) => (
          <div key={s} className={`flex-1 h-2 rounded-full ${step >= s ? "bg-primary" : "bg-muted"}`} />
        ))}
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{C.stepCar}</span><span>{C.stepImages}</span><span>{C.stepPrice}</span>
      </div>

      {step === 1 && (
        <Card>
          <CardHeader><CardTitle>{C.carInfo}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>{C.brand}</Label>
                <select value={form.brandId} onChange={(e) => set("brandId", e.target.value)} className="w-full rounded-md border border-input px-3 py-2 text-sm">
                  <option value="">{C.selectBrand}</option>
                  {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>{C.model}</Label>
                <select value={form.modelId} onChange={(e) => set("modelId", e.target.value)} className="w-full rounded-md border border-input px-3 py-2 text-sm" disabled={!form.brandId}>
                  <option value="">{C.selectModel}</option>
                  {models.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>{C.title}</Label>
              <Input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder={C.titlePlaceholder} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>{C.year}</Label>
                <Input type="number" min="1980" max={new Date().getFullYear() + 1} value={form.year} onChange={(e) => set("year", Number(e.target.value))} />
              </div>
              <div className="space-y-1.5">
                <Label>{C.color}</Label>
                <Input value={form.color} onChange={(e) => set("color", e.target.value)} placeholder={C.colorPlaceholder} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>{C.condition}</Label>
                <select value={form.condition} onChange={(e) => set("condition", e.target.value)} className="w-full rounded-md border border-input px-3 py-2 text-sm">
                  <option value="used">{C.condUsed}</option>
                  <option value="new">{C.condNew}</option>
                </select>
              </div>
              {form.condition === "used" && (
                <div className="space-y-1.5">
                  <Label>{C.mileage}</Label>
                  <Input type="number" min="0" value={form.mileage} onChange={(e) => set("mileage", Number(e.target.value))} placeholder="50000" />
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>{C.transactionType}</Label>
              <div className="flex gap-3">
                {[{ v: "for_sale", l: C.sell }, { v: "for_rent", l: C.rent }].map((o) => (
                  <label key={o.v} className={`flex-1 flex items-center gap-2 rounded-md border p-3 cursor-pointer ${form.listingType === o.v ? "border-primary bg-primary/5" : ""}`}>
                    <input type="radio" name="type" value={o.v} checked={form.listingType === o.v} onChange={() => set("listingType", o.v)} />
                    {o.l}
                  </label>
                ))}
              </div>
            </div>
            <Button className="w-full" onClick={() => setStep(2)} disabled={!form.brandId || !form.modelId}>{C.next}</Button>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader><CardTitle>{C.imagesTitle} ({form.images.length}/10)</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              {form.images.map((img, i) => (
                <div key={i} className="relative aspect-video rounded-md overflow-hidden bg-muted">
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                  {i === 0 && <div className="absolute top-1 left-1 rounded text-xs bg-primary text-white px-1">{C.coverImage}</div>}
                </div>
              ))}
              {form.images.length < 10 && (
                <label className="flex aspect-video cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed hover:bg-muted/50">
                  <span className="text-2xl">+</span>
                  <span className="text-xs text-muted-foreground">{C.addImage}</span>
                  <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
                </label>
              )}
            </div>
            {form.images.length === 0 && <p className="text-sm text-destructive">{C.needImage}</p>}
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)}>{C.back}</Button>
              <Button className="flex-1" onClick={() => setStep(3)} disabled={form.images.length === 0}>{C.next}</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader><CardTitle>{C.priceDetail}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {form.listingType === "for_sale" ? (
              <div className="space-y-1.5">
                <Label>{C.sellPrice}</Label>
                <Input type="number" min="0" value={form.price || ""} onChange={(e) => set("price", Number(e.target.value))} placeholder="500000000" />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label>{C.rentPrice}</Label>
                  <Input type="number" min="0" value={form.pricePerDay || ""} onChange={(e) => set("pricePerDay", Number(e.target.value))} placeholder="500000" />
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.weeklyDiscount} onChange={(e) => set("weeklyDiscount", e.target.checked)} />
                  <span className="text-sm">{C.weeklyDiscount}</span>
                </label>
              </div>
            )}
            <div className="space-y-1.5">
              <Label>{C.city}</Label>
              <select value={form.city} onChange={(e) => set("city", e.target.value)} className="w-full rounded-md border border-input px-3 py-2 text-sm">
                <option value="">{C.selectCity}</option>
                {VN_CITIES.map((c) => <option key={c} value={c}>{cityLabel(c, locale)}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>{C.addressOpt}</Label>
              <Input value={form.address} onChange={(e) => set("address", e.target.value)} placeholder={C.addressPlaceholder} />
            </div>
            <div className="space-y-1.5">
              <Label>{C.descLabel}</Label>
              <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={5} placeholder={C.descPlaceholder} className="w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(2)}>{C.back}</Button>
              <Button className="flex-1" onClick={handleSubmit} disabled={loading || !form.city || !form.description || (!form.price && !form.pricePerDay)}>
                {loading ? C.posting : C.postBtn}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
