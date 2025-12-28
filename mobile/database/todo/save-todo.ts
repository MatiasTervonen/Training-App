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
  const { error } = await supabase.rpc("todo_save_todo", {
    p_title: title,
    p_todo_list: todoList,
  });

  if (error) {
    console.error("Error saving todo", error);
    handleError(error, {
      message: "Error saving todo",
      route: "/database/todo/save-todo",
      method: "POST",
    });
    throw new Error("Error saving todo");
  }

  return { success: true };
}
