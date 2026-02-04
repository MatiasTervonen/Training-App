import { useConfirmAction } from "@/lib/confirmAction";
import { templateSummary } from "@/types/session";
import { useQueryClient } from "@tanstack/react-query";
import Toast from "react-native-toast-message";
import { deleteActivityTemplate } from "@/database/activities/delete-template";

export function useDeleteTemplate() {
  const queryClient = useQueryClient();
  const confirmAction = useConfirmAction();

  const handleDeleteTemplate = async (templateId: string) => {
    const confirmDelete = await confirmAction({
      message: "Delete Template",
      title:
        "Are you sure you want to delete this template? This action cannot be undone.",
    });
    if (!confirmDelete) return;

    const queryKey = ["get-activity-templates"];

    const previousTemplates =
      queryClient.getQueryData<templateSummary[]>(queryKey);

    queryClient.setQueryData<templateSummary[]>(queryKey, (oldData) => {
      if (!oldData) return oldData;

      return oldData.filter((item) => item.template.id !== templateId);
    });

    try {
      await deleteActivityTemplate(templateId);

      Toast.show({
        type: "success",
        text1: "Template deleted successfully",
      });

      queryClient.refetchQueries({ queryKey: ["fullActivitySession"] });
    } catch {
      queryClient.setQueryData(queryKey, previousTemplates);
      Toast.show({
        type: "error",
        text1: "Failed to delete template",
        text2: "Please try again.",
      });
    }
  };
  return {
    handleDeleteTemplate,
  };
}
