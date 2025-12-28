import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

type TodoListEdit = {
  id: string;
  title: string;
  tasks: TodoTaskEdit[];
  deletedIds: string[];
  updated_at: string;
};

type TodoTaskEdit = {
  id: string | null;
  task: string;
  notes?: string;
  position: number;
  updated_at: string;
};

export async function editTodo({
  id,
  title,
  tasks,
  deletedIds,
  updated_at,
}: TodoListEdit) {
  console.log("tasks", tasks);

  const { error } = await supabase.rpc("todo_edit_todo", {
    p_id: id,
    p_title: title,
    p_tasks: tasks,
    p_deleted_ids: deletedIds,
    p_updated_at: updated_at,
  });

  if (error) {
    console.error("Error editing todo", error);
    handleError(error, {
      message: "Error editing todo list",
      route: "/database/todo/edit-todo",
      method: "RPC",
    });
    throw new Error("Error editing todo list");
  }

  return { success: true };
}
