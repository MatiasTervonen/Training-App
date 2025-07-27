import { createClient } from "@/utils/supabase/server";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { searchParams } = new URL(req.url);
  const userName = searchParams.get("name");

  if (!userName) {
    return new Response(
      JSON.stringify({ error: "Missing 'name' query parameter" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const { data, error } = await supabase
    .from("users")
    .select("display_name")
    .ilike("display_name", userName)
    .neq("id", user.id) // Ensure we don't check against the current user's name
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Error cheking username:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const isTaken = !!data;

  return new Response(JSON.stringify({ isTaken }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
