"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createReview } from "@/lib/actions/reviews";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/components/i18n/language-provider";

export function ReviewForm({ bookingId }: { bookingId: string }) {
  const { t } = useI18n();
  const c = t.car;
  const [rating, setRating] = useState(5);
  const [hovered, setHovered] = useState(0);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (content.trim().length < 10) {
      toast({ title: c.reviewMinLen, variant: "destructive" });
      return;
    }
    setLoading(true);
    const result = await createReview({ bookingId, rating, content: content.trim() });
    setLoading(false);
    if (result.error) {
      toast({ title: t.common.error, description: result.error as string, variant: "destructive" });
    } else {
      toast({ title: c.reviewThanks });
      setContent("");
      router.refresh();
    }
  }

  const displayRating = hovered || rating;

  return (
    <form onSubmit={handleSubmit} id="review" className="space-y-4 rounded-lg border p-4">
      <h3 className="font-semibold">{c.writeReview}</h3>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            className={`text-2xl transition-colors ${star <= displayRating ? "text-yellow-400" : "text-muted-foreground"}`}
          >
            ★
          </button>
        ))}
        <span className="ml-2 text-sm text-muted-foreground self-center">{rating}/5 {c.starsSuffix}</span>
      </div>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={4}
        placeholder={c.reviewPlaceholder}
        maxLength={500}
        className="w-full rounded-md border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        required
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{content.length}/500 {c.chars}</span>
        <Button type="submit" disabled={loading}>{loading ? c.sending : c.submitReview}</Button>
      </div>
    </form>
  );
}
