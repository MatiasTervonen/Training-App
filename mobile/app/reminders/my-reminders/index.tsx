import FullScreenModal from "@/components/FullScreenModal";
import { useState } from "react";
import Toast from "react-native-toast-message";
import { ScrollView, View } from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { confirmAction } from "@/lib/confirmAction";
import { TemplateSkeleton } from "@/components/skeletetons";
import AppText from "@/components/AppText";
import PageContainer from "@/components/PageContainer";
import GetReminders from "@/database/reminders/get-reminders";
import DeleteReminder from "@/database/reminders/delete-reminder";
import DeleteCustomReminder from "@/database/reminders/delete-custom-reminder";
import MyReminderCard from "@/components/cards/MyReminderCard";
import { full_reminder } from "@/types/session";
import * as Notifications from "expo-notifications";
import AnimatedButton from "@/components/buttons/animatedButton";
import EditCustomReminder from "@/components/editSession/editCustomReminder";
import EditReminder from "@/components/editSession/editReminder";
import ReminderSession from "@/components/expandSession/reminder";

export default function RemindersPage() {
  const [expandedItem, setExpandedItem] = useState<full_reminder | null>(null);
  const [editingItem, setEditingItem] = useState<full_reminder | null>(null);
  const [activeTab, setActiveTab] = useState<"upcoming" | "delivered">(
    "upcoming"
  );

  const queryClient = useQueryClient();

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
    staleTime: Infinity,
    gcTime: Infinity,
  });

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
      const ids = Array.isArray(reminder.notification_id)
        ? reminder.notification_id
        : typeof reminder.notification_id === "string"
        ? [reminder.notification_id]
        : [];

      for (const nid of ids) {
        await Notifications.cancelScheduledNotificationAsync(nid);
      }

      if (reminder.type === "global") {
        await DeleteReminder(reminder.id);
      } else {
        await DeleteCustomReminder(reminder.id);
      }

      queryClient.refetchQueries({ queryKey: ["feed"], exact: true });

      Toast.show({
        type: "success",
        text1: "Reminder deleted successfully",
      });
    } catch {
      queryClient.setQueryData(queryKey, previousFeed);
      Toast.show({
        type: "error",
        text1: "Failed to delete reminder",
        text2: "Please try again.",
      });
    }
  };

  const filteredReminders = reminders.filter((r) =>
    activeTab === "upcoming" ? !r.delivered : r.delivered
  );

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <PageContainer>
        <AppText className="text-center mb-5 text-2xl">My Reminders</AppText>
        <View className="flex-row gap-4 justify-center my-10 rounded-md">
          <AnimatedButton
            onPress={() => setActiveTab("upcoming")}
            className={`px-4 py-2 w-[150px] rounded-xl ${
              activeTab === "upcoming" ? "bg-gray-900" : ""
            }`}
            textClassName={`text-center ${
              activeTab === "upcoming" ? "text-cyan-500" : "text-gray-100"
            }`}
            label="Upcoming"
            hitSlop={10}
          />

          <AnimatedButton
            onPress={() => setActiveTab("delivered")}
            className={`px-4 py-2 w-[150px] rounded-xl  ${
              activeTab === "delivered" ? "bg-gray-900" : ""
            }`}
            textClassName={`text-center  ${
              activeTab === "delivered" ? "text-cyan-500" : "text-gray-100"
            }`}
            label="Delivered"
            hitSlop={10}
          />
        </View>

        {!error && isLoading && <TemplateSkeleton count={6} />}

        {error && (
          <AppText className="text-red-500 text-center">
            Error loading reminders. Try again!
          </AppText>
        )}

        {!isLoading && filteredReminders.length === 0 && (
          <AppText className="text-gray-300 text-center mt-10 text-lg">
            No {activeTab} reminders.
          </AppText>
        )}

        {filteredReminders.map((reminder, index) => (
          <MyReminderCard
            key={reminder.id}
            index={index}
            item={reminder}
            onDelete={() => handleDeleteReminder(reminder)}
            onExpand={() => setExpandedItem(reminder)}
            onEdit={() => setEditingItem(reminder)}
          />
        ))}

        {expandedItem && (
          <FullScreenModal isOpen={true} onClose={() => setExpandedItem(null)}>
            <ReminderSession {...expandedItem} />
          </FullScreenModal>
        )}

        {editingItem &&
          filteredReminders.find(
            (r) => r.id === editingItem?.id && r.type === "global"
          ) && (
            <FullScreenModal isOpen={true} onClose={() => setEditingItem(null)}>
              <EditReminder
                reminder={editingItem as any}
                onClose={() => setEditingItem(null)}
                onSave={async () => {
                  await Promise.all([
                    queryClient.invalidateQueries({
                      queryKey: ["get-reminders"],
                    }),
                    queryClient.refetchQueries({
                      queryKey: ["feed"],
                    }),
                  ]);
                  setEditingItem(null);
                }}
              />
            </FullScreenModal>
          )}

        {editingItem &&
          filteredReminders.find(
            (r) => r.id === editingItem?.id && r.type !== "global"
          ) && (
            <FullScreenModal isOpen={true} onClose={() => setEditingItem(null)}>
              <EditCustomReminder
                reminder={editingItem}
                onClose={() => setEditingItem(null)}
                onSave={async () => {
                  await Promise.all([
                    queryClient.invalidateQueries({
                      queryKey: ["get-reminders"],
                    }),
                    queryClient.invalidateQueries({
                      queryKey: ["fullCustomReminder"],
                    }),
                    queryClient.refetchQueries({
                      queryKey: ["feed"],
                    }),
                  ]);
                  setEditingItem(null);
                }}
              />
            </FullScreenModal>
          )}
      </PageContainer>
    </ScrollView>
  );
}
