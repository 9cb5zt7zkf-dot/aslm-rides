import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export default async function DriverEntryPage() {
  const supabase = getSupabaseServerClient();
  if (!supabase) redirect("/driver/login");

  const {
    data: { user },
  } = await supabase.auth.getUser();

  redirect(user ? "/driver/home" : "/driver/login");
}
