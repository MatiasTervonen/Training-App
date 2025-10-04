import { createClient } from "@/utils/supabase/server";

export async function GET(req: Request) {
  const supabase = await createClient();

  const { data, error: authError } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (authError || !user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("id");

  if (!sessionId) {
    return new Response("Missing session ID", { status: 400 });
  }

  const { data: todoList, error: todoListError } = await supabase
    .from("todo_lists")
    .select(`*, todo_tasks(*)`)
    .eq("user_id", user.sub)
    .eq("id", sessionId)
    .single();

  if (todoListError || !todoList) {
    console.error("Supabase Insert Error:", todoListError);
    return new Response(JSON.stringify({ error: todoListError?.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify(todoList), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
