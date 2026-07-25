import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cx } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "bg-gradient-gold text-black hover:brightness-105 disabled:opacity-50",
  secondary: "bg-ink-muted text-ink-fg border border-ink-border hover:border-gold/50",
  ghost: "bg-transparent text-ink-fg-muted hover:text-ink-fg",
  danger: "bg-danger/15 text-danger border border-danger/30 hover:bg-danger/25",
};

export function Button({
  children,
  variant = "primary",
  className,
  loading,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; loading?: boolean; children: ReactNode }) {
  return (
    <button
      {...props}
      disabled={props.disabled || loading}
      className={cx(
        "inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3.5 text-[15px] font-medium transition-all disabled:cursor-not-allowed",
        VARIANT_CLASSES[variant],
        className
      )}
    >
      {loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> : null}
      {children}
    </button>
  );
}
