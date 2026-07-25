"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

// Landing spot for the link in Supabase's confirmation email. The
// Supabase browser client auto-detects the session from the URL as soon
// as this page loads (detectSessionInUrl is on by default), so this page
// just waits briefly for that to land, then continues on to wherever the
// sign-in flow was headed (see emailRedirectTo in lib/supabase/auth.ts).
// Reading the target from window.location instead of useSearchParams
// avoids needing a Suspense boundary here.
export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setError("Backend not configured.");
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const redirectTo = params.get("redirectTo") || "/";
    let cancelled = false;

    async function finish() {
      for (let i = 0; i < 20; i++) {
        const { data } = await supabase!.auth.getSession();
        if (data.session) {
          if (!cancelled) router.replace(redirectTo);
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, 250));
      }
      if (!cancelled) {
        setError("This link is invalid or has expired. Go back and request a new one.");
      }
    }

    finish();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <div className="app-shell items-center justify-center px-8 py-12 text-center">
      {error ? (
        <p className="text-[14px] text-danger">{error}</p>
      ) : (
        <>
          <Loader2 className="h-6 w-6 animate-spin text-gold" />
          <p className="mt-4 text-[14px] text-ink-fg-muted">Confirming your sign-in…</p>
        </>
      )}
    </div>
  );
}
