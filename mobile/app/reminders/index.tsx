import AppText from "@/components/AppText";
import AppTextNC from "@/components/AppTextNC";
import {
  View,
  FlatList,
  RefreshControl,
  Modal,
  ActivityIndicator,
} from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { FeedSkeleton } from "@/components/skeletetons";
import FeedFooter from "@/features/feed/FeedFooter";
import FullScreenModal from "@/components/FullScreenModal";
import { LinearGradient } from "expo-linear-gradient";
import useMyRemindersFeed from "@/features/reminders/hooks/useMyRemindersFeed";
import FeedCard from "@/features/feed-cards/FeedCard";
import { FeedItemUI, FeedData } from "@/types/session";
import FeedHeader from "@/features/feed/FeedHeader";
import useFullReminder from "@/features/reminders/hooks/useFullReminder";
import MyReminderSession from "@/features/reminders/cards/myReminder-expanded";
import EditMyGlobalReminder from "@/features/reminders/cards/editMyGlobalReminder";
import EditMyLocalReminder from "@/features/reminders/cards/editMyLocalReminder";
import useTogglePin from "@/features/feed/hooks/useTogglePin";
import useDeleteSession from "@/features/feed/hooks/useDeleteSession";
import { useTranslation } from "react-i18next";
import AnimatedButton from "@/components/buttons/animatedButton";
import { Plus, Info, Bell } from "lucide-react-native";
import { useUserStore } from "@/lib/stores/useUserStore";
import BodyText from "@/components/BodyText";
import LinkButton from "@/components/buttons/LinkButton";
import type { ReminderFilter } from "@/database/reminders/get-reminders-feed";

const FILTERS: ReminderFilter[] = ["upcoming", "delivered"];

export default function RemindersScreen() {
  const { t } = useTranslation("reminders");
  const router = useRouter();
  const queryClient = useQueryClient();
  const [expandedItem, setExpandedItem] = useState<FeedItemUI | null>(null);
  const [editingItem, setEditingItem] = useState<FeedItemUI | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [filter, setFilter] = useState<ReminderFilter>("upcoming");

  const pushEnabled = useUserStore((state) => state.settings?.push_enabled);
  const showPushModal = pushEnabled === false;

  const {
    data,
    error,
    isLoading,
    mutateFeed,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    pinnedFeed,
    unpinnedFeed,
    queryKey,
  } = useMyRemindersFeed(filter);

  const { togglePin } = useTogglePin(queryKey);
  const { handleDelete } = useDeleteSession();

  const {
    reminderFull,
    globalReminderByTab,
    localReminder,
    isLoading: isLoadingReminder,
    error: reminderError,
  } = useFullReminder(expandedItem, editingItem);

  const getEmptyMessage = () => {
    if (filter === "upcoming") return t("reminders.noRemindersUpcoming");
    return t("reminders.noRemindersDelivered");
  };

  const getEmptyDescription = () => {
    if (filter === "upcoming") return t("reminders.noRemindersUpcomingDesc");
    return t("reminders.noRemindersDeliveredDesc");
  };

  const filterTabs = (
    <View className="mt-[6px] mb-1 mx-3 bg-slate-800 rounded-lg">
      <View className="flex-row p-1 gap-2">
        {FILTERS.map((f) => {
          const isActive = filter === f;
          return (
            <AnimatedButton
              key={f}
              onPress={() => setFilter(f)}
              className={`flex-1 py-2 px-3 rounded-md ${isActive ? "bg-slate-700" : ""}`}
            >
              <AppTextNC
                className={`text-center font-medium ${
                  isActive ? "text-cyan-400" : "text-gray-200"
                }`}
              >
                {t(`reminders.tabs.${f}`)}
              </AppTextNC>
            </AnimatedButton>
          );
        })}
      </View>
    </View>
  );

  return (
    <LinearGradient
      className="flex-1"
      colors={["#020618", "#1d293d"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View className="absolute top-0 left-0 right-0 z-10">
        {filterTabs}
      </View>
      {isLoading ? (
        <View className="pt-[50px]">
          <FeedSkeleton count={5} />
        </View>
      ) : error ? (
        <AppText className="text-center text-lg mt-20 mx-auto px-10">
          {t("reminders.errorLoading")}
        </AppText>
      ) : !data ||
        (unpinnedFeed.length === 0 && pinnedFeed.length === 0) ? (
        <View className="flex-1 items-center mt-[30%] px-8">
          <View className="items-center">
            <View className="w-20 h-20 rounded-full bg-slate-800 border border-slate-700 items-center justify-center mb-5">
              <Bell size={36} color="#94a3b8" />
            </View>
            <AppText className="text-xl text-center mb-3">
              {getEmptyMessage()}
            </AppText>
            <AppText className="text-sm text-gray-400 text-center leading-5">
              {getEmptyDescription()}
            </AppText>
          </View>
        </View>
      ) : (
        <FlatList
          data={unpinnedFeed}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: 100,
            paddingTop: 50,
          }}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) {
              fetchNextPage();
            }
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              progressViewOffset={50}
              onRefresh={async () => {
                setRefreshing(true);
                await mutateFeed();
                setRefreshing(false);
              }}
            />
          }
          onEndReachedThreshold={0.5}
          renderItem={({ item: feedItem }) => (
            <View className={`px-4 ${unpinnedFeed ? "pb-5" : ""}`}>
              <FeedCard
                item={feedItem as FeedItemUI}
                pinned={false}
                onExpand={() => setExpandedItem(feedItem)}
                onTogglePin={() =>
                  togglePin(
                    feedItem.id,
                    feedItem.type,
                    feedItem.feed_context,
                    "reminders",
                  )
                }
                onDelete={() => {
                  handleDelete(feedItem.source_id, feedItem.type, queryKey);
                }}
                onEdit={() => {
                  setEditingItem(feedItem);
                }}
              />
            </View>
          )}
          ListFooterComponent={
            <FeedFooter
              isFetchingNextPage={isFetchingNextPage}
              hasNextPage={hasNextPage}
              data={data as FeedData}
            />
          }
          ListHeaderComponent={
            <View className={pinnedFeed.length === 0 ? "mb-4" : ""}>
              <FeedHeader
                pinnedFeed={pinnedFeed}
                setExpandedItem={setExpandedItem}
                setEditingItem={setEditingItem}
                pinned_context="reminders"
                queryKey={queryKey}
              />
            </View>
          }
        />
      )}

      <View className="absolute bottom-8 right-6">
        <View className="absolute -inset-1 rounded-full bg-cyan-400/30" />
        <View className="absolute -inset-3 rounded-full bg-cyan-400/15" />
        <View className="absolute -inset-5 rounded-full bg-cyan-400/5" />
        <AnimatedButton
          onPress={() => router.push("/reminders/create-reminder")}
          className="w-14 h-14 rounded-full bg-slate-800 items-center justify-center shadow-xl shadow-cyan-400/60 border-2 border-cyan-300"
        >
          <Plus size={30} color="#67e8f9" />
        </AnimatedButton>
      </View>

      {expandedItem && (
        <FullScreenModal
          isOpen={!!expandedItem}
          onClose={() => setExpandedItem(null)}
        >
          {isLoadingReminder ? (
            <View className="gap-5 items-center justify-center mt-40 px-10">
              <AppText className="text-lg">
                {t("reminders.loadingDetails")}
              </AppText>
              <ActivityIndicator />
            </View>
          ) : reminderError ? (
            <AppText className="text-center text-xl mt-40 px-10">
              {t("reminders.errorLoading")}
            </AppText>
          ) : (
            reminderFull && <MyReminderSession {...reminderFull} />
          )}
        </FullScreenModal>
      )}

      {editingItem && editingItem.type === "global_reminders" && (
        <FullScreenModal
          isOpen={true}
          onClose={() => {
            setHasUnsavedChanges(false);
            setEditingItem(null);
          }}
          confirmBeforeClose={hasUnsavedChanges}
        >
          {isLoadingReminder ? (
            <View className="gap-5 items-center justify-center mt-40 px-10">
              <AppText className="text-lg">
                {t("reminders.loadingDetails")}
              </AppText>
              <ActivityIndicator />
            </View>
          ) : reminderError ? (
            <AppText className="text-center text-xl mt-40 px-10">
              {t("reminders.errorLoading")}
            </AppText>
          ) : (
            globalReminderByTab && (
              <EditMyGlobalReminder
                reminder={globalReminderByTab}
                onClose={() => {
                  queryClient.invalidateQueries({
                    queryKey: ["myReminders"],
                  });
                  setHasUnsavedChanges(false);
                  setEditingItem(null);
                }}
                onDirtyChange={setHasUnsavedChanges}
              />
            )
          )}
        </FullScreenModal>
      )}

      {editingItem && editingItem.type === "local_reminders" && (
        <FullScreenModal
          isOpen={true}
          onClose={() => {
            setHasUnsavedChanges(false);
            setEditingItem(null);
          }}
          confirmBeforeClose={hasUnsavedChanges}
        >
          {isLoadingReminder ? (
            <View className="gap-5 items-center justify-center mt-40 px-10">
              <AppText className="text-lg">
                {t("reminders.loadingDetails")}
              </AppText>
              <ActivityIndicator />
            </View>
          ) : reminderError ? (
            <AppText className="text-center text-xl mt-40 px-10">
              {t("reminders.errorLoading")}
            </AppText>
          ) : (
            localReminder && (
              <EditMyLocalReminder
                reminder={localReminder}
                onClose={() => setEditingItem(null)}
                onSave={async () => {
                  await queryClient.invalidateQueries({
                    queryKey: ["myReminders"],
                  });
                  setHasUnsavedChanges(false);
                  setEditingItem(null);
                }}
                onDirtyChange={setHasUnsavedChanges}
              />
            )
          )}
        </FullScreenModal>
      )}

      <Modal visible={showPushModal} transparent={true} animationType="slide">
        <View className="flex-1 justify-center items-center bg-black/50 px-5">
          <View className="bg-slate-700 rounded-lg p-6 w-full border-2 border-gray-100">
            <View className="mb-5">
              <Info size={35} color="#fbbf24" />
            </View>
            <AppText className="text-xl mb-6 text-center">
              {t("reminders.pushDisabledTitle")}
            </AppText>
            <BodyText className="text-lg mb-6 text-center">
              {t("reminders.pushDisabledMessage")}
            </BodyText>
            <View className="flex-row gap-4">
              <View className="flex-1">
                <LinkButton href="/sessions" label={t("reminders.back")} />
              </View>
              <View className="flex-1">
                <LinkButton
                  href="/menu/settings"
                  label={t("reminders.settings")}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}
