"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cx } from "@/lib/utils";

export type NavItem = {
  href: string;
  label: string;
  // A rendered icon element (e.g. <Home className="h-5 w-5" />), not the
  // icon component itself. This layout renders inside a Server Component
  // (rider/(app)/layout.tsx, driver/(app)/layout.tsx) — passing the icon
  // *component reference* (a function) as a prop into this Client
  // Component isn't serializable across that boundary and throws
  // "Functions cannot be passed directly to Client Components". A
  // rendered ReactNode is a plain serializable element, so it's safe.
  icon: ReactNode;
};

export function BottomNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="sticky bottom-0 z-40 flex items-center justify-around border-t border-ink-border bg-ink-card/95 px-2 py-2 backdrop-blur">
      {items.map((item) => {
        const href: string = item.href;
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cx(
              "flex flex-1 flex-col items-center gap-1 rounded-xl py-2 text-[11px] font-medium transition-colors",
              active ? "text-gold" : "text-ink-fg-muted"
            )}
          >
            {item.icon}
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
