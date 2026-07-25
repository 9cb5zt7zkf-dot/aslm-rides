"use client";

import { useRouter } from "next/navigation";
import { LogOut, Loader2 } from "lucide-react";
import { useProfile } from "@/lib/hooks/useProfile";
import { signOut } from "@/lib/supabase/auth";
import { Button } from "@/components/ui/Button";
import { NotConfiguredNotice } from "@/components/shared/NotConfiguredNotice";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { initials } from "@/lib/utils";

export function ProfileClient({ loginPath, children }: { loginPath: string; children?: React.ReactNode }) {
  const router = useRouter();
  const { loading, profile } = useProfile();

  if (!isSupabaseConfigured()) {
    return <NotConfiguredNotice what="Your profile needs a live Supabase project." />;
  }

  if (loading) {
    return (
      <div className="flex h-full min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-gold" />
      </div>
    );
  }

  async function handleSignOut() {
    await signOut();
    router.replace(loginPath);
    router.refresh();
  }

  return (
    <div className="px-5 py-6">
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-ink-muted font-heading text-xl font-semibold text-gold">
          {initials(profile?.full_name)}
        </div>
        <div>
          <div className="font-heading text-[18px] font-medium text-ink-fg">{profile?.full_name ?? "—"}</div>
          <div className="text-[13px] capitalize text-ink-fg-muted">{profile?.role}</div>
        </div>
      </div>

      {children ? <div className="mt-6">{children}</div> : null}

      <Button variant="secondary" onClick={handleSignOut} className="mt-8">
        <LogOut className="h-4 w-4" />
        Sign out
      </Button>
    </div>
  );
}
