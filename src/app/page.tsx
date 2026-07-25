import Link from "next/link";
import { Car, Users } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="app-shell items-center justify-center px-8 py-12">
      <div className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2 border-gold">
          <span className="font-heading text-2xl font-bold text-gold">A</span>
        </div>
        <h1 className="mt-6 font-heading text-3xl font-semibold text-ink-fg">ASLM Rides</h1>
        <p className="mt-2 text-[14.5px] text-ink-fg-muted">
          Dubai&rsquo;s premium chauffeur network, on demand.
        </p>
      </div>

      <div className="mt-14 w-full space-y-4">
        <Link
          href="/rider"
          className="flex items-center gap-4 rounded-2xl border border-ink-border bg-ink-card p-5 transition-colors hover:border-gold/50"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-gold text-black">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <div className="font-heading text-[16px] font-medium text-ink-fg">I need a ride</div>
            <div className="text-[13px] text-ink-fg-muted">Book a car in minutes</div>
          </div>
        </Link>

        <Link
          href="/driver"
          className="flex items-center gap-4 rounded-2xl border border-ink-border bg-ink-card p-5 transition-colors hover:border-gold/50"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ink-muted text-gold">
            <Car className="h-5 w-5" />
          </div>
          <div>
            <div className="font-heading text-[16px] font-medium text-ink-fg">I&rsquo;m a driver</div>
            <div className="text-[13px] text-ink-fg-muted">Go online and earn</div>
          </div>
        </Link>
      </div>
    </div>
  );
}
