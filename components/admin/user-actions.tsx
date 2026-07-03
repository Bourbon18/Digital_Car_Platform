"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { suspendUser, unsuspendUser, verifyDealer } from "@/lib/actions/admin";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

interface UserActionsProps {
  user: { id: string; role: string; status: string };
}

export function AdminUserActions({ user }: UserActionsProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  async function handleAction(action: "suspend" | "unsuspend" | "verify") {
    setLoading(action);
    let result: { error?: unknown; success?: boolean };
    if (action === "suspend") result = await suspendUser(user.id, "Vi phạm điều khoản sử dụng");
    else if (action === "unsuspend") result = await unsuspendUser(user.id);
    else result = await verifyDealer(user.id);
    setLoading(null);
    if (result.error) {
      toast({ title: "Lỗi", description: result.error as string, variant: "destructive" });
    } else {
      toast({ title: "Thành công" });
      router.refresh();
    }
  }

  if (user.role === "admin") return null;

  return (
    <div className="flex flex-col gap-2">
      {user.status === "suspended" ? (
        <Button size="sm" variant="outline" onClick={() => handleAction("unsuspend")} disabled={!!loading}>
          {loading === "unsuspend" ? "..." : "Mở khóa"}
        </Button>
      ) : (
        <Button size="sm" variant="outline" onClick={() => handleAction("suspend")} disabled={!!loading} className="text-destructive border-destructive">
          {loading === "suspend" ? "..." : "Khóa tài khoản"}
        </Button>
      )}
      {user.role === "dealer" && (
        <Button size="sm" variant="outline" onClick={() => handleAction("verify")} disabled={!!loading}>
          {loading === "verify" ? "..." : "Xác thực đại lý"}
        </Button>
      )}
    </div>
  );
}
