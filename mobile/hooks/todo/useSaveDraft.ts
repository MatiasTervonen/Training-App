import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useDebouncedCallback } from "use-debounce";
import { handleError } from "@/utils/handleError";

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
}: {
  title: string;
  task: string;
  notes: string;
  todoList: TodoItem[];
  setTitle: (title: string) => void;
  setTask: (task: string) => void;
  setNotes: (notes: string) => void;
  setTodoList: (todoList: TodoItem[]) => void;
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  
  useEffect(() => {
    const loadDraft = async () => {
      try {
        const storeDraft = await AsyncStorage.getItem("todo_draft");
        if (storeDraft) {
          const draft = JSON.parse(storeDraft);
          setTitle(draft.title || "");
          setTask(draft.task || "");
          setNotes(draft.notes || "");
          setTodoList(draft.todoList || "");
        }
      } catch (error) {
        handleError(error, {
          message: "Error loading todo draft",
          route: "todo/index.tsx",
          method: "loadDraft",
        });
      } finally {
        setIsLoaded(true);
      }
    };
    loadDraft();
  }, [setIsLoaded, setTitle, setTask, setNotes, setTodoList]);

  const saveTodoDraft = useDebouncedCallback(
    async () => {
      if (!isLoaded) return;

      if (title.trim() === "" && todoList.length === 0) {
        await AsyncStorage.removeItem("todo_draft");
      } else {
        const draft = {
          title,
          task,
          notes,
          todoList: todoList,
        };
        await AsyncStorage.setItem("todo_draft", JSON.stringify(draft));
      }
    },
    500,
    { maxWait: 3000 }
  );

  useEffect(() => {
    saveTodoDraft();
  }, [title, notes, todoList, task, saveTodoDraft]);
  
  return {
    saveTodoDraft,
  };
}
