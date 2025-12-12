import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

type TodoTaskCheck = {
  updated_at: string;
  listId: string;
  todo_tasks: {
    id: string;
    list_id: string;
    task: string;
    is_completed: boolean;
    position: number;
  }[];
};

export async function checkedTodo({
  updated_at,
  listId,
  todo_tasks,
}: TodoTaskCheck) {
  const { error: listError } = await supabase
    .from("todo_lists")
    .update({ updated_at })
    .eq("id", listId);

  if (listError) {
    handleError(listError, {
      message: "Error editing todo list",
      route: "server-action: checkedTodo",
      method: "direct",
    });
    throw new Error("Error editing todo list");
  }

  const upsertedTasks = todo_tasks.map((task) => ({
    id: task.id,
    list_id: task.list_id,
    task: task.task,
    is_completed: task.is_completed,
    position: task.position,
  }));

  const { error: taskError } = await supabase
    .from("todo_tasks")
    .upsert(upsertedTasks, { onConflict: "id" });

  if (taskError) {
    handleError(taskError, {
      message: "Error checking todo tasks",
      route: "server-action: checkedTodo",
      method: "direct",
    });
    throw new Error("Error checking todo tasks");
  }

  return { success: true };
}
