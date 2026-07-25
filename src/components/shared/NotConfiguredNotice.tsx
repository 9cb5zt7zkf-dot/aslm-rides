import { AlertTriangle } from "lucide-react";

export function NotConfiguredNotice({ what }: { what: string }) {
  return (
    <div className="app-shell items-center justify-center px-8 text-center">
      <AlertTriangle className="h-10 w-10 text-gold" />
      <h1 className="mt-4 font-heading text-xl font-semibold text-ink-fg">Backend not configured</h1>
      <p className="mt-2 text-[14px] leading-relaxed text-ink-fg-muted">
        {what} Add the required environment variables (see .env.example / README) in Vercel, then redeploy.
      </p>
    </div>
  );
}
