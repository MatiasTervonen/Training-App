import { supabase } from "@/lib/supabase";
import { handleError } from "@/utils/handleError";

type TodoTask = {
  task: string;
  notes: string | null;
};

type saveTodoToDBProps = {
  title: string;
  todoList: TodoTask[];
};

export default async function saveTodoToDB({
  title,
  todoList,
}: saveTodoToDBProps) {

  const { data: list, error: listError } = await supabase
    .from("todo_lists")
    .insert({
      title,
    })
    .select("id")
    .single();

  if (listError || !list) {
    handleError(listError, {
      message: "Error creating todo list",
      route: "/database/to/save-todo",
      method: "POST",
    });
    throw new Error("Error creating todo list");
  }

  const rows = todoList.map((item: TodoTask) => ({
    list_id: list.id,
    task: item.task,
    notes: item.notes,
  }));

  const { error: tasksError } = await supabase.from("todo_tasks").insert(rows);

  if (tasksError) {
    handleError(tasksError, {
      message: "Error saving todo tasks",
      route: "/database/to/save-todo",
      method: "POST",
    });
    throw new Error("Error saving todo tasks");
  }

  return { success: true };
}
