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

  const { data, error: authError } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (authError || !user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = await req.json();
  const { id: listId, title, tasks, deletedIds } = body;

  const { error: listError } = await supabase
    .from("todo_lists")
    .update({ title })
    .eq("id", listId)
    .eq("user_id", user.sub);

  if (listError) {
    return new Response(JSON.stringify({ error: listError.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const upsertedTasks = tasks.map((task: TodoTask) => ({
    id: task.id,
    list_id: listId,
    user_id: user.sub,
    task: task.task,
    notes: task.notes ?? null,
  }));

  const { error: taskError } = await supabase
    .from("todo_tasks")
    .upsert(upsertedTasks, { onConflict: "id" });

  if (taskError) {
    return new Response(JSON.stringify({ error: taskError.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (deletedIds && deletedIds.length > 0) {
    const { error: deleteError } = await supabase
      .from("todo_tasks")
      .delete()
      .in("id", deletedIds)
      .eq("list_id", listId)
      .eq("user_id", user.sub);

    if (deleteError) {
      return new Response(JSON.stringify({ error: deleteError.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
