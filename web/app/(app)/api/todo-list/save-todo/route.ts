import { createClient } from "@/utils/supabase/server";
import { NextRequest } from "next/server";
import { handleError } from "@/app/(app)/utils/handleError";

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
  const { title, todoList } = body;

  const { data: list, error: listError } = await supabase
    .from("todo_lists")
    .insert([
      {
        user_id: user.sub,
        title,
      },
    ])
    .select("id")
    .single();

  if (listError || !list) {
    handleError(listError, {
      message: "Error creating todo list",
      route: "/api/todo-list/save-todo",
      method: "POST",
    });
    return new Response(JSON.stringify({ error: listError?.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const rows = todoList.map((item: TodoTask) => ({
    user_id: user.sub,
    list_id: list.id,
    task: item.task,
    notes: item.notes,
  }));

  const { data: tasks, error: tasksError } = await supabase
    .from("todo_tasks")
    .insert(rows)
    .select();

  if (tasksError || !tasks) {
    handleError(tasksError, {
      message: "Error saving todo tasks",
      route: "/api/todo-list/save-todo",
      method: "POST",
    });
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
