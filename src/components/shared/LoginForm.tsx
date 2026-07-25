"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Mail, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { requestOtp, verifyOtp } from "@/lib/supabase/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { NotConfiguredNotice } from "@/components/shared/NotConfiguredNotice";
import type { Role } from "@/types/ride";

export function LoginForm({ role, redirectTo }: { role: Role; redirectTo: string }) {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isSupabaseConfigured()) {
    return <NotConfiguredNotice what="Sign-in needs a live Supabase project." />;
  }

  async function handleRequestCode(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const result = await requestOtp(email, role, fullName);
    setLoading(false);
    if (!result.ok) {
      setError(result.error ?? "Could not send code.");
      return;
    }
    setStep("code");
  }

  async function handleVerifyCode(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const result = await verifyOtp(email, code);
    setLoading(false);
    if (!result.ok) {
      setError(result.error ?? "Invalid or expired code.");
      return;
    }
    router.replace(redirectTo);
    router.refresh();
  }

  return (
    <div className="app-shell justify-center px-8 py-12">
      <div className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border-2 border-gold">
          <span className="font-heading text-xl font-bold text-gold">A</span>
        </div>
        <h1 className="mt-5 font-heading text-2xl font-semibold text-ink-fg">
          {role === "rider" ? "Welcome, rider" : "Welcome, driver"}
        </h1>
        <p className="mt-1.5 text-[14px] text-ink-fg-muted">
          {step === "email" ? "Sign in with your email — no password needed." : `Enter the 6-digit code sent to ${email}`}
        </p>
      </div>

      {step === "email" ? (
        <form onSubmit={handleRequestCode} className="mt-10 space-y-4">
          <div>
            <label htmlFor="fullName" className="block text-[13px] font-medium text-ink-fg-muted">
              Full name
            </label>
            <input
              id="fullName"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-ink-border bg-ink-muted px-4 py-3 text-ink-fg outline-none focus:border-gold"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-[13px] font-medium text-ink-fg-muted">
              Email
            </label>
            <div className="relative mt-1.5">
              <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-fg-muted" />
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-ink-border bg-ink-muted py-3 pl-11 pr-4 text-ink-fg outline-none focus:border-gold"
              />
            </div>
          </div>
          {error ? <p className="text-[13px] text-danger">{error}</p> : null}
          <Button type="submit" loading={loading} className="mt-2">
            Send code
          </Button>
        </form>
      ) : (
        <form onSubmit={handleVerifyCode} className="mt-10 space-y-4">
          <div>
            <label htmlFor="code" className="block text-[13px] font-medium text-ink-fg-muted">
              6-digit code
            </label>
            <div className="relative mt-1.5">
              <KeyRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-fg-muted" />
              <input
                id="code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full rounded-xl border border-ink-border bg-ink-muted py-3 pl-11 pr-4 tracking-[0.3em] text-ink-fg outline-none focus:border-gold"
              />
            </div>
          </div>
          {error ? <p className="text-[13px] text-danger">{error}</p> : null}
          <Button type="submit" loading={loading} className="mt-2">
            Verify &amp; continue
          </Button>
          <button
            type="button"
            onClick={() => setStep("email")}
            className="w-full text-center text-[13px] text-ink-fg-muted hover:text-ink-fg"
          >
            Use a different email
          </button>
        </form>
      )}
    </div>
  );
}
