import { redirect } from "next/navigation";
import { Home, Clock, User } from "lucide-react";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { BottomNav } from "@/components/shared/BottomNav";

export default async function RiderAppLayout({ children }: { children: React.ReactNode }) {
  const supabase = getSupabaseServerClient();
  if (!supabase) redirect("/rider/login");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/rider/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile && profile.role !== "rider") redirect("/driver/home");

  return (
    <div className="app-shell">
      <div className="flex-1 pb-4">{children}</div>
      <BottomNav
        items={[
          { href: "/rider/home", label: "Ride", icon: <Home className="h-5 w-5" /> },
          { href: "/rider/history", label: "History", icon: <Clock className="h-5 w-5" /> },
          { href: "/rider/profile", label: "Profile", icon: <User className="h-5 w-5" /> },
        ]}
      />
    </div>
  );
}
