import { useEffect, useState, useRef } from "react";
import AppText from "@/components/AppText";
import {
  FlatList,
  RefreshControl,
  View,
  ActivityIndicator,
} from "react-native";
import FeedCard from "@/features/feed-cards/FeedCard";
import { FeedSkeleton } from "@/components/skeletetons";
import { LinearGradient } from "expo-linear-gradient";
import FullScreenModal from "@/components/FullScreenModal";
import GymSession from "@/features/gym/cards/gym-expanded";
import NotesSession from "@/features/notes/cards/notes-expanded";
import WeightSession from "@/features/weight/cards/weight-expanded";
import EditNotes from "@/features/notes/cards/edit-notes";
import EditWeight from "@/features/edit-session-cards/editWeight";
import HandleEditGlobalReminder from "@/features/reminders/cards/editGlobalReminder";
import { useRouter } from "expo-router";
import TodoSession from "@/features/expand-session-cards/todo";
import EditTodo from "@/features/edit-session-cards/editTodo";
import ReminderSession from "@/features/reminders/cards/reminder-expanded-feed";
import useDeleteSession from "@/features/feed/hooks/useDeleteSession";
import useTogglePin from "@/features/feed/hooks/useTogglePin";
import useFeed from "@/features/feed/hooks/useFeed";
import useFullSessions from "@/features/feed/hooks/useFullSessions";
import FeedHeader from "@/features/feed/FeedHeader";
import FeedFooter from "@/features/feed/FeedFooter";
import HandleEditLocalReminder from "@/features/reminders/cards/editLocalReminder";
import { useAppReadyStore } from "@/lib/stores/appReadyStore";
import { FeedItemUI } from "@/types/session";
import useUpdateFeedItem from "@/features/feed/hooks/useUpdateFeedItem";
import ActivitySession from "@/features/activities/cards/activity-feed-expanded/activity";
import ActivitySessionEdit from "@/features/activities/cards/activity-edit";
import useUpdateFeedItemToTop from "./hooks/useUpdateFeedItemToTop";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

type SessionFeedProps = {
  expandReminderId?: string;
};

export default function SessionFeed({ expandReminderId }: SessionFeedProps) {
  const setFeedReady = useAppReadyStore((state) => state.setFeedReady);
  const feedReady = useAppReadyStore((state) => state.feedReady);
  const queryClient = useQueryClient();
  const { t } = useTranslation("feed");

  const [expandedItem, setExpandedItem] = useState<FeedItemUI | null>(null);
  const [editingItem, setEditingItem] = useState<FeedItemUI | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const expandedReminderRef = useRef<string | null>(null);

  const router = useRouter();

  // useFeed hook to get feed data
  // includes infinite scrolling, prefetching, sorting, and other feed related logic
  const {
    data,
    error,
    isLoading,
    mutateFeed,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isSuccess,
    pinnedFeed,
    unpinnedFeed,
  } = useFeed();

  useEffect(() => {
    if (!isLoading && isSuccess) {
      setFeedReady();
    }
  }, [isLoading, isSuccess, setFeedReady]);

  // Auto-expand reminder when navigating from alarm
  useEffect(() => {
    if (
      expandReminderId &&
      isSuccess &&
      !isLoading &&
      expandedReminderRef.current !== expandReminderId
    ) {
      // Search in both pinned and unpinned feeds
      const allItems = [...pinnedFeed, ...unpinnedFeed];
      const reminderItem = allItems.find(
        (item) =>
          item.source_id === expandReminderId &&
          (item.type === "local_reminders" || item.type === "global_reminders"),
      );

      if (reminderItem) {
        expandedReminderRef.current = expandReminderId;
        setExpandedItem(reminderItem);
      }
    }
  }, [expandReminderId, isSuccess, isLoading, pinnedFeed, unpinnedFeed]);

  // handle feedItem pin toggling

  const { togglePin } = useTogglePin();

  // handle feedItem deletion

  const { handleDelete } = useDeleteSession();

  // useFullSessions hook to get full sessions

  const {
    GymSessionFull,
    GymSessionError,
    isLoadingGymSession,
    todoSessionFull,
    todoSessionError,
    isLoadingTodoSession,
    refetchFullTodo,
    refetchFullActivity,
    activitySessionFull,
    activitySessionError,
    isLoadingActivitySession,
    notesSessionFull,
    notesSessionError,
    isLoadingNotesSession,
  } = useFullSessions(expandedItem, editingItem);

  // useUpdateFeedItem hook to update feed item in cache
  const { updateFeedItem } = useUpdateFeedItem();

  // useUpdateFeedItem hook to update feed item in cache and move it to top
  const { updateFeedItemToTop } = useUpdateFeedItemToTop();

  if (!feedReady) {
    return null;
  }

  return (
    <LinearGradient
      className="flex-1"
      colors={["#020618", "#1d293d"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      {isLoading || !data ? (
        <>
          <FeedSkeleton count={5} />
        </>
      ) : error ? (
        <AppText className="text-center text-lg mt-20 mx-auto px-10">
          {t("feed.loadError")}
        </AppText>
      ) : !data || (unpinnedFeed.length === 0 && pinnedFeed.length === 0) ? (
        <AppText className="text-center text-lg mt-20 mx-auto px-10">
          {t("feed.noSessions")}
        </AppText>
      ) : (
        <>
          <FlatList
            data={unpinnedFeed}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{
              paddingBottom: 100,
              paddingTop: pinnedFeed.length === 0 ? 30 : 0,
            }}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={async () => {
                  setRefreshing(true);
                  await mutateFeed();
                  setRefreshing(false);
                }}
              />
            }
            onEndReached={() => {
              if (hasNextPage && !isFetchingNextPage) {
                fetchNextPage();
              }
            }}
            onEndReachedThreshold={0.5}
            renderItem={({ item: feedItem }) => (
              <View className={`px-4 ${unpinnedFeed ? "pb-10" : ""}`}>
                <FeedCard
                  item={feedItem as FeedItemUI}
                  pinned={false}
                  onExpand={() => {
                    setExpandedItem(feedItem);
                  }}
                  onTogglePin={() =>
                    togglePin(
                      feedItem.id,
                      feedItem.type,
                      feedItem.feed_context,
                      "main",
                    )
                  }
                  onDelete={() => {
                    handleDelete(feedItem.source_id, feedItem.type);
                  }}
                  onEdit={() => {
                    if (feedItem.type === "gym_sessions") {
                      router.push(`/gym/gym/${feedItem.source_id}`);
                    } else {
                      setEditingItem({ ...feedItem, id: feedItem.source_id });
                    }
                  }}
                />
              </View>
            )}
            ListHeaderComponent={
              <FeedHeader
                pinnedFeed={pinnedFeed}
                setExpandedItem={setExpandedItem}
                setEditingItem={setEditingItem}
                pinned_context="main"
              />
            }
            ListFooterComponent={
              <FeedFooter
                isFetchingNextPage={isFetchingNextPage}
                hasNextPage={hasNextPage}
                data={data}
              />
            }
          />
        </>
      )}

      {expandedItem && (
        <FullScreenModal
          isOpen={!!expandedItem}
          onClose={() => {
            setExpandedItem(null);
            // Reset ref so same reminder can be expanded again from alarm
            expandedReminderRef.current = null;
          }}
        >
          {expandedItem.type === "notes" && (
            <NotesSession
              note={expandedItem}
              voiceRecordings={notesSessionFull}
              isLoadingVoice={isLoadingNotesSession}
              error={notesSessionError}
            />
          )}
          {expandedItem.type === "weight" && (
            <WeightSession {...expandedItem} />
          )}
          {expandedItem.type === "global_reminders" && (
            <ReminderSession {...expandedItem} />
          )}

          {expandedItem.type === "local_reminders" && (
            <ReminderSession {...expandedItem} />
          )}

          {expandedItem.type === "todo_lists" && (
            <>
              {isLoadingTodoSession ? (
                <View className="gap-2 justify-center items-center pt-40">
                  <AppText className="text-lg">{t("feed.loadingTodo")}</AppText>
                  <ActivityIndicator />
                </View>
              ) : todoSessionError ? (
                <View>
                  <AppText className="gap-2 justify-center mt-20 text-lg">
                    {t("feed.todoError")}
                  </AppText>
                </View>
              ) : (
                todoSessionFull && (
                  <TodoSession
                    initialTodo={todoSessionFull}
                    onSave={(updatedItem) => {
                      updateFeedItemToTop(updatedItem);
                      refetchFullTodo();
                    }}
                  />
                )
              )}
            </>
          )}

          {expandedItem.type === "gym_sessions" && (
            <>
              {isLoadingGymSession ? (
                <View className="gap-5 items-center justify-center mt-40 px-10">
                  <AppText className="text-lg">{t("feed.loadingGym")}</AppText>
                  <ActivityIndicator />
                </View>
              ) : GymSessionError ? (
                <AppText className="text-center text-xl mt-40 px-10">
                  {t("feed.gymError")}
                </AppText>
              ) : (
                GymSessionFull && <GymSession {...GymSessionFull} />
              )}
            </>
          )}

          {expandedItem.type === "activity_sessions" && (
            <>
              {isLoadingActivitySession ? (
                <View className="gap-5 items-center justify-center mt-40 px-10">
                  <AppText className="text-lg">
                    {t("feed.loadingActivity")}
                  </AppText>
                  <ActivityIndicator />
                </View>
              ) : activitySessionError ? (
                <AppText className="text-center text-xl mt-40 px-10">
                  {t("feed.activityError")}
                </AppText>
              ) : (
                activitySessionFull && (
                  <ActivitySession {...activitySessionFull} />
                )
              )}
            </>
          )}
        </FullScreenModal>
      )}

      {editingItem && (
        <FullScreenModal
          isOpen={!!editingItem}
          onClose={() => setEditingItem(null)}
        >
          {editingItem.type === "notes" && (
            <EditNotes
              note={editingItem}
              onClose={() => setEditingItem(null)}
              onSave={(updatedItem) => {
                updateFeedItemToTop(updatedItem);
                queryClient.refetchQueries({
                  queryKey: ["fullNotesSession", editingItem.source_id],
                });
                setEditingItem(null);
              }}
              voiceRecordings={notesSessionFull}
              isLoadingVoice={isLoadingNotesSession}
            />
          )}

          {editingItem.type === "global_reminders" && (
            <HandleEditGlobalReminder
              reminder={editingItem}
              onClose={() => setEditingItem(null)}
              onSave={(updatedItem) => {
                updateFeedItemToTop(updatedItem);
                setEditingItem(null);
              }}
            />
          )}

          {editingItem.type === "local_reminders" && (
            <HandleEditLocalReminder
              reminder={editingItem}
              onClose={() => setEditingItem(null)}
              onSave={(updatedItem) => {
                updateFeedItemToTop(updatedItem);
                setEditingItem(null);
              }}
            />
          )}

          {editingItem.type === "todo_lists" && (
            <>
              {isLoadingTodoSession ? (
                <View className="gap-5 items-center justify-center mt-40 px-10">
                  <AppText className="text-lg">{t("feed.loadingTodo")}</AppText>
                  <ActivityIndicator />
                </View>
              ) : todoSessionError ? (
                <AppText className="text-center text-xl mt-40 px-10">
                  {t("feed.todoError")}
                </AppText>
              ) : (
                todoSessionFull && (
                  <EditTodo
                    todo_session={todoSessionFull}
                    onClose={() => setEditingItem(null)}
                    onSave={async (updatedItem) => {
                      await Promise.all([
                        updateFeedItemToTop(updatedItem),
                        refetchFullTodo(),
                      ]);
                      setEditingItem(null);
                    }}
                  />
                )
              )}
            </>
          )}

          {editingItem.type === "activity_sessions" && (
            <>
              {isLoadingActivitySession ? (
                <View className="gap-5 items-center justify-center mt-40 px-10">
                  <AppText className="text-lg">
                    {t("feed.loadingActivity")}
                  </AppText>
                  <ActivityIndicator />
                </View>
              ) : activitySessionError ? (
                <AppText className="text-center text-xl mt-40 px-10">
                  {t("feed.activityError")}
                </AppText>
              ) : (
                activitySessionFull && (
                  <ActivitySessionEdit
                    activity={activitySessionFull}
                    onClose={() => setEditingItem(null)}
                    onSave={async (updatedItem) => {
                      await Promise.all([
                        updateFeedItem(updatedItem),
                        refetchFullActivity(),
                      ]);
                      setEditingItem(null);
                    }}
                  />
                )
              )}
            </>
          )}

          {editingItem.type === "weight" && (
            <EditWeight
              weight={editingItem}
              onClose={() => setEditingItem(null)}
              onSave={(updatedItem) => {
                updateFeedItem(updatedItem);
                setEditingItem(null);
              }}
            />
          )}
        </FullScreenModal>
      )}
    </LinearGradient>
  );
}
