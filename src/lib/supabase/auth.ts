"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Role } from "@/types/ride";

export type AuthResult = { ok: boolean; error?: string };

// Sends a confirmation email to sign in / sign up. `role` and `fullName`
// are attached as user metadata so the database trigger (see
// supabase/schema.sql) can create the matching profile row on first
// sign-in — no separate "create account" step needed.
//
// Note on email content: Supabase's default (no custom SMTP) email
// templates cannot be edited from the dashboard, so a fresh sign-up gets
// the stock "Confirm signup" email, which contains a confirmation link —
// not a 6-digit code. `emailRedirectTo` points that link at
// /auth/callback, which finishes sign-in and sends the user on to
// `redirectTo`. If a project later sets up custom SMTP and edits the
// template to include `{{ .Token }}`, the code field in LoginForm still
// works as a fallback via `verifyOtp`.
export async function requestOtp(
  email: string,
  role: Role,
  fullName: string | undefined,
  redirectTo: string
): Promise<AuthResult> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { ok: false, error: "Backend not configured." };

  const emailRedirectTo =
    typeof window !== "undefined"
      ? `${window.location.origin}/auth/callback?redirectTo=${encodeURIComponent(redirectTo)}`
      : undefined;

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      data: { role, full_name: fullName ?? null },
      shouldCreateUser: true,
      emailRedirectTo,
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
