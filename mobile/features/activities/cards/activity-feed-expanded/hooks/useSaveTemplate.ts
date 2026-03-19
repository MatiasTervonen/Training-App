import { saveTemplate } from "@/database/activities/save-template";
import { useQueryClient } from "@tanstack/react-query";
import Toast from "react-native-toast-message";
import { useTranslation } from "react-i18next";

export default function useSaveTemplate({
  templateName,
  templateNotes,
  sessionId,
  setIsSaving,
  setShowModal,
  setTemplateName,
  setTemplateNotes,
  onSuccess,
}: {
  templateName: string;
  templateNotes: string;
  sessionId: string;
  setIsSaving: (isSaving: boolean) => void;
  setShowModal: (showModal: boolean) => void;
  setTemplateName: (templateName: string) => void;
  setTemplateNotes: (templateNotes: string) => void;
  onSuccess?: (templateId: string) => void;
}) {
  const queryClient = useQueryClient();
  const { t } = useTranslation("activities");

  const saveAsTemplate = async () => {
    if (templateName.trim() === "") {
      Toast.show({
        type: "error",
        text1: t("activities.sessionDetails.saveErrorTitle"),
        text2: t("activities.sessionDetails.saveErrorName"),
      });
      return;
    }

    try {
      setIsSaving(true);

      const templateId = await saveTemplate({
        name: templateName,
        notes: templateNotes,
        sessionId: sessionId,
      });

      Toast.show({
        type: "success",
        text1: t("activities.sessionDetails.saveSuccessTitle"),
        text2: t("activities.sessionDetails.saveSuccessMessage"),
      });
      setTemplateName("");
      setTemplateNotes("");

      if (templateId && onSuccess) {
        onSuccess(templateId);
      }

      queryClient.invalidateQueries({
        queryKey: ["fullActivitySession", sessionId],
        exact: true,
      });
      queryClient.invalidateQueries({
        queryKey: ["get-activity-templates"],
        exact: true,
      });
    } catch {
      Toast.show({
        type: "error",
        text1: t("activities.sessionDetails.saveErrorTitle"),
        text2: t("activities.sessionDetails.saveErrorMessage"),
      });
    } finally {
      setIsSaving(false);
      setShowModal(false);
    }
  };
  return {
    saveAsTemplate,
  };
}
