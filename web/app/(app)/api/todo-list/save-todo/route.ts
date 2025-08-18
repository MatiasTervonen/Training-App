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
  const { title, todoList } = body;

  const { data: list, error: listError } = await supabase
    .from("todo_lists")
    .insert([
      {
        user_id: user.id,
        title,
      },
    ])
    .select("id")
    .single();

  if (listError || !list) {
    console.error("Supabase Insert Error:", listError);
    return new Response(JSON.stringify({ error: listError?.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const rows = todoList.map((item: TodoTask) => ({
    user_id: user.id,
    list_id: list.id,
    task: item.task,
    notes: item.notes,
  }));

  const { data: tasks, error: tasksError } = await supabase
    .from("todo_tasks")
    .insert(rows)
    .select();

  if (tasksError || !tasks) {
    console.error("Supabase Insert Error:", tasksError);
    return new Response(JSON.stringify({ error: tasksError?.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
