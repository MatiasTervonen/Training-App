"use client";

import { useEffect } from "react";
import { useDebouncedCallback } from "use-debounce";

type TodoItem = {
  task: string;
  notes: string | null;
};

export default function useSaveDraft({
  title,
  task,
  notes,
  todoList,
  setTitle,
  setTask,
  setNotes,
  setTodoList,
  setIsLoaded,
  isLoaded,
}: {
  title: string;
  task: string;
  notes: string;
  todoList: TodoItem[];
  setTitle: (title: string) => void;
  setTask: (task: string) => void;
  setNotes: (notes: string) => void;
  setTodoList: (todoList: TodoItem[]) => void;
  setIsLoaded: (isLoaded: boolean) => void;
  isLoaded: boolean;
}) {
  const saveTodoDraft = useDebouncedCallback(
    () => {
      if (!isLoaded) return;

      if (title.trim() === "" && todoList.length === 0) {
        localStorage.removeItem("todo_draft");
      } else {
        const draft = {
          title,
          task,
          notes,
          todoList: todoList,
        };
        localStorage.setItem("todo_draft", JSON.stringify(draft));
      }
    },
    500,
    { maxWait: 3000 }
  );

  useEffect(() => {
    const draft = localStorage.getItem("todo_draft");
    if (draft) {
      const {
        title: savedTitle,
        task: savedTask,
        notes: savedNotes,
        todoList: savedTodoList,
      } = JSON.parse(draft);
      if (savedTitle) setTitle(savedTitle);
      if (savedTask) setTask(savedTask);
      if (savedNotes) setNotes(savedNotes);
      if (savedTodoList) setTodoList(savedTodoList);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    saveTodoDraft();
  }, [title, notes, todoList, task, saveTodoDraft]);

  return {
    saveTodoDraft,
  };
}
