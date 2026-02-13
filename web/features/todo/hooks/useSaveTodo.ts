import { saveTodo } from "@/database/todo/save-todo";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useState } from "react";

type TodoTask = {
  task: string;
  notes: string | null;
};

export default function useSaveTodo({
  title,
  todoList,
}: {
  title: string;
  todoList: TodoTask[];
}) {
  const [isSaving, setIsSaving] = useState(false);
  const queryClient = useQueryClient();
  const router = useRouter();

  const handleSaveTodo = async () => {
    try {
      setIsSaving(true);
      await saveTodo({
        title,
        todoList,
      });

      await queryClient.refetchQueries({ queryKey: ["feed"], exact: true });

      toast.success("Todo saved successfully");
      router.push("/dashboard");
    } catch {
      toast.error("Failed to save todo");
      setIsSaving(false);
    }
  };

  return { handleSaveTodo, isSaving };
}
