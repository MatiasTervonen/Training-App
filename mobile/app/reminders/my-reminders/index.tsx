import { useRouter } from "expo-router";
import FullScreenModal from "@/components/FullScreenModal";
import { useState } from "react";
import Toast from "react-native-toast-message";
import { ScrollView } from "react-native";
import { handleError } from "@/utils/handleError";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { confirmAction } from "@/lib/confirmAction";
import { TemplateSkeleton } from "@/components/skeletetons";
import AppText from "@/components/AppText";
import PageContainer from "@/components/PageContainer";
import GetReminders from "@/api/reminders/get-reminders";
import DeleteReminder from "@/api/reminders/delete-reminder";
import DeleteCustomReminder from "@/api/reminders/delete-custom-reminder";
import MyReminderCard from "@/components/cards/MyReminderCard";
import { full_reminder } from "@/types/session";
import MyReminder from "@/components/expandSession/myReminder";
import * as Notifications from "expo-notifications";

export default function RemindersPage() {
  const [expandedItem, setExpandedItem] = useState<full_reminder | null>(null);

  const queryClient = useQueryClient();

  const router = useRouter();

  const {
    data: reminders = [],
    error,
    isLoading,
  } = useQuery({
    queryKey: ["get-reminders"],
    queryFn: GetReminders,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  console.log("Reminders:", reminders);

  const handleDeleteReminder = async (reminder: full_reminder) => {
    const confirmDelete = await confirmAction({
      message: "Delete Reminder",
      title: "Are you sure you want to delete this reminder?",
    });
    if (!confirmDelete) return;

    const queryKey = ["get-reminders"];

    const previousFeed = queryClient.getQueryData<full_reminder[]>(queryKey);

    queryClient.setQueryData<full_reminder[]>(queryKey, (oldData) => {
      if (!oldData) return oldData;

      return oldData.filter((item) => item.id !== reminder.id);
    });

    try {
      if (Array.isArray(reminder.notification_id)) {
        for (const id of reminder.notification_id) {
          await DeleteCustomReminder(id);
          await Notifications.cancelScheduledNotificationAsync(id);
        }
      }

      if (reminder.type === "global") {
        await DeleteReminder(reminder.id);
      } else {
        await DeleteCustomReminder(reminder.id);
      }

      Toast.show({
        type: "success",
        text1: "Reminder deleted successfully",
      });
    } catch (error) {
      queryClient.setQueryData(queryKey, previousFeed);
      handleError(error, {
        message: "Error deleting reminder",
        route: "/api/gym/delete-reminder",
        method: "POST",
      });
      Toast.show({
        type: "error",
        text1: "Failed to delete reminder",
        text2: "Please try again.",
      });
    }
  };

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <PageContainer>
        <AppText className="text-gray-100 text-center  mt-5 mb-10 text-2xl">
          My Reminders
        </AppText>

        {!error && isLoading && <TemplateSkeleton count={6} />}

        {error && (
          <AppText className="text-red-500 text-center">
            Error loading reminders. Try again!
          </AppText>
        )}

        {!isLoading && reminders.length === 0 && (
          <AppText className="text-gray-300 text-center">
            No reminders found. Create a new reminder to get started!
          </AppText>
        )}

        {reminders &&
          reminders.map((reminder: full_reminder, index: number) => (
            <MyReminderCard
              index={index}
              key={reminder.id}
              item={reminder}
              onDelete={() => handleDeleteReminder(reminder)}
              onExpand={() => setExpandedItem(reminder)}
              onEdit={() => {
                router.push(`/training/templates/${reminder.id}`);
              }}
            />
          ))}

        {expandedItem && (
          <FullScreenModal isOpen={true} onClose={() => setExpandedItem(null)}>
            <MyReminder {...expandedItem} />
          </FullScreenModal>
        )}
      </PageContainer>
    </ScrollView>
  );
}
