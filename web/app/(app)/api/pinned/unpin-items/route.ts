import { createClient } from "@/utils/supabase/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { item_id, table } = await req.json();

  const { data, error: authError } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (authError || !user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { error } = await supabase
    .from("pinned_items")
    .delete()
    .eq("user_id", user.sub)
    .eq("type", table)
    .eq("item_id", item_id);

  if (error) return new Response(JSON.stringify({ error }), { status: 500 });

  return new Response("Unpinned", { status: 200 });
}
