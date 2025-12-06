import {
  full_gym_session,
  full_todo_session,
  FeedCardProps,
} from "@/types/models";
import { useState, useMemo, useEffect, useRef } from "react";
import Toast from "react-native-toast-message";
import AppText from "@/components/AppText";
import { unpinItem } from "@/database/pinned/unpin-items";
import { pinItem } from "@/database/pinned/pin-items";
import {
  FlatList,
  RefreshControl,
  View,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import FeedCard from "@/components/cards/FeedCard";
import { DeleteSession } from "@/database/feed/deleteSession";
import { FeedSkeleton } from "@/components/skeletetons";
import { LinearGradient } from "expo-linear-gradient";
import { handleError } from "@/utils/handleError";
import { Feed_item, full_reminder } from "@/types/session";
import { confirmAction } from "@/lib/confirmAction";
import {
  useQuery,
  useInfiniteQuery,
  useQueryClient,
} from "@tanstack/react-query";
import FullScreenModal from "../FullScreenModal";
import GymSession from "../expandSession/gym";
import { getFullGymSession } from "@/database/gym/get-full-gym-session";
import NotesSession from "../expandSession/notes";
import WeightSession from "../expandSession/weight";
import EditNotes from "../editSession/editNotes";
import EditWeight from "../editSession/editWeight";
import ReminderSession from "../expandSession/reminder";
import EditReminder from "../editSession/editReminder";
import * as Notifications from "expo-notifications";
import { supabase } from "@/lib/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import CustomReminder from "../expandSession/customReminder";
import GetFullCustomReminder from "@/database/reminders/get-full-custom-reminder";
import getFeed from "@/database/feed/getFeed";
import PinnedCarousel from "./PinnedCarousel";
import { useRouter } from "expo-router";
import TodoSession from "../expandSession/todo";
import { getFullTodoSession } from "@/database/todo/get-full-todo";
import EditTodo from "../editSession/editTodo";

type FeedItem = FeedCardProps;

type FeedData = {
  pageParams: number[];
  pages: {
    feed: Feed_item[];
    nextPage: number;
  }[];
};

export default function SessionFeed() {
  const [expandedItem, setExpandedItem] = useState<FeedItem | null>(null);
  const [editingItem, setEditingItem] = useState<FeedItem | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const queryClient = useQueryClient();

  const width = Dimensions.get("window").width;

  const router = useRouter();

  // useEffect(() => {
  //   const fetchNotifications = async () => {
  //     const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  //     // console.log("Scheduled notifications:", scheduled);
  //   };

  //   fetchNotifications();
  // }, []);

  const handleNotificationResponse = async (
    response: Notifications.NotificationResponse
  ) => {
    const data = response.notification.request.content.data;
    if (data?.reminderId) {
      try {
        console.log("Fetching reminder for ID:", data.reminderId);
        const { data: feedItem, error } = await supabase
          .from("feed_with_pins")
          .select("*")
          .eq("id", data.reminderId)
          .single();

        if (error) {
          throw error;
        }

        if (!feedItem) {
          Toast.show({
            type: "error",
            text1: "Error",
            text2: "Reminder not found.",
          });
          return;
        }

        if (feedItem) {
          setExpandedItem({
            table: "reminders",
            item: { ...feedItem, id: feedItem.id },
            pinned: feedItem.pinned,
          } as any);
        }
      } catch (error) {
        console.error("Error fetching reminder from notification:", error);
        handleError(error, {
          message: "Error fetching reminder from notification",
          route: "/notifications/response",
          method: "GET",
        });
      }
    }
  };

  useEffect(() => {
    const handleResponse = async (
      response: Notifications.NotificationResponse
    ) => {
      const notifId = response.notification.request.identifier;
      console.log("Notification response received with ID:", notifId);

      const lastHandled = await AsyncStorage.getItem("lastHandledNotification");

      if (lastHandled === notifId) {
        console.log("Notification already handled, skipping.");
        return;
      }

      await AsyncStorage.setItem("lastHandledNotification", notifId);
      await handleNotificationResponse(response);
    };

    //  Handle case: app already open or in background
    const sub =
      Notifications.addNotificationResponseReceivedListener(handleResponse);

    // Handle case: app launched from killed state
    (async () => {
      const lastResponse = Notifications.getLastNotificationResponse();

      if (lastResponse) {
        await handleResponse(lastResponse);
      }
    })();

    return () => sub.remove();
  }, []);

  const {
    data,
    error,
    isLoading,
    refetch: mutateFeed,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["feed"],
    queryFn: ({ pageParam = 0 }) => getFeed({ pageParam, limit: 15 }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextPage,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  // Keep only first page in cahce when user leaves feed

  useEffect(() => {
    return () => {
      queryClient.setQueryData<FeedData>(["feed"], (old) => {
        if (!old) return old;

        return {
          ...old,
          pages: old.pages.slice(0, 1),
          pageParams: old.pageParams.slice(0, 1),
        };
      });
    };
  }, [queryClient]);

  // Flattens the data in single array of FeedItem[]

  const feed: FeedItem[] = useMemo(() => {
    if (!data) return [];

    return data.pages.flatMap(
      (page) =>
        page.feed.map((item) => ({
          table: item.type as FeedItem["table"],
          item,
          pinned: item.pinned,
        })) as unknown as FeedItem
    );
  }, [data]);

  // Pinned items first, then by created_at desc for stable ordering in UI

  const pinnedFeed = useMemo(() => feed.filter((i) => i.pinned), [feed]);
  const unpinnedFeed = useMemo(
    () =>
      feed
        .filter((i) => !i.pinned)
        .sort((a, b) => {
          const aTime = new Date(
            a.item.updated_at || a.item.created_at
          ).getTime();
          const bTime = new Date(
            b.item.updated_at || b.item.created_at
          ).getTime();
          return bTime - aTime;
        }),
    [feed]
  );

  const togglePin = async (
    id: string,
    table:
      | "notes"
      | "gym_sessions"
      | "weight"
      | "todo_lists"
      | "reminders"
      | "custom_reminders",
    isPinned: boolean
  ) => {
    if (!isPinned && pinnedFeed.length >= 10) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "You can only pin 10 items. Unpin something first.",
      });
      return;
    }
    const queryKey = ["feed"];

    await queryClient.cancelQueries({ queryKey });

    const previousFeed = queryClient.getQueryData(queryKey);

    queryClient.setQueryData<FeedData>(["feed"], (oldData) => {
      if (!oldData) return oldData;

      return {
        ...oldData,
        pages: oldData.pages.map((page) => ({
          ...page,
          feed: page.feed.map((feedItem) =>
            feedItem.id === id ? { ...feedItem, pinned: !isPinned } : feedItem
          ),
        })),
      };
    });

    try {
      if (isPinned) {
        await unpinItem({ id, table });
      } else {
        await pinItem({ id, table });
      }

      Toast.show({
        type: "success",
        text1: isPinned ? "Unpinned" : "Pinned",
        text2: `Item has been ${
          isPinned ? "unpinned" : "pinned"
        } successfully.`,
      });
    } catch {
      queryClient.setQueryData(queryKey, previousFeed);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to toggle pin status.",
      });
    }
  };

  const handleDelete = async (
    notification_id: string[] | string | null,
    id: string,
    table: string
  ) => {
    const confirmed = await confirmAction({
      title: "Are you sure you want to delete this session?",
    });
    if (!confirmed) return;

    const queryKey = ["feed"];

    await queryClient.cancelQueries({ queryKey });

    const previousFeed = queryClient.getQueryData(queryKey);

    queryClient.setQueryData<FeedData>(queryKey, (oldData) => {
      if (!oldData) return oldData;

      const newPages = oldData.pages.map((page) => {
        const newFeed = page.feed.filter((feedItem) => feedItem.id !== id);
        return { ...page, feed: newFeed };
      });
      return { ...oldData, pages: newPages };
    });

    try {
      await DeleteSession(id, table);

      if (table === "weight") {
        queryClient.refetchQueries({
          queryKey: ["get-weight"],
          exact: true,
        });
      }

      if (table === "reminders" || table === "custom_reminders") {
        queryClient.refetchQueries({
          queryKey: ["get-reminders"],
          exact: true,
        });
      }

      if (table === "custom_reminders") {
        if (Array.isArray(notification_id)) {
          for (const id of notification_id) {
            await Notifications.cancelScheduledNotificationAsync(id);
          }
        }
      }

      Toast.show({
        type: "success",
        text1: "Deleted",
        text2: "Item has been deleted successfully.",
      });
    } catch {
      queryClient.setQueryData(queryKey, previousFeed);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to delete item.",
      });
    }
  };

  const getId = (fi: FeedItem | null) => fi?.item.id ?? null;

  const expandedId = getId(expandedItem);
  const editingId = getId(editingItem);

  const gymId =
    expandedItem?.table === "gym_sessions"
      ? expandedId
      : editingItem?.table === "gym_sessions"
      ? editingId
      : null;

  const customReminderId =
    expandedItem?.table === "custom_reminders"
      ? expandedId
      : editingItem?.table === "custom_reminders"
      ? editingId
      : null;

  const todoId =
    expandedItem?.table === "todo_lists"
      ? expandedId
      : editingItem?.table === "todo_lists"
      ? editingId
      : null;

  const {
    data: GymSessionFull,
    error: GymSessionError,
    isLoading: isLoadingGymSession,
  } = useQuery<full_gym_session>({
    queryKey: ["fullGymSession", gymId],
    queryFn: () => getFullGymSession(gymId!),
    enabled: !!gymId,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const {
    data: CustomReminderFull,
    error: CustomReminderError,
    isLoading: isLoadingCustomReminder,
  } = useQuery<full_reminder>({
    queryKey: ["fullCustomReminder", customReminderId],
    queryFn: () => GetFullCustomReminder(customReminderId!),
    enabled: !!customReminderId,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const {
    data: todoSessionFull,
    error: todoSessionError,
    isLoading: isLoadingTodoSession,
    refetch: refetchFullTodo,
  } = useQuery<full_todo_session>({
    queryKey: ["fullTodoSession", todoId],
    queryFn: async () => await getFullTodoSession(todoId!),
    enabled: !!todoId,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  // runs when feed finishes loading. Prefetch full sessions

  const hashPrefetched = useRef(false);

  useEffect(() => {
    if (!data || hashPrefetched.current) return;
    if (data.pages.length === 0) return;

    hashPrefetched.current = true;

    const firstPageFeed = data.pages[0].feed;

    firstPageFeed.forEach((f) => {
      if (f.type === "todo_lists") {
        queryClient.prefetchQuery({
          queryKey: ["fullTodoSession", f.id],
          queryFn: () => getFullTodoSession(f.id!),
          staleTime: Infinity,
          gcTime: Infinity,
        });
      }
    });

    firstPageFeed.forEach((f) => {
      if (f.type === "gym_sessions") {
        queryClient.prefetchQuery({
          queryKey: ["fullGymSession", f.id],
          queryFn: () => getFullGymSession(f.id!),
          staleTime: Infinity,
          gcTime: Infinity,
        });
      }
    });
  }, [data, queryClient]);

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
          No sessions yet. Let&apos;s get started!
        </AppText>
      ) : (
        <>
          <FlatList
            data={unpinnedFeed}
            keyExtractor={(item) => item.item.id}
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
                      feedItem.table === "custom_reminders"
                        ? (feedItem.item.notification_id as
                            | string
                            | string[]
                            | null) ?? null
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
              pinnedFeed.length > 0 ? (
                <PinnedCarousel
                  pinnedFeed={pinnedFeed}
                  width={width}
                  onExpand={setExpandedItem}
                  onEdit={setEditingItem}
                  onTogglePin={(item) =>
                    togglePin(item.item.id, item.table, item.pinned)
                  }
                  onDelete={(item) =>
                    handleDelete(
                      item.item.notification_id ?? null,
                      item.item.id,
                      item.table
                    )
                  }
                />
              ) : null
            }
            ListFooterComponent={() => {
              if (isFetchingNextPage) {
                return (
                  <View className="items-center justify-center gap-2">
                    <AppText className="text-center text-gray-300 text-lg">
                      Loading more...
                    </AppText>
                    <ActivityIndicator
                      size="large"
                      color="#193cb8"
                      className="my-5"
                    />
                  </View>
                );
              }

              if (hasNextPage) {
                return <View className="h-20" />;
              }

              if (!hasNextPage && data?.pages.length > 1) {
                return (
                  <AppText className="text-center justify-center mt-10 text-gray-300">
                    No more sessions
                  </AppText>
                );
              }

              return null;
            }}
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
          {expandedItem.table === "reminders" && (
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

          {expandedItem.table === "custom_reminders" && (
            <View>
              {isLoadingCustomReminder ? (
                <View className="gap-5 items-center justify-center mt-40">
                  <AppText className="text-xl">
                    Loading reminder details...
                  </AppText>
                  <ActivityIndicator size="large" />
                </View>
              ) : CustomReminderError ? (
                <AppText className="text-center text-xl mt-10">
                  Failed to load reminder details. Please try again later.
                </AppText>
              ) : (
                CustomReminderFull && <CustomReminder {...CustomReminderFull} />
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

          {editingItem.table === "reminders" && (
            <EditReminder
              reminder={editingItem.item}
              onClose={() => setEditingItem(null)}
              onSave={async () => {
                await queryClient.invalidateQueries({ queryKey: ["feed"] });
                setEditingItem(null);
              }}
            />
          )}

          {editingItem.table === "todo_lists" && (
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
