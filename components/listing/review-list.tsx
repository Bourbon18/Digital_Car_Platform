import { Star } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { ReviewReportButton } from "@/components/listing/review-report-button";
import { getServerDictionary } from "@/lib/i18n/server";

interface Review {
  id: string;
  reviewerId: string;
  rating: number;
  content: string;
  createdAt: Date;
  reviewer: { name?: string | null; avatarUrl?: string | null };
}

interface ReviewListProps {
  reviews: Review[];
  listingId: string;
  currentUserId?: string | null;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`h-4 w-4 ${s <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`}
        />
      ))}
    </div>
  );
}

export function ReviewList({ reviews, currentUserId }: ReviewListProps) {
  const c = getServerDictionary().car;
  if (reviews.length === 0) {
    return (
      <div className="rounded-lg border p-4">
        <h2 className="font-semibold mb-3">{c.reviewsTitle}</h2>
        <p className="text-sm text-muted-foreground">{c.noReviews}</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border p-4">
      <h2 className="font-semibold mb-4">{c.reviewsTitle} ({reviews.length})</h2>
      <div className="space-y-4">
        {reviews.map((review) => (
          <div key={review.id} className="border-b pb-4 last:border-0 last:pb-0">
            <div className="flex items-start justify-between gap-2">
              <div className="font-medium text-sm">{review.reviewer.name || c.anonymous}</div>
              <div className="text-xs text-muted-foreground">{formatDate(review.createdAt)}</div>
            </div>
            <StarRating rating={review.rating} />
            <p className="mt-2 text-sm text-muted-foreground">{review.content}</p>
            {currentUserId && currentUserId !== review.reviewerId && (
              <div className="mt-2">
                <ReviewReportButton reviewId={review.id} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
