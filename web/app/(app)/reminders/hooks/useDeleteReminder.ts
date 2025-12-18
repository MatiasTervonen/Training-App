import { full_reminder } from "../../types/session";
import { useQueryClient } from "@tanstack/react-query";
import { deleteGlobalReminder } from "../../database/reminder";
import toast from "react-hot-toast";

export default function useDeleteReminder() {
  const queryClient = useQueryClient();

  const handleDeleteReminder = async (reminder: full_reminder) => {
    const confirmDelete = confirm(
      "Are you sure you want to delete this reminder?"
    );
    if (!confirmDelete) return;

    const queryKey = ["get-reminders"];

    await queryClient.cancelQueries({ queryKey });

    const previousReminders = queryClient.getQueryData(queryKey);

    queryClient.setQueryData<full_reminder[]>(queryKey, (oldData) => {
      if (!oldData) return;

      return oldData.filter((r) => r.id !== reminder.id);
    });

    try {
      await deleteGlobalReminder(reminder.id);

      await queryClient.refetchQueries({ queryKey: ["feed"], exact: true });
    } catch {
      queryClient.setQueryData(queryKey, previousReminders);
      toast.error("Error deleting reminder. Please try again later! ");
    }
  };
  return {
    handleDeleteReminder,
  };
}
