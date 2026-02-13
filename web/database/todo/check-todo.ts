import { createClient } from "@/utils/supabase/client";
import { handleError } from "@/utils/handleError";

type TodoTaskCheck = {
  updated_at: string;
  list_id: string;
  todo_tasks: {
    id: string | null;
    list_id: string;
    is_completed: boolean;
    position: number;
  }[];
};

export async function checkedTodo({
  updated_at,
  list_id,
  todo_tasks,
}: TodoTaskCheck) {
  const supabase = createClient();

  const { error, data } = await supabase.rpc("todo_check_todo", {
    p_list_id: list_id,
    p_todo_tasks: todo_tasks,
    p_updated_at: updated_at,
  });

  if (error) {
    console.error("Error checking todo", error);
    handleError(error, {
      message: "Error checking todo",
      route: "/database/todo/check-todo",
      method: "RPC",
    });
    throw new Error("Error checking todo");
  }

  return data;
}
