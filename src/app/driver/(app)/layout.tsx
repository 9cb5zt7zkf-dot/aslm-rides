import { redirect } from "next/navigation";
import { Car, Wallet, User } from "lucide-react";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { BottomNav } from "@/components/shared/BottomNav";

export default async function DriverAppLayout({ children }: { children: React.ReactNode }) {
  const supabase = getSupabaseServerClient();
  if (!supabase) redirect("/driver/login");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/driver/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile && profile.role !== "driver") redirect("/rider/home");

  return (
    <div className="app-shell">
      <div className="flex-1 pb-4">{children}</div>
      <BottomNav
        items={[
          { href: "/driver/home", label: "Drive", icon: <Car className="h-5 w-5" /> },
          { href: "/driver/earnings", label: "Earnings", icon: <Wallet className="h-5 w-5" /> },
          { href: "/driver/profile", label: "Profile", icon: <User className="h-5 w-5" /> },
        ]}
      />
    </div>
  );
}
