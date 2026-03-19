import AppText from "@/components/AppText";
import { View, FlatList, RefreshControl } from "react-native";
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
import ReminderSession from "@/features/reminders/cards/reminder-expanded-feed";
import HandleEditGlobalReminder from "@/features/reminders/cards/editGlobalReminder";
import HandleEditLocalReminder from "@/features/reminders/cards/editLocalReminder";
import useTogglePin from "@/features/feed/hooks/useTogglePin";
import useDeleteSession from "@/features/feed/hooks/useDeleteSession";
import useUpdateFeedItemToTop from "@/features/feed/hooks/useUpdateFeedItemToTop";
import { useTranslation } from "react-i18next";
import AnimatedButton from "@/components/buttons/animatedButton";
import FloatingActionButton from "@/components/buttons/FloatingActionButton";
import { Plus, Bell } from "lucide-react-native";
import InfoModal from "@/components/InfoModal";
import { useUserStore } from "@/lib/stores/useUserStore";
import BodyText from "@/components/BodyText";
import LinkButton from "@/components/buttons/LinkButton";
import { SESSION_COLORS } from "@/lib/sessionColors";
import type { ReminderFilter } from "@/database/reminders/get-reminders-feed";
import BodyTextNC from "@/components/BodyTextNC";
import AppTextNC from "@/components/AppTextNC";

const FILTERS: ReminderFilter[] = ["upcoming", "delivered"];

export default function RemindersScreen() {
  const { t } = useTranslation("reminders");
  const colors = SESSION_COLORS.reminders;
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
  const { updateFeedItemToTop } = useUpdateFeedItemToTop();

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
        <FeedSkeleton count={5} subFeed />
      ) : error ? (
        <BodyText className="text-center text-lg mt-20 mx-auto px-10">
          {t("reminders.errorLoading")}
        </BodyText>
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
            <BodyTextNC className="text-sm text-gray-400 text-center">
              {getEmptyDescription()}
            </BodyTextNC>
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

      <FloatingActionButton onPress={() => router.push("/reminders/create-reminder")}>
        <Plus size={30} color="#06b6d4" />
      </FloatingActionButton>

      {expandedItem && (
        <FullScreenModal
          isOpen={!!expandedItem}
          onClose={() => setExpandedItem(null)}
        >
          <ReminderSession {...expandedItem} />
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
          <HandleEditGlobalReminder
            reminder={editingItem}
            onClose={() => setEditingItem(null)}
            onSave={(updatedItem) => {
              updateFeedItemToTop(updatedItem);
              queryClient.invalidateQueries({ queryKey: ["myReminders"] });
            }}
            onDirtyChange={setHasUnsavedChanges}
          />
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
          <HandleEditLocalReminder
            reminder={editingItem}
            onClose={() => setEditingItem(null)}
            onSave={(updatedItem) => {
              updateFeedItemToTop(updatedItem);
              queryClient.invalidateQueries({ queryKey: ["myReminders"] });
            }}
            onDirtyChange={setHasUnsavedChanges}
          />
        </FullScreenModal>
      )}

      <InfoModal
        visible={showPushModal}
        onClose={() => {}}
        title={t("reminders.pushDisabledTitle")}
        description={t("reminders.pushDisabledMessage")}
        customActions={
          <>
            <View className="flex-1">
              <LinkButton href="/sessions" label={t("reminders.back")} gradientColors={colors.gradient} borderColor={colors.border} />
            </View>
            <View className="flex-1">
              <LinkButton
                href="/menu/settings"
                label={t("reminders.settings")}
                gradientColors={colors.gradient}
                borderColor={colors.border}
              />
            </View>
          </>
        }
      />
    </LinearGradient>
  );
}
