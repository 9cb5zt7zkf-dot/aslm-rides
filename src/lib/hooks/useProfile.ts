"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Profile } from "@/types/ride";

export type ProfileState = {
  loading: boolean;
  profile: Profile | null;
  userId: string | null;
};

// Loads the signed-in user's profile row and keeps it in sync with auth
// state changes (sign-in / sign-out in another tab, session refresh).
export function useProfile(): ProfileState {
  const [state, setState] = useState<ProfileState>({ loading: true, profile: null, userId: null });

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setState({ loading: false, profile: null, userId: null });
      return;
    }

    let active = true;

    async function loadProfile(userId: string | null) {
      if (!userId) {
        if (active) setState({ loading: false, profile: null, userId: null });
        return;
      }
      const { data } = await supabase!.from("profiles").select("*").eq("id", userId).maybeSingle();
      if (active) setState({ loading: false, profile: (data as Profile) ?? null, userId });
    }

    supabase.auth.getSession().then(({ data }) => loadProfile(data.session?.user.id ?? null));

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      loadProfile(session?.user.id ?? null);
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  return state;
}
