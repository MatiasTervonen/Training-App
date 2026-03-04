import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getTemplateHistory } from "@/database/activities/get-template-history";

export function useTemplateHistory() {
  const [historyTemplateId, setHistoryTemplateId] = useState("");
  const [historyTemplateName, setHistoryTemplateName] = useState("");
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const {
    data: history = [],
    error: historyError,
    isLoading: isLoadingHistory,
  } = useQuery({
    queryKey: ["template-history", historyTemplateId],
    queryFn: () => getTemplateHistory(historyTemplateId),
    enabled: isHistoryOpen && !!historyTemplateId,
  });

  const openHistory = (templateId: string, templateName: string) => {
    setHistoryTemplateId(templateId);
    setHistoryTemplateName(templateName);
    setIsHistoryOpen(true);
  };

  const closeHistory = () => {
    setIsHistoryOpen(false);
  };

  return {
    history,
    historyError,
    isLoadingHistory,
    isHistoryOpen,
    historyTemplateName,
    openHistory,
    closeHistory,
  };
}
