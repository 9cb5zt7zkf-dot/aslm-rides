import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export default async function RiderEntryPage() {
  const supabase = getSupabaseServerClient();
  if (!supabase) redirect("/rider/login");

  const {
    data: { user },
  } = await supabase.auth.getUser();

  redirect(user ? "/rider/home" : "/rider/login");
}
