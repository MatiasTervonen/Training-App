import { handleError } from "@/app/(app)/utils/handleError";
import { createClient } from "@/utils/supabase/server";

export async function GET() {
  const supabase = await createClient();

  const { data, error: authError } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (authError || !user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { data: reminders, error } = await supabase
    .from("reminders")
    .select("*")
    .eq("user_id", user.sub);

  if (error) {
    handleError(error, {
      message: "Error fetting reminders",
      route: "/api/reminders/get-reminders",
      method: "POST",
    });
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify(reminders), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
