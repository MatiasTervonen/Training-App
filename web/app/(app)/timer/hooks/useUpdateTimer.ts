import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { updateTimer } from "@/app/(app)/database/timer/update-timer";
import { useTranslation } from "react-i18next";

type UseUpdateTimerProps = {
  id: string;
  title: string;
  notes: string;
  setIsSaving: (isSaving: boolean) => void;
  alarmMinutes: string;
  alarmSeconds: string;
  onSuccess: () => void;
};

export default function useUpdateTimer({
  id,
  title,
  notes,
  setIsSaving,
  alarmMinutes,
  alarmSeconds,
  onSuccess,
}: UseUpdateTimerProps) {
  const { t } = useTranslation("timer");
  const queryClient = useQueryClient();

  const handleUpdateTimer = async () => {
    if (!title || !alarmMinutes || !alarmSeconds) {
      toast.error(t("timer.fillAllFields"));
      return;
    }

    setIsSaving(true);

    const minutes = parseInt(alarmMinutes) || 0;
    const seconds = parseInt(alarmSeconds) || 0;
    const totalSeconds = minutes * 60 + seconds;

    try {
      await updateTimer({
        id,
        title,
        durationInSeconds: totalSeconds,
        notes,
      });

      await queryClient.refetchQueries({ queryKey: ["get-timers"], exact: true });
      toast.success(t("timer.updateSuccess"));
      onSuccess();
    } catch {
      toast.error(t("timer.updateError"));
    } finally {
      setIsSaving(false);
    }
  };

  return {
    handleUpdateTimer,
  };
}
