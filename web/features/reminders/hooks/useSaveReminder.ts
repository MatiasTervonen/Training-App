import { saveGlobalReminder } from "@/database/reminders/save-global-reminder";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function useSaveReminder({
  title,
  notes,
  notifyAt,
  setIsSaving,
  resetReminder,
}: {
  title: string;
  notes: string;
  notifyAt: Date;
  setIsSaving: (isSaving: boolean) => void;
  resetReminder: () => void;
}) {
  const queryClient = useQueryClient();
  const router = useRouter();

  const saveReminder = async () => {
    if (title.trim().length === 0) {
      toast.error("Title is required");
      return;
    }
    if (!notifyAt) {
      toast.error("Notify time is required");
      return;
    }

    if (notifyAt < new Date()) {
      toast.error("Notify time must be in the future.");
      return;
    }

    setIsSaving(true);

    try {
      await saveGlobalReminder({
        title: title,
        notes,
        type: "global",
        notify_at: notifyAt.toISOString(),
      });

      await Promise.all([
        queryClient.refetchQueries({
          queryKey: ["get-reminders"],
          exact: true,
        }),
        queryClient.refetchQueries({ queryKey: ["feed"], exact: true }),
      ]);
      router.push("/dashboard");
      resetReminder();
    } catch {
      toast.error("Failed to save reminder. Please try again.");
      setIsSaving(false);
    }
  };
  return {
    saveReminder,
  };
}
