import { full_gym_session } from "@/types/models";
import { useState, useMemo, useEffect } from "react";
import Toast from "react-native-toast-message";
import AppText from "@/components/AppText";
import { unpinItems } from "@/api/pinned/unpin-items";
import { pinItems } from "@/api/pinned/pin-items";
import {
  FlatList,
  RefreshControl,
  View,
  ActivityIndicator,
} from "react-native";
import FeedCard from "@/components/cards/FeedCard";
import { DeleteSession } from "@/api/feed/deleteSession";
import { FeedSkeleton } from "@/components/skeletetons";
import { Pin } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { handleError } from "@/utils/handleError";
import { useFeed } from "@/api/feed/getFeed";
import { Feed_item, FeedData, full_reminder } from "@/types/session";
import { confirmAction } from "@/lib/confirmAction";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import FullScreenModal from "./FullScreenModal";
import GymSession from "./expandSession/gym";
import { getFullGymSession } from "@/api/gym/get-full-gym-session";
import NotesSession from "./expandSession/notes";
import WeightSession from "./expandSession/weight";
import EditGym from "./editSession/editGym";
import EditNotes from "./editSession/editNotes";
import EditWeight from "./editSession/editWeight";
import PageContainer from "@/components/PageContainer";
import ReminderSession from "./expandSession/reminder";
import EditReminder from "./editSession/editReminder";
import * as Notifications from "expo-notifications";
import { supabase } from "@/lib/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import CustomReminder from "./expandSession/customReminder";
import GetFullCustomReminder from "@/api/reminders/get-full-custom-reminder";

type FeedItem = {
  table:
    | "notes"
    | "weight"
    | "gym_sessions"
    | "todo_lists"
    | "reminders"
    | "custom_reminders";
  item: Feed_item;
  pinned: boolean;
};

export default function SessionFeed() {
  const [expandedItem, setExpandedItem] = useState<FeedItem | null>(null);
  const [editingItem, setEditingItem] = useState<FeedItem | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const queryClient = useQueryClient();

  // useEffect(() => {
  //   const fetchNotifications = async () => {
  //     const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  //     // console.log("Scheduled notifications:", scheduled);
  //   };

  //   fetchNotifications();
  // }, []);

  function getCanonicalId(item: { id?: string; item_id?: string }) {
    return item.item_id ?? item.id ?? "";
  }

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
            item: { ...feedItem, id: getCanonicalId(feedItem) },
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

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const {
    error,
    data,
    isLoading,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isRefetching,
  } = useFeed();

  const feed: FeedItem[] = useMemo(() => {
    if (!data) return [];
    return data.pages.flatMap((page) =>
      page.feed.map((item: Feed_item) => ({
        table: item.type as FeedItem["table"],
        item: { ...item, id: getCanonicalId(item) },
        pinned: item.pinned,
      }))
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
    item_id: string,
    table: string,
    isPinned: boolean
  ) => {
    const queryKey = ["feed"];

    await queryClient.cancelQueries({ queryKey });

    const previousFeed = queryClient.getQueryData(queryKey);

    queryClient.setQueryData<FeedData>(queryKey, (oldData) => {
      if (!oldData) return oldData;

      const newPages = oldData.pages.map((page) => {
        const newFeed = page.feed.map((feedItem) => {
          if (getCanonicalId(feedItem) === item_id) {
            return { ...feedItem, pinned: !isPinned };
          }
          return feedItem;
        });
        return { ...page, feed: newFeed };
      });

      return { ...oldData, pages: newPages };
    });

    try {
      const result = isPinned
        ? await unpinItems(item_id, table)
        : await pinItems(item_id, table);

      if (!result.success) {
        handleError(result.error, {
          message: "Error toggling pin",
          route: "/api/feed/togglePin",
          method: "POST",
        });
        throw new Error("Failed to toggle pin status.");
      }

      Toast.show({
        type: "success",
        text1: isPinned ? "Unpinned" : "Pinned",
        text2: `Item has been ${
          isPinned ? "unpinned" : "pinned"
        } successfully.`,
      });
    } catch (error) {
      queryClient.setQueryData(queryKey, previousFeed);
      handleError(error, {
        message: "Unexpected Error toggling pin",
        route: "/api/feed/togglePin",
        method: "POST",
      });
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to toggle pin status.",
      });
    }
  };

  const handleDelete = async (
    notification_id: string[] | string | null,
    item_id: string,
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
        const newFeed = page.feed.filter(
          (feedItem) => getCanonicalId(feedItem) !== item_id
        );
        return { ...page, feed: newFeed };
      });
      return { ...oldData, pages: newPages };
    });

    try {
      const result = await DeleteSession(item_id, table);

      if (!result.success) {
        throw new Error();
      }

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
    } catch (error) {
      queryClient.setQueryData(queryKey, previousFeed);
      handleError(error, {
        message: "Unexpected Error deleting item",
        route: "/api/feed/deleteSession",
        method: "DELETE",
      });
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

  const allFeed = [...pinnedFeed, ...unpinnedFeed];

  return (
    <LinearGradient
      className="flex-1"
      colors={["#020618", "#1d293d"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <PageContainer className="max-w-3xl z-0">
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
          <FlatList
            data={allFeed}
            keyExtractor={(item) => item.item.id}
            contentContainerStyle={{ paddingBottom: 100, paddingTop: 10 }}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={(!isLoading && isRefetching) || refreshing}
                onRefresh={async () => {
                  setRefreshing(true);
                  await queryClient.removeQueries({ queryKey: ["feed"] });
                  await refetch();
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
              <View>
                <FeedCard
                  {...feedItem}
                  onExpand={() => {
                    setExpandedItem(feedItem);
                  }}
                  onTogglePin={() =>
                    togglePin(
                      getCanonicalId(feedItem.item),
                      feedItem.table,
                      feedItem.pinned
                    )
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
                <View className="flex-row items-center mb-2">
                  <Pin size={20} color="gray" />
                  <AppText className="text-gray-500 ml-2">Pinned</AppText>
                </View>
              ) : (
                <View className="mb-4" />
              )
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
                  CustomReminderFull && (
                    <CustomReminder {...CustomReminderFull} />
                  )
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
      </PageContainer>
    </LinearGradient>
  );
}
