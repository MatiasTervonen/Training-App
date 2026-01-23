import { saveTemplate } from "@/database/activities/save-template";
import { useQueryClient } from "@tanstack/react-query";
import Toast from "react-native-toast-message";

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

  const saveAsTemplate = async () => {
    if (templateName.trim() === "") {
      Toast.show({
        type: "error",
        text1: "Error saving template",
        text2: "Please enter a template name",
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
        text1: "Template saved",
        text2: "Template has been saved successfully.",
      });
      setTemplateName("");
      setTemplateNotes("");

      if (templateId && onSuccess) {
        onSuccess(templateId);
      }

      queryClient.refetchQueries({
        queryKey: ["fullActivitySession", sessionId],
        exact: true,
      });
      queryClient.refetchQueries({
        queryKey: ["get-activity-templates"],
        exact: true,
      });
    } catch {
      Toast.show({
        type: "error",
        text1: "Error saving template",
        text2: "Please try again later.",
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
