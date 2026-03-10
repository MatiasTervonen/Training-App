import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useDebouncedCallback } from "use-debounce";
import { handleError } from "@/utils/handleError";
import { DraftRecording, DraftImage, DraftVideo } from "@/types/session";

export type TodoItem = {
  tempId: string;
  task: string;
  notes: string | null;
  draftRecordings?: DraftRecording[];
  draftImages?: DraftImage[];
  draftVideos?: DraftVideo[];
};

export default function useSaveDraft({
  title,
  todoList,
  setTitle,
  setTodoList,
}: {
  title: string;
  todoList: TodoItem[];
  setTitle: (title: string) => void;
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
          const todoList: TodoItem[] = draft.todoList || [];
          setTodoList(
            todoList.map((item) => ({
              ...item,
              draftVideos: (item.draftVideos ?? []).filter((v) => !v.isCompressing),
            })),
          );
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
  }, [setIsLoaded, setTitle, setTodoList]);

  const saveTodoDraft = useDebouncedCallback(
    async () => {
      if (!isLoaded) return;

      if (title.trim() === "" && todoList.length === 0) {
        await AsyncStorage.removeItem("todo_draft");
      } else {
        const draft = {
          title,
          todoList: todoList.map((item) => ({
            ...item,
            draftVideos: (item.draftVideos ?? []).filter((v) => !v.isCompressing),
          })),
        };
        await AsyncStorage.setItem("todo_draft", JSON.stringify(draft));
      }
    },
    500,
    { maxWait: 3000 }
  );

  useEffect(() => {
    saveTodoDraft();
  }, [title, todoList, saveTodoDraft]);

  return {
    saveTodoDraft,
  };
}
