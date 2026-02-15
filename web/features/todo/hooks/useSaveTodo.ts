import { saveTodo } from "@/database/todo/save-todo";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useState } from "react";
import { useTranslation } from "react-i18next";

type TodoTask = {
  task: string;
  notes: string | null;
};

export default function useSaveTodo({
  title,
  todoList,
  onSuccess,
}: {
  title: string;
  todoList: TodoTask[];
  onSuccess?: () => void;
}) {
  const { t } = useTranslation("todo");
  const [isSaving, setIsSaving] = useState(false);
  const queryClient = useQueryClient();
  const router = useRouter();

  const handleSaveTodo = async () => {
    if (!title.trim()) {
      toast.error(t("todo.emptyTitleError"));
      return;
    }
    if (todoList.length === 0) {
      toast.error(t("todo.emptyListError"));
      return;
    }
    try {
      setIsSaving(true);
      await saveTodo({
        title,
        todoList,
      });

      await queryClient.refetchQueries({ queryKey: ["feed"], exact: true });

      toast.success(t("todo.saveSuccess"));
      onSuccess?.();
      router.push("/dashboard");
    } catch {
      toast.error(t("todo.saveError"));
      setIsSaving(false);
    }
  };

  return { handleSaveTodo, isSaving };
}
