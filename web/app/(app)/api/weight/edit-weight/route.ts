import { handleError } from "@/app/(app)/utils/handleError";
import { createClient } from "@/utils/supabase/server";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();

  const { id, title, notes, weight } = await req.json();

  const { data, error: authError } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (authError || !user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { error } = await supabase
    .from("weight")
    .update({ title, notes, weight })
    .eq("id", id)
    .eq("user_id", user.sub);

  if (error) {
    handleError(error, {
      message: "Error editing weight entry",
      route: "/api/weight/edit-weight",
      method: "POST",
    });
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
