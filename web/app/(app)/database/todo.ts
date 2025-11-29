"use server";

import { createClient } from "@/utils/supabase/server";
import { handleError } from "@/app/(app)/utils/handleError";

type TodoTask = {
  task: string;
  notes: string | null;
};

type saveTodoToDBProps = {
  title: string;
  todoList: TodoTask[];
};

export async function saveTodoToDB({ title, todoList }: saveTodoToDBProps) {
  const supabase = await createClient();

  const { data, error: authError } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  const { data: list, error: listError } = await supabase
    .from("todo_lists")
    .insert([
      {
        user_id: user.sub,
        title,
      },
    ])
    .select("id")
    .single();

  if (listError || !list) {
    handleError(listError, {
      message: "Error creating todo list",
      route: "server-action: saveTodoToDB",
      method: "direct",
    });
    throw new Error("Error creating todo list");
  }

  const rows = todoList.map((item: TodoTask) => ({
    user_id: user.sub,
    list_id: list.id,
    task: item.task,
    notes: item.notes,
  }));

  const { error: tasksError } = await supabase.from("todo_tasks").insert(rows);

  if (tasksError) {
    handleError(tasksError, {
      message: "Error saving todo tasks",
      route: "server-action: saveTodoToDB",
      method: "direct",
    });
    throw new Error("Error saving todo tasks");
  }

  return { success: true };
}

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
  const supabase = await createClient();

  const { data, error: authError } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  const { error: listError } = await supabase
    .from("todo_lists")
    .update({ title, updated_at })
    .eq("id", listId)
    .eq("user_id", user.sub);

  if (listError) {
    handleError(listError, {
      message: "Error editing todo list",
      route: "server-action: editTodo",
      method: "direct",
    });
    throw new Error("Error editing todo list");
  }

  const upsertedTasks = tasks.map((task: TodoTaskEdit) => ({
    id: task.id,
    list_id: listId,
    user_id: user.sub,
    task: task.task,
    notes: task.notes ?? null,
  }));

  const { error: taskError } = await supabase
    .from("todo_tasks")
    .upsert(upsertedTasks, { onConflict: "id" });

  if (taskError) {
    handleError(listError, {
      message: "Error editing todo task",
      route: "server-action: editTodo",
      method: "direct",
    });
    throw new Error("Error editing todo task");
  }

  if (deletedIds && deletedIds.length > 0) {
    const { error: deleteError } = await supabase
      .from("todo_tasks")
      .delete()
      .in("id", deletedIds)
      .eq("list_id", listId)
      .eq("user_id", user.sub);

    if (deleteError) {
      handleError(listError, {
        message: "Error deleting todo tasks",
        route: "server-action: editTodo",
        method: "direct",
      });
      throw new Error("Error deleting todo tasks");
    }
  }

  return { success: true };
}

type TodoTaskCheck = {
  todo_tasks: {
    id: string;
    list_id: string;
    task: string;
    is_completed: boolean;
  }[];
};

export async function checkedTodo({ todo_tasks }: TodoTaskCheck) {
  const supabase = await createClient();

  const { data, error: authError } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  const upsertedTasks = todo_tasks.map((task) => ({
    id: task.id,
    list_id: task.list_id,
    task: task.task,
    is_completed: task.is_completed,
    user_id: user.sub,
  }));

  const { error: listError } = await supabase
    .from("todo_tasks")
    .upsert(upsertedTasks, { onConflict: "id" });

  if (listError) {
    handleError(listError, {
      message: "Error checking todo tasks",
      route: "server-action: checkedTodo",
      method: "direct",
    });
    throw new Error("Error checking todo tasks");
  }

  return { success: true };
}

export async function getFullTodoSession(id: string) {
  const supabase = await createClient();

  const { data, error: authError } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  const { data: todoList, error: todoListError } = await supabase
    .from("todo_lists")
    .select(`*, todo_tasks(*)`)
    .eq("user_id", user.sub)
    .eq("id", id)
    .single();

  if (todoListError || !todoList) {
    handleError(todoListError, {
      message: "Error fetching todo session",
      route: "server-actions, getFullTodoSession",
      method: "direct",
    });

    throw new Error("Error fetching todo session");
  }

  return todoList;
}
