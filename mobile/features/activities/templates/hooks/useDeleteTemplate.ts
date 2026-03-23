import { useConfirmAction } from "@/lib/confirmAction";
import { templateSummary } from "@/types/session";
import { useQueryClient } from "@tanstack/react-query";
import Toast from "react-native-toast-message";
import { deleteActivityTemplate } from "@/database/activities/delete-template";
import { useTranslation } from "react-i18next";

export function useDeleteTemplate() {
  const queryClient = useQueryClient();
  const confirmAction = useConfirmAction();
  const { t } = useTranslation("activities");

  const handleDeleteTemplate = async (templateId: string) => {
    const confirmDelete = await confirmAction({
      message: t("activities.deleteTemplate.confirmTitle"),
      title: t("activities.deleteTemplate.confirmMessage"),
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
        text1: t("activities.deleteTemplate.success"),
      });

      queryClient.invalidateQueries({ queryKey: ["fullActivitySession"] });
    } catch {
      queryClient.setQueryData(queryKey, previousTemplates);
      Toast.show({
        type: "error",
        text1: t("activities.deleteTemplate.error"),
        text2: t("activities.deleteTemplate.errorSub"),
      });
    }
  };
  return {
    handleDeleteTemplate,
  };
}
