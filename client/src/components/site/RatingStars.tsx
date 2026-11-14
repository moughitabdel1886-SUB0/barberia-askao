import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function RatingStars({ rating, className }: { rating: number; className?: string }) {
  const percentage = Math.max(0, Math.min(100, (rating / 5) * 100));

  return (
    <span
      className={cn("relative inline-flex w-max", className)}
      role="img"
      aria-label={`${rating.toFixed(1)} / 5`}
    >
      <span className="flex gap-0.5 text-ink/15" aria-hidden="true">
        {Array.from({ length: 5 }, (_, index) => (
          <Star key={index} className="h-4 w-4 fill-current" strokeWidth={0} />
        ))}
      </span>
      <span
        className="absolute inset-y-0 left-0 overflow-hidden"
        style={{ width: `${percentage}%` }}
        aria-hidden="true"
      >
        <span className="flex gap-0.5 text-[#e6a23c]">
          {Array.from({ length: 5 }, (_, index) => (
            <Star key={index} className="h-4 w-4 shrink-0 fill-current" strokeWidth={0} />
          ))}
        </span>
      </span>
    </span>
  );
}
