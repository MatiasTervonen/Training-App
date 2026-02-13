import { createClient } from "@/utils/supabase/client";
import { handleError } from "@/utils/handleError";

type TodoTask = {
  task: string;
  notes: string | null;
};

type saveTodoProps = {
  title: string;
  todoList: TodoTask[];
};

export async function saveTodo({ title, todoList }: saveTodoProps) {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("todo_save_todo", {
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

  return data;
}
