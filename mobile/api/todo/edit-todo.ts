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
  id: string;
  task: string;
  notes?: string;
};

export async function editTodo({
  id: listId,
  title,
  tasks,
  deletedIds,
  updated_at,
}: TodoListEdit) {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session || !session.user) {
    throw new Error("Unauthorized");
  }

  const { error: listError } = await supabase
    .from("todo_lists")
    .update({ title, updated_at })
    .eq("id", listId)
    .eq("user_id", session.user.id);

  if (listError) {
    handleError(listError, {
      message: "Error editing todo list",
      route: "/database/to/edit-todo",
      method: "UPDATE",
    });
    throw new Error("Error editing todo list");
  }

  const upsertedTasks = tasks.map((task: TodoTaskEdit) => ({
    id: task.id,
    list_id: listId,
    user_id: session.user.id,
    task: task.task,
    notes: task.notes ?? null,
  }));

  const { error: taskError } = await supabase
    .from("todo_tasks")
    .upsert(upsertedTasks, { onConflict: "id" });

  if (taskError) {
    handleError(listError, {
      message: "Error editing todo task",
      route: "/database/to/edit-todo",
      method: "UPDATE",
    });
    throw new Error("Error editing todo task");
  }

  if (deletedIds && deletedIds.length > 0) {
    const { error: deleteError } = await supabase
      .from("todo_tasks")
      .delete()
      .in("id", deletedIds)
      .eq("list_id", listId)
      .eq("user_id", session.user.id);

    if (deleteError) {
      handleError(listError, {
        message: "Error deleting todo tasks",
        route: "/database/to/edit-todo",
        method: "UPDATE",
      });
      throw new Error("Error deleting todo tasks");
    }
  }

  return { success: true };
}
