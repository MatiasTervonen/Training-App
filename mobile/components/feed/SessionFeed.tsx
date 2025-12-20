import { FeedItem } from "@/types/models";
import { useEffect, useState } from "react";
import AppText from "@/components/AppText";
import {
  FlatList,
  RefreshControl,
  View,
  ActivityIndicator,
} from "react-native";
import FeedCard from "@/components/cards/FeedCard";
import { FeedSkeleton } from "@/components/skeletetons";
import { LinearGradient } from "expo-linear-gradient";
import { useQueryClient } from "@tanstack/react-query";
import FullScreenModal from "../FullScreenModal";
import GymSession from "../expandSession/gym";
import NotesSession from "../expandSession/notes";
import WeightSession from "../expandSession/weight";
import EditNotes from "../editSession/editNotes";
import EditWeight from "../editSession/editWeight";
import HandleEditGlobalReminder from "../editSession/editGlobalReminder";
import { useRouter } from "expo-router";
import TodoSession from "../expandSession/todo";
import EditTodo from "../editSession/editTodo";
import ReminderSession from "../expandSession/reminder";
import useDeleteSession from "@/hooks/feed/useDeleteSession";
import useTogglePin from "@/hooks/feed/useTogglePin";
import useFeed from "@/hooks/feed/useFeed";
import useFeedPrefetch from "@/hooks/feed/useFeedPrefetch";
import useFullSessions from "@/hooks/feed/useFullSessions";
import FeedHeader from "./FeedHeader";
import FeedFooter from "./FeedFooter";
import HandleEditLocalReminder from "../editSession/editLocalReminder";
import { useAppReadyStore } from "@/lib/stores/appReadyStore";

export default function SessionFeed() {
  const setFeedReady = useAppReadyStore((state) => state.setFeedReady);
  const feedReady = useAppReadyStore((state) => state.feedReady);

  const [expandedItem, setExpandedItem] = useState<FeedItem | null>(null);
  const [editingItem, setEditingItem] = useState<FeedItem | null>(null);
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
    pinnedFeed,
    comingSoonFeed,
    unpinnedFeed,
    feed,
    isSuccess,
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
    LocalReminderFull,
    LocalReminderError,
    isLoadingLocalReminder,
    todoSessionFull,
    todoSessionError,
    isLoadingTodoSession,
    refetchFullTodo,
  } = useFullSessions(expandedItem, editingItem);

  // prefetch full sessions when feed finishes loading

  useFeedPrefetch(data);

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
      ) : !data || feed.length === 0 ? (
        <AppText className="text-center text-lg mt-20">
          No sessions yet. Let's get started!
        </AppText>
      ) : (
        <>
          <FlatList
            data={unpinnedFeed}
            keyExtractor={(item) => item.item.id}
            contentContainerStyle={{
              paddingBottom: 100,
              paddingTop:
                pinnedFeed.length + comingSoonFeed.length === 0 ? 30 : 0,
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
                  {...feedItem}
                  pinned={false}
                  onExpand={() => {
                    setExpandedItem(feedItem);
                  }}
                  onTogglePin={() =>
                    togglePin(feedItem.item.id, feedItem.table, false)
                  }
                  onDelete={() => {
                    const notificationId =
                      feedItem.table === "local_reminders"
                        ? ((feedItem.item.notification_id as
                            | string
                            | string[]
                            | null) ?? null)
                        : null;

                    handleDelete(
                      notificationId,
                      feedItem.item.id,
                      feedItem.table
                    );
                  }}
                  onEdit={() => {
                    if (feedItem.table === "gym_sessions") {
                      router.push(`/training/gym/${feedItem.item.id}` as any);
                    } else {
                      setEditingItem(feedItem);
                    }
                  }}
                />
              </View>
            )}
            ListHeaderComponent={
              <FeedHeader
                pinnedFeed={pinnedFeed}
                comingSoonFeed={comingSoonFeed}
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
          {expandedItem.table === "notes" && (
            <NotesSession {...expandedItem.item} />
          )}
          {expandedItem.table === "weight" && (
            <WeightSession {...expandedItem.item} />
          )}
          {expandedItem.table === "global_reminders" && (
            <ReminderSession {...expandedItem.item} />
          )}

          {expandedItem.table === "todo_lists" && (
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
                    mutateFullTodoSession={async () => {
                      await refetchFullTodo();
                    }}
                  />
                )
              )}
            </>
          )}

          {expandedItem.table === "local_reminders" && (
            <View>
              {isLoadingLocalReminder ? (
                <View className="gap-5 items-center justify-center mt-40">
                  <AppText className="text-xl">
                    Loading reminder details...
                  </AppText>
                  <ActivityIndicator size="large" />
                </View>
              ) : LocalReminderError ? (
                <AppText className="text-center text-xl mt-10">
                  Failed to load reminder details. Please try again later.
                </AppText>
              ) : (
                LocalReminderFull && <ReminderSession {...LocalReminderFull} />
              )}
            </View>
          )}

          {expandedItem.table === "gym_sessions" && (
            <View>
              {isLoadingGymSession ? (
                <View className="gap-5 items-center justify-center mt-40">
                  <AppText className="text-xl">
                    Loading gym session details...
                  </AppText>
                  <ActivityIndicator size="large" />
                </View>
              ) : GymSessionError ? (
                <AppText className="text-center text-xl mt-10">
                  Failed to load gym session details. Please try again later.
                </AppText>
              ) : (
                GymSessionFull && <GymSession {...GymSessionFull} />
              )}
            </View>
          )}
        </FullScreenModal>
      )}

      {editingItem && (
        <FullScreenModal
          isOpen={!!editingItem}
          onClose={() => setEditingItem(null)}
        >
          {editingItem.table === "notes" && (
            <EditNotes
              note={editingItem.item}
              onClose={() => setEditingItem(null)}
              onSave={async () => {
                await queryClient.invalidateQueries({ queryKey: ["feed"] });
                setEditingItem(null);
              }}
            />
          )}

          {editingItem.table === "global_reminders" && (
            <HandleEditGlobalReminder
              reminder={editingItem.item}
              onClose={() => setEditingItem(null)}
              onSave={async () => {
                await queryClient.invalidateQueries({ queryKey: ["feed"] });
                setEditingItem(null);
              }}
            />
          )}

          {editingItem.table === "local_reminders" && (
            <>
              {isLoadingLocalReminder ? (
                <View className="gap-5 items-center justify-center mt-40">
                  <AppText className="text-lg">
                    Loading reminder details...
                  </AppText>
                  <ActivityIndicator />
                </View>
              ) : LocalReminderError ? (
                <AppText className="text-center text-lg mt-20">
                  Failed to load reminder details. Please try again later.
                </AppText>
              ) : (
                LocalReminderFull && (
                  <HandleEditLocalReminder
                    reminder={LocalReminderFull!}
                    onClose={() => setEditingItem(null)}
                    onSave={async () => {
                      await Promise.all([
                        queryClient.invalidateQueries({
                          queryKey: ["feed"],
                        }),
                        queryClient.invalidateQueries({
                          queryKey: ["fullLocalReminder"],
                        }),
                      ]);
                      setEditingItem(null);
                    }}
                  />
                )
              )}
            </>
          )}

          {editingItem.table === "todo_lists" && (
            <>
              {isLoadingTodoSession ? (
                <View className="gap-2 justify-center items-center pt-40">
                  <AppText className="text-lg">Loading todo session...</AppText>
                  <ActivityIndicator />
                </View>
              ) : todoSessionError ? (
                <AppText className="gap-2 justify-center mt-20 text-lg">
                  Failed to load todo session details. Please try again later.
                </AppText>
              ) : (
                todoSessionFull && (
                  <EditTodo
                    todo_session={todoSessionFull}
                    onClose={() => setEditingItem(null)}
                    onSave={async () => {
                      await Promise.all([
                        queryClient.invalidateQueries({
                          queryKey: ["feed"],
                        }),
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

          {editingItem.table === "weight" && (
            <EditWeight
              weight={editingItem.item}
              onClose={() => setEditingItem(null)}
              onSave={async () => {
                await queryClient.invalidateQueries({ queryKey: ["feed"] });
                setEditingItem(null);
              }}
            />
          )}
        </FullScreenModal>
      )}
    </LinearGradient>
  );
}
