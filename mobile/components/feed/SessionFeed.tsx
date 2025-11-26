import { full_gym_session } from "@/types/models";
import { useState, useMemo, useEffect } from "react";
import Toast from "react-native-toast-message";
import AppText from "@/components/AppText";
import { unpinItem } from "@/api/pinned/unpin-items";
import { pinItem } from "@/api/pinned/pin-items";
import {
  FlatList,
  RefreshControl,
  View,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import FeedCard from "@/components/cards/FeedCard";
import { DeleteSession } from "@/api/feed/deleteSession";
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
import { getFullGymSession } from "@/api/gym/get-full-gym-session";
import NotesSession from "../expandSession/notes";
import WeightSession from "../expandSession/weight";
import EditGym from "../editSession/editGym";
import EditNotes from "../editSession/editNotes";
import EditWeight from "../editSession/editWeight";
import ReminderSession from "../expandSession/reminder";
import EditReminder from "../editSession/editReminder";
import * as Notifications from "expo-notifications";
import { supabase } from "@/lib/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import CustomReminder from "../expandSession/customReminder";
import GetFullCustomReminder from "@/api/reminders/get-full-custom-reminder";
import getFeed from "@/api/feed/getFeed";
import PinnedCarousel from "./PinnedCarousel";

type FeedItem = {
  table:
    | "notes"
    | "gym_sessions"
    | "weight"
    | "todo_lists"
    | "reminders"
    | "custom_reminders";
  item: Feed_item;
  pinned: boolean;
};

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
          });
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
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["feed"],
    queryFn: ({ pageParam = 0 }) => getFeed({ pageParam, limit: 15 }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextPage,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
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
        .sort(
          (a, b) =>
            new Date(b.item.created_at).getTime() -
            new Date(a.item.created_at).getTime()
        ),
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

      if (table === "custom_reminders") {
        if (Array.isArray(notification_id)) {
          for (const id of notification_id) {
            await Notifications.cancelScheduledNotificationAsync(id);
          }
        }
        queryClient.refetchQueries({
          queryKey: ["get-reminders"],
          exact: true,
        });
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

  const {
    data: GymSessionFull,
    error: GymSessionError,
    isLoading: isLoadingGymSession,
  } = useQuery<full_gym_session>({
    queryKey: ["fullGymSession", gymId],
    queryFn: () => getFullGymSession(gymId!),
    enabled: !!gymId,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
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
  });

  return (
    <LinearGradient
      className="flex-1"
      colors={["#020618", "#1d293d"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      {isLoading || isRefetching ? (
        <>
          <FeedSkeleton count={5} />
        </>
      ) : error ? (
        <AppText className="text-center text-lg mt-10 mx-auto">
          Failed to load sessions. Please try again later.
        </AppText>
      ) : feed.length === 0 ? (
        <AppText className="text-center text-lg mt-10">
          No sessions yet. Let&apos;s get started!
        </AppText>
      ) : (
        <>
          <FlatList
            data={unpinnedFeed}
            keyExtractor={(item) => item.item.id}
            contentContainerStyle={{ paddingBottom: 100, paddingTop: 8 }}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={(!isLoading && isRefetching) || refreshing}
                onRefresh={async () => {
                  setRefreshing(true);
                  await queryClient.removeQueries({ queryKey: ["feed"] });
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
              <View className="px-4">
                <FeedCard
                  {...feedItem}
                  pinned={false}
                  onExpand={() => {
                    setExpandedItem(feedItem);
                  }}
                  onTogglePin={() =>
                    togglePin(feedItem.item.id, feedItem.table, false)
                  }
                  onDelete={() =>
                    handleDelete(
                      feedItem.item.notification_id ?? null,
                      feedItem.item.id,
                      feedItem.table
                    )
                  }
                  onEdit={() => {
                    setEditingItem(feedItem);
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
            ListFooterComponent={
              isFetchingNextPage ? (
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
              ) : hasNextPage ? (
                <View className="h-20" />
              ) : (
                <AppText className="text-center justify-center mt-10 text-gray-300">
                  No more sessions
                </AppText>
              )
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
          {expandedItem.table === "reminders" && (
            <ReminderSession {...expandedItem.item} />
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
              onSave={() => {
                queryClient.invalidateQueries({ queryKey: ["feed"] });
                setEditingItem(null);
              }}
            />
          )}

          {editingItem.table === "reminders" && (
            <EditReminder
              reminder={editingItem.item}
              onClose={() => setEditingItem(null)}
              onSave={() => {
                queryClient.invalidateQueries({ queryKey: ["feed"] });
                setEditingItem(null);
              }}
            />
          )}

          {editingItem.table === "weight" && (
            <EditWeight
              weight={editingItem.item}
              onClose={() => setEditingItem(null)}
              onSave={() => {
                queryClient.invalidateQueries({ queryKey: ["feed"] });
                setEditingItem(null);
              }}
            />
          )}

          {editingItem.table === "gym_sessions" && (
            <View>
              {isLoadingGymSession ? (
                <View className="flex flex-col gap-5 items-center justify-center pt-40">
                  <AppText>Loading gym session details...</AppText>
                  <ActivityIndicator />
                </View>
              ) : GymSessionError ? (
                <AppText className="text-center text-lg mt-10">
                  Failed to load gym session details. Please try again later.
                </AppText>
              ) : (
                GymSessionFull && (
                  <EditGym
                    gym_session={GymSessionFull}
                    onClose={() => setEditingItem(null)}
                    onSave={() => {
                      queryClient.invalidateQueries({ queryKey: ["feed"] });
                      setEditingItem(null);
                    }}
                  />
                )
              )}
            </View>
          )}
        </FullScreenModal>
      )}
    </LinearGradient>
  );
}
