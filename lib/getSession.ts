import { createClient } from "@/utils/supabase/server";
import { Session } from "@/types/session";


export default async function GetSession(): Promise<{
  session: Session[];
  error: Error | null;
}> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    console.log("Authenication error:", authError);
    return { session: [], error: authError || new Error("User not found") };
  }

  const { data: session, error: sessionError } = await supabase
    .from("sessions")
    .select("*")
    .eq("user_id", user.id);

  if (sessionError) {
    console.log("Session error:", sessionError);
    return { session: [], error: sessionError };
  }

  return { session, error: null };
}
