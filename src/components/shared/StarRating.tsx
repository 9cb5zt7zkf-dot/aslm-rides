"use client";

import { Star } from "lucide-react";
import { cx } from "@/lib/utils";

export function StarRating({
  value,
  onChange,
  size = 28,
  readOnly = false,
}: {
  value: number;
  onChange?: (stars: number) => void;
  size?: number;
  readOnly?: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={readOnly}
          onClick={() => onChange?.(n)}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
          className={cx(!readOnly && "cursor-pointer")}
        >
          <Star
            width={size}
            height={size}
            className={n <= value ? "fill-gold text-gold" : "fill-transparent text-ink-border"}
          />
        </button>
      ))}
    </div>
  );
}
