import { createClient } from "@/utils/supabase/client";
import { handleError } from "@/utils/handleError";

type TodoListEdit = {
  id: string;
  title: string;
  tasks: TodoTaskEdit[];
  deletedIds: string[];
  updated_at: string;
};

type TodoTaskEdit = {
  id?: string;
  temp_id?: string;
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
  const supabase = createClient();

  const { data, error } = await supabase.rpc("todo_edit_todo", {
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

  const result = data as {
    feed_item: Record<string, unknown>;
    new_task_ids: Record<string, string>;
  };

  return result;
}
