"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface Model { id: string; name: string; active: boolean; }
interface Brand { id: string; name: string; active: boolean; models: Model[]; }

export function BrandsManager({ brands: initial }: { brands: Brand[] }) {
  const [brands] = useState(initial);
  const [expandedBrand, setExpandedBrand] = useState<string | null>(null);
  const [newBrandName, setNewBrandName] = useState("");
  const [newModelName, setNewModelName] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const router = useRouter();

  async function addBrand() {
    if (!newBrandName.trim()) return;
    const res = await fetch("/api/admin/brands", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newBrandName.trim() }),
    });
    if (res.ok) {
      toast({ title: "Đã thêm hãng xe" });
      setNewBrandName("");
      router.refresh();
    }
  }

  async function addModel(brandId: string) {
    const name = newModelName[brandId]?.trim();
    if (!name) return;
    const res = await fetch(`/api/admin/brands/${brandId}/models`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (res.ok) {
      toast({ title: "Đã thêm model" });
      setNewModelName((m) => ({ ...m, [brandId]: "" }));
      router.refresh();
    }
  }

  async function toggleBrand(id: string, active: boolean) {
    await fetch(`/api/admin/brands/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ active: !active }) });
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input value={newBrandName} onChange={(e) => setNewBrandName(e.target.value)} placeholder="Tên hãng xe mới..." className="max-w-xs" />
        <Button onClick={addBrand}>Thêm Hãng</Button>
      </div>

      <div className="space-y-2">
        {brands.map((brand) => (
          <div key={brand.id} className="rounded-lg border">
            <div className="flex items-center justify-between p-3">
              <button className="font-medium text-left hover:text-primary" onClick={() => setExpandedBrand(expandedBrand === brand.id ? null : brand.id)}>
                {brand.name} {expandedBrand === brand.id ? "▲" : "▼"}
              </button>
              <div className="flex items-center gap-2">
                <span className={`text-xs ${brand.active ? "text-green-600" : "text-muted-foreground"}`}>
                  {brand.active ? "Đang hoạt động" : "Tạm ẩn"}
                </span>
                <Button size="sm" variant="outline" onClick={() => toggleBrand(brand.id, brand.active)}>
                  {brand.active ? "Ẩn" : "Hiện"}
                </Button>
              </div>
            </div>

            {expandedBrand === brand.id && (
              <div className="border-t p-3 space-y-2">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {brand.models.map((model) => (
                    <div key={model.id} className={`flex items-center justify-between rounded p-2 border ${model.active ? "" : "opacity-50"}`}>
                      <span>{model.name}</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 pt-2">
                  <Input
                    value={newModelName[brand.id] || ""}
                    onChange={(e) => setNewModelName((m) => ({ ...m, [brand.id]: e.target.value }))}
                    placeholder="Tên model mới..."
                    className="flex-1"
                    onKeyDown={(e) => e.key === "Enter" && addModel(brand.id)}
                  />
                  <Button size="sm" onClick={() => addModel(brand.id)}>Thêm</Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
