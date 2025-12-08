import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

type TodoTaskCheck = {
  todo_tasks: {
    id: string;
    list_id: string;
    task: string;
    is_completed: boolean;
  }[];
};

export async function checkedTodo({ todo_tasks }: TodoTaskCheck) {

  
  const upsertedTasks = todo_tasks.map((task) => ({
    id: task.id,
    list_id: task.list_id,
    task: task.task,
    is_completed: task.is_completed,
  }));

  const { error: listError } = await supabase
    .from("todo_tasks")
    .upsert(upsertedTasks, { onConflict: "id" });

  if (listError) {
    handleError(listError, {
      message: "Error checking todo tasks",
      route: "/database/todo/check-todo",
      method: "UPDATE",
    });
    throw new Error("Error checking todo tasks");
  }

  return { success: true };
}
