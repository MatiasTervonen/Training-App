import { createClient } from "@/utils/supabase/server";
import { NextRequest } from "next/server";

type TodoTask = {
  id: string;
  list_id: string;
  user_id: string;
  task: string;
  notes: string | null;
  is_completed: boolean;
};

export async function POST(req: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = await req.json();
  const { todo_tasks } = body;

  const upsertedTasks = todo_tasks.map((task: TodoTask) => ({
    id: task.id,
    list_id: task.list_id,
    is_completed: task.is_completed,
    user_id: user.id,
  }));

  const { error: listError } = await supabase
    .from("todo_tasks")
    .upsert(upsertedTasks, { onConflict: "id" });

  if (listError) {
    console.error("Supabase error:", listError);
    return new Response(JSON.stringify({ error: listError.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
