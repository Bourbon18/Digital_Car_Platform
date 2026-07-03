"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { useI18n } from "@/components/i18n/language-provider";

interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void | Promise<void>;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  loading?: boolean;
  /** Hiện ô nhập lý do */
  withReason?: boolean;
  reasonRequired?: boolean;
  reasonLabel?: string;
  reasonPlaceholder?: string;
  quickReasons?: string[];
}

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmText,
  cancelText,
  danger = false,
  loading = false,
  withReason = false,
  reasonRequired = false,
  reasonLabel,
  reasonPlaceholder,
  quickReasons,
}: ConfirmModalProps) {
  const { t } = useI18n();
  const [mounted, setMounted] = useState(false);
  const [reason, setReason] = useState("");

  useEffect(() => setMounted(true), []);
  // Reset lý do mỗi lần mở
  useEffect(() => {
    if (open) setReason("");
  }, [open]);

  if (!open || !mounted) return null;

  const canConfirm =
    !loading && (!withReason || !reasonRequired || reason.trim().length > 0);

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 animate-in fade-in"
      onClick={() => !loading && onClose()}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 mb-4">
          {danger && (
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
          )}
          <div>
            <h3 className="text-lg font-bold">{title}</h3>
            {description && (
              <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
            )}
          </div>
        </div>

        {withReason && (
          <div className="mb-4 space-y-2">
            {reasonLabel && <p className="text-sm font-medium">{reasonLabel}</p>}
            {quickReasons && quickReasons.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {quickReasons.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setReason(r)}
                    className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                      reason === r
                        ? "border-primary bg-primary/10 text-primary"
                        : "hover:bg-muted"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            )}
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder={reasonPlaceholder ?? t.common.enterReason}
              className="w-full rounded-lg border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        )}

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={loading}>
            {cancelText ?? t.common.cancel}
          </Button>
          <Button
            className={`flex-1 ${danger ? "bg-red-600 text-white hover:bg-red-700" : ""}`}
            onClick={() => onConfirm(reason.trim())}
            disabled={!canConfirm}
          >
            {loading ? t.common.processing : (confirmText ?? t.common.confirm)}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
