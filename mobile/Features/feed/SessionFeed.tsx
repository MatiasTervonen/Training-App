import { useEffect, useState } from "react";
import AppText from "@/components/AppText";
import {
  FlatList,
  RefreshControl,
  View,
  ActivityIndicator,
} from "react-native";
import FeedCard from "@/Features/feed-cards/FeedCard";
import { FeedSkeleton } from "@/components/skeletetons";
import { LinearGradient } from "expo-linear-gradient";
import { useQueryClient } from "@tanstack/react-query";
import FullScreenModal from "@/components/FullScreenModal";
import GymSession from "@/Features/expand-session-cards/gym";
import NotesSession from "@/Features/expand-session-cards/notes";
import WeightSession from "@/Features/expand-session-cards/weight";
import EditNotes from "@/Features/edit-session-cards/editNotes";
import EditWeight from "@/Features/edit-session-cards/editWeight";
import HandleEditGlobalReminder from "@/Features/edit-session-cards/editGlobalReminder";
import { useRouter } from "expo-router";
import TodoSession from "@/Features/expand-session-cards/todo";
import EditTodo from "@/Features/edit-session-cards/editTodo";
import ReminderSession from "@/Features/expand-session-cards/reminder";
import useDeleteSession from "@/Features/feed/hooks/useDeleteSession";
import useTogglePin from "@/Features/feed/hooks/useTogglePin";
import useFeed from "@/Features/feed/hooks/useFeed";
import useFullSessions from "@/Features/feed/hooks/useFullSessions";
import FeedHeader from "@/Features/feed/FeedHeader";
import FeedFooter from "@/Features/feed/FeedFooter";
import HandleEditLocalReminder from "@/Features/edit-session-cards/editLocalReminder";
import { useAppReadyStore } from "@/lib/stores/appReadyStore";
import { FeedItemUI } from "@/types/session";
import useUpdateFeedItem from "@/Features/feed/hooks/useUpdateFeedItem";
import ActivitySession from "@/Features/expand-session-cards/actrivity/activity";

export default function SessionFeed() {
  const setFeedReady = useAppReadyStore((state) => state.setFeedReady);
  const feedReady = useAppReadyStore((state) => state.feedReady);

  const [expandedItem, setExpandedItem] = useState<FeedItemUI | null>(null);
  const [editingItem, setEditingItem] = useState<FeedItemUI | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const queryClient = useQueryClient();

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
    activitySessionFull,
    activitySessionError,
    isLoadingActivitySession,
  } = useFullSessions(expandedItem, editingItem);

  // useUpdateFeedItem hook to update feed item in cache
  const { updateFeedItem } = useUpdateFeedItem();

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
        <AppText className="text-center text-lg mt-10 mx-auto">
          Failed to load sessions. Please try again later.
        </AppText>
      ) : !data || (unpinnedFeed.length === 0 && pinnedFeed.length === 0) ? (
        <AppText className="text-center text-lg mt-20">
          No sessions yet. Let's get started!
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
                    togglePin(feedItem.id, feedItem.type, feedItem.feed_context)
                  }
                  onDelete={() => {
                    handleDelete(feedItem.source_id, feedItem.type);
                  }}
                  onEdit={() => {
                    if (feedItem.type === "gym_sessions") {
                      router.push(`/gym/gym/${feedItem.source_id}` as any);
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
          onClose={() => setExpandedItem(null)}
        >
          {expandedItem.type === "notes" && <NotesSession {...expandedItem} />}
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
                  <AppText className="text-lg">Loading todo session...</AppText>
                  <ActivityIndicator />
                </View>
              ) : todoSessionError ? (
                <View>
                  <AppText className="gap-2 justify-center mt-20 text-lg">
                    Failed to load todo session details. Please try again later.
                  </AppText>
                </View>
              ) : (
                todoSessionFull && (
                  <TodoSession
                    initialTodo={todoSessionFull}
                    onSave={async (updatedItem) => {
                      await Promise.all([
                        updateFeedItem(updatedItem),
                        refetchFullTodo(),
                      ]);
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
                  <AppText className="text-lg">
                    Loading gym session details...
                  </AppText>
                  <ActivityIndicator />
                </View>
              ) : GymSessionError ? (
                <AppText className="text-center text-xl mt-40 px-10">
                  Failed to load gym session details. Please try again later.
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
                    Loading activity session details...
                  </AppText>
                  <ActivityIndicator />
                </View>
              ) : activitySessionError ? (
                <AppText className="text-center text-xl mt-40 px-10">
                  Failed to load activity session details. Please try again
                  later.
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
                updateFeedItem(updatedItem);
                setEditingItem(null);
              }}
            />
          )}

          {editingItem.type === "global_reminders" && (
            <HandleEditGlobalReminder
              reminder={editingItem}
              onClose={() => setEditingItem(null)}
              onSave={async () => {
                await queryClient.invalidateQueries({ queryKey: ["feed"] });
                setEditingItem(null);
              }}
            />
          )}

          {editingItem.type === "local_reminders" && (
            <HandleEditLocalReminder
              reminder={editingItem}
              onClose={() => setEditingItem(null)}
              onSave={(updatedItem) => {
                updateFeedItem(updatedItem);
                setEditingItem(null);
              }}
            />
          )}

          {editingItem.type === "todo_lists" && (
            <>
              {isLoadingTodoSession ? (
                <View className="gap-5 items-center justify-center mt-40 px-10">
                  <AppText className="text-lg">Loading todo session...</AppText>
                  <ActivityIndicator />
                </View>
              ) : todoSessionError ? (
                <AppText className="text-center text-xl mt-40 px-10">
                  Failed to load todo session details. Please try again later.
                </AppText>
              ) : (
                todoSessionFull && (
                  <EditTodo
                    todo_session={todoSessionFull}
                    onClose={() => setEditingItem(null)}
                    onSave={async (updatedItem) => {
                      await Promise.all([
                        updateFeedItem(updatedItem),
                        queryClient.invalidateQueries({
                          queryKey: ["fullTodoSession"],
                        }),
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
