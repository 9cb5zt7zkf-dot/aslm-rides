"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Role } from "@/types/ride";

export type AuthResult = { ok: boolean; error?: string };

// Sends a 6-digit one-time code to the given email. `role` and `fullName`
// are attached as user metadata so the database trigger (see
// supabase/schema.sql) can create the matching profile row on first
// sign-in — no separate "create account" step needed.
export async function requestOtp(email: string, role: Role, fullName?: string): Promise<AuthResult> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { ok: false, error: "Backend not configured." };

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      data: { role, full_name: fullName ?? null },
      shouldCreateUser: true,
    },
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function verifyOtp(email: string, token: string): Promise<AuthResult> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { ok: false, error: "Backend not configured." };

  const { error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function signOut(): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return;
  await supabase.auth.signOut();
}
