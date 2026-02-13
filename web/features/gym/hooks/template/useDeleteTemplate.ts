"use client";

import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { deleteTemplate } from "@/database/gym/templates/delete-template";

type templateSummary = {
  id: string;
  name: string;
  created_at: string;
};

export default function useDeleteTemplate() {
  const queryClient = useQueryClient();

  const handleDeleteTemplate = async (templateId: string) => {
    const confirmDelete = confirm(
      "Are you sure you want to delete this template? This action cannot be undone."
    );
    if (!confirmDelete) return;

    const queryKey = ["templates"];

    await queryClient.cancelQueries({ queryKey });

    const previousTemplates = queryClient.getQueryData(queryKey);

    queryClient.setQueryData<templateSummary[]>(queryKey, (oldData) => {
      if (!oldData) return;

      return oldData.filter((template) => template.id !== templateId);
    });

    try {
      await deleteTemplate(templateId);

      toast.success("Template deleted successfully!");
    } catch {
      queryClient.setQueryData(queryKey, previousTemplates);
      toast.error("Failed to delete template. Please try again.");
    }
  };
  return {
    handleDeleteTemplate,
  };
}
