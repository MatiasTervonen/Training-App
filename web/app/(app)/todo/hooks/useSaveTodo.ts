import { saveTodoToDB } from "../../database/todo";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useMutation } from "@tanstack/react-query";

export default function useSaveTodo() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: saveTodoToDB,
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ["feed"], exact: true });
      toast.success("Todo saved successfully");
      router.push("/dashboard");
    },
    onError: () => {
      toast.error("Failed to save todo");
    },
  });
}
