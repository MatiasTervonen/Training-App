import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

export async function getFullTodoSession(id: string) {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session || !session.user) {
    throw new Error("Unauthorized");
  }

  const { data: todoList, error: todoListError } = await supabase
    .from("todo_lists")
    .select(`*, todo_tasks(*)`)
    .eq("user_id", session.user.id)
    .eq("id", id)
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
