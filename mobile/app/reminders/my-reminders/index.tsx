import FullScreenModal from "@/components/FullScreenModal";
import { useState } from "react";
import { ScrollView, View } from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { TemplateSkeleton } from "@/components/skeletetons";
import AppText from "@/components/AppText";
import PageContainer from "@/components/PageContainer";
import {
  getRemindersByTab,
  ReminderByTab,
  ReminderTab,
} from "@/database/reminders/get-reminders-by-tab";
import MyReminderCard from "@/features/reminders/cards/MyReminderCard";
import AnimatedButton from "@/components/buttons/animatedButton";
import useDeleteReminder from "@/features/reminders/hooks/my-reminders/useDeleteReminder";
import EditMyGlobalReminder from "@/features/reminders/cards/editMyGlobalReminder";
import MyReminderSession from "@/features/reminders/cards/myReminder-expanded";
import EditMyLocalReminder from "@/features/reminders/cards/editMyLocalReminder";
import AppTextNC from "@/components/AppTextNC";
import { useTranslation } from "react-i18next";

export default function RemindersPage() {
  const { t } = useTranslation("reminders");
  const [expandedItem, setExpandedItem] = useState<ReminderByTab | null>(null);
  const [editingItem, setEditingItem] = useState<ReminderByTab | null>(null);
  const [activeTab, setActiveTab] = useState<ReminderTab>("normal");

  const queryClient = useQueryClient();

  const {
    data: reminders = [],
    error,
    isLoading,
  } = useQuery({
    queryKey: ["reminders", activeTab],
    queryFn: () => getRemindersByTab(activeTab),
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  // useDeleteReminder hook to delete reminder
  const { handleDeleteReminder } = useDeleteReminder();

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <PageContainer>
        <AppText className="text-center mb-5 text-2xl">
          {t("reminders.myReminders")}
        </AppText>
        <View className="flex-row gap-3 justify-center my-10 rounded-md">
          <AnimatedButton
            onPress={() => setActiveTab("normal")}
            tabClassName={`flex-1 px-4 py-2 rounded-xl ${
              activeTab === "normal" ? "bg-gray-900" : ""
            }`}
            hitSlop={10}
          >
            <AppTextNC
              className={`text-center ${
                activeTab === "normal" ? "text-blue-500" : "text-gray-100"
              }`}
            >
              {t("reminders.tabs.normal")}
            </AppTextNC>
          </AnimatedButton>

          <AnimatedButton
            onPress={() => setActiveTab("repeating")}
            tabClassName={`flex-1 px-4 py-2 rounded-xl  ${
              activeTab === "repeating" ? "bg-gray-900" : ""
            }`}
            hitSlop={10}
          >
            <AppTextNC
              className={`text-center ${
                activeTab === "repeating" ? "text-blue-500" : "text-gray-100"
              }`}
            >
              {t("reminders.tabs.repeating")}
            </AppTextNC>
          </AnimatedButton>
          <AnimatedButton
            onPress={() => setActiveTab("delivered")}
            tabClassName={`flex-1 px-4 py-2 rounded-xl  ${
              activeTab === "delivered" ? "bg-gray-900" : ""
            }`}
            hitSlop={10}
          >
            <AppTextNC
              className={`text-center font-medium  ${
                activeTab === "delivered" ? "text-blue-500" : "text-gray-100"
              }`}
            >
              {t("reminders.tabs.delivered")}
            </AppTextNC>
          </AnimatedButton>
        </View>

        {!error && isLoading && <TemplateSkeleton count={6} />}

        {error && (
          <AppText className="text-red-500 text-center mt-10">
            {t("reminders.errorLoading")}
          </AppText>
        )}

        {!error && !isLoading && reminders.length === 0 && (
          <AppText className="text-gray-300 text-center mt-10 text-lg">
            {t("reminders.noReminders", {
              tab: t(`reminders.tabs.${activeTab}`),
            })}
          </AppText>
        )}

        {reminders.map((reminder, index) => (
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

        {editingItem && editingItem.type === "global" && (
          <FullScreenModal isOpen={true} onClose={() => setEditingItem(null)}>
            <EditMyGlobalReminder
              reminder={editingItem}
              onClose={() => setEditingItem(null)}
              onSave={async () => {
                await Promise.all([
                  queryClient.invalidateQueries({
                    queryKey: ["reminders"],
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

        {editingItem && editingItem.type !== "global" && (
          <FullScreenModal isOpen={true} onClose={() => setEditingItem(null)}>
            <EditMyLocalReminder
              reminder={editingItem}
              onClose={() => setEditingItem(null)}
              onSave={async () => {
                await Promise.all([
                  queryClient.invalidateQueries({
                    queryKey: ["reminders"],
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
