import { createClient } from "@/utils/supabase/server";
import { headers } from "next/headers";

export async function GET() {
  const authHeader = (await headers()).get("authorization");
  const token = authHeader?.replace("Bearer ", "");

  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = token
    ? await supabase.auth.getUser(token) // manually pass token
    : await supabase.auth.getUser(); // fall back to cookie

  if (authError || !user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { data, error } = await supabase
    .from("users")
    .select("display_name, weight_unit, profile_picture")
    .eq("id", user.id)
    .single();

  if (error) {
    console.error("Error fetching settings:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
