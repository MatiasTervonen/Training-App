import FullScreenModal from "@/components/FullScreenModal";
import { useState } from "react";
import { ScrollView, View } from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { TemplateSkeleton } from "@/components/skeletetons";
import AppText from "@/components/AppText";
import PageContainer from "@/components/PageContainer";
import { getReminders } from "@/database/reminders/get-reminders";
import MyReminderCard from "@/Features/feed-cards/MyReminderCard";
import { full_reminder } from "@/types/session";
import AnimatedButton from "@/components/buttons/animatedButton";
import useDeleteReminder from "@/Features/reminders/hooks/my-reminders/useDeleteReminder";
import EditMyGlobalReminder from "@/Features/edit-session-cards/editMyGlobalReminder";
import MyReminderSession from "@/Features/expand-session-cards/myReminder";
import EditMyLocalReminder from "@/Features/edit-session-cards/editMyLocalReminder";

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
    queryFn: getReminders,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  // useDeleteReminder hook to delete reminder
  const { handleDeleteReminder } = useDeleteReminder();

  const filteredReminders = reminders.filter((r) =>
    activeTab === "upcoming"
      ? !r.seen_at && !r.delivered
      : r.seen_at || r.delivered
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
            <MyReminderSession {...expandedItem} />
          </FullScreenModal>
        )}

        {editingItem &&
          filteredReminders.find(
            (r) => r.id === editingItem?.id && r.type === "global"
          ) && (
            <FullScreenModal isOpen={true} onClose={() => setEditingItem(null)}>
              <EditMyGlobalReminder
                reminder={editingItem}
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
              <EditMyLocalReminder
                reminder={editingItem}
                onClose={() => setEditingItem(null)}
                onSave={async () => {
                  await Promise.all([
                    queryClient.invalidateQueries({
                      queryKey: ["get-reminders"],
                    }),
                    queryClient.invalidateQueries({
                      queryKey: ["fullLocalReminder"],
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
