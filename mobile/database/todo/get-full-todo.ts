import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

export async function getFullTodoSession(id: string) {
  const { data: todoList, error: todoListError } = await supabase
    .from("todo_lists")
    .select(`*, todo_tasks(*)`)
    .eq("id", id)
    .order("position", { ascending: true, referencedTable: "todo_tasks" })
    .single();

  if (todoListError || !todoList) {
    handleError(todoListError, {
      message: "Error fetching todo session",
      route: "/database/get-full-todo",
      method: "GET",
    });

    throw new Error("Error fetching todo session");
  }

  return todoList;
}
