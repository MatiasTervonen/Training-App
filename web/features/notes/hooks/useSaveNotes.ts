"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { saveNote } from "@/database/notes/save-notes";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

export default function useSaveNotes() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: saveNote,
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ["feed"], exact: true });
      toast.success("Notes saved successfully");
      router.push("/dashboard");
    },
    onError: () => {
      toast.error("Failed to save notes. Please try again.");
    },
  });
}
