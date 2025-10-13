import { notes, weight, full_gym_session } from "@/types/models";
import React, { useCallback, useState, useMemo } from "react";
import Toast from "react-native-toast-message";
import AppText from "@/components/AppText";
import { unpinItems } from "@/api/pinned/unpin-items";
import { pinItems } from "@/api/pinned/pin-items";
import { FlatList, RefreshControl, View } from "react-native";
import FeedCard from "@/components/cards/FeedCard";
import { DeleteSession } from "@/api/feed/deleteSession";
import { FeedSkeleton } from "@/components/skeletetons";
import { Pin } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useQueryClient } from "@tanstack/react-query";
import { handleError } from "@/utils/handleError";
import { useFeed } from "@/api/feed/getFeed";
import { Feed_item } from "@/types/session";

type FeedItem = {
  table: "notes" | "weight" | "gym_sessions" | "todo_lists" | "reminders";
  item: Feed_item;
  pinned: boolean;
};

export default function SessionFeed() {
  const [expandedItem, setExpandedItem] = useState<FeedItem | null>(null);
  const [editingItem, setEditingItem] = useState<FeedItem | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [visibleCount, setVisibleCount] = useState(10);

  const queryClient = useQueryClient();

  function getCanonicalId(item: { id?: string; item_id?: string }) {
    return item.item_id ?? item.id ?? "";
  }

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

  console.log("Feed data:", data);

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

  console.log("Flattened feed:", feed);

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
    const previousFeed = queryClient.getQueryData<FeedItem[]>(["feed"]);

    const newFeed = previousFeed?.map((item) => {
      if (item.item.id === item_id && item.table === table) {
        return { ...item, pinned: !isPinned };
      }
      return item;
    });

    queryClient.setQueryData(["feed"], newFeed);

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
      console.error("Error toggling pin:", error);

      // Rollback to previous data on error
      queryClient.setQueryData(["feed"], previousFeed);

      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to toggle pin status.",
      });
    }
  };

  const handleDelete = async (item_id: string, table: string) => {
    const previousFeed = queryClient.getQueryData<FeedItem[]>(["feed"]);

    const newFeed = previousFeed?.filter((item) => {
      return !(item.item.id === item_id && item.table === table);
    });

    queryClient.setQueryData(["feed"], newFeed);

    try {
      const result = await DeleteSession(item_id, table);

      if (!result.success) {
        throw new Error();
      }

      Toast.show({
        type: "success",
        text1: "Deleted",
        text2: "Item has been deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting item:", error);

      // Rollback to previous data on error
      queryClient.setQueryData(["feed"], previousFeed);

      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to delete item.",
      });
    }
  };

  return (
    <LinearGradient
      className="flex-1"
      colors={["#020618", "#1d293d"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View className="px-5 z-0">
        {isLoading ? (
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
            {pinnedFeed.length > 0 && (
              <View>
                <View>
                  <Pin size={20} />
                  <AppText className="text-gray-400">Pinned</AppText>
                </View>
                {pinnedFeed.map((feedItem) => (
                  <View key={feedItem.item.id} className="mb-3">
                    <FeedCard
                      {...feedItem}
                      pinned={true}
                      onExpand={() => {
                        setExpandedItem(feedItem);
                      }}
                      onTogglePin={() =>
                        togglePin(
                          getCanonicalId(feedItem.item),
                          feedItem.table,
                          true
                        )
                      }
                      onDelete={() =>
                        handleDelete(feedItem.item.id!, feedItem.table)
                      }
                      onEdit={() => {
                        setEditingItem(feedItem);
                      }}
                    />
                  </View>
                ))}
              </View>
            )}

            {unpinnedFeed.map((feedItem) => {
              return (
                <View className="mt-[32px]" key={feedItem.item.id}>
                  <FeedCard
                    {...feedItem}
                    onExpand={() => {
                      setExpandedItem(feedItem);
                    }}
                    onTogglePin={() =>
                      togglePin(
                        getCanonicalId(feedItem.item),
                        feedItem.table,
                        false
                      )
                    }
                    onDelete={() =>
                      handleDelete(feedItem.item.id!, feedItem.table)
                    }
                    onEdit={() => {
                      setEditingItem(feedItem);
                    }}
                  />
                </View>
              );
            })}
          </>
        )}
      </View>
    </LinearGradient>
  );
}
