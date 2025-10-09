import { notes, weight, full_gym_session } from "@/types/models";
import React, { useState } from "react";
import { Session } from "@supabase/supabase-js";
import { GetFeed } from "@/api/feed/getFeed";
import Toast from "react-native-toast-message";
import AppText from "@/components/AppText";
import { useUserStore } from "@/lib/stores/useUserStore";
import { unpinItems } from "@/api/pinned/unpin-items";
import { pinItems } from "@/api/pinned/pin-items";
import { FlatList, RefreshControl, View } from "react-native";
import FeedCard from "@/components/cards/FeedCard";
import { DeleteSession } from "@/api/feed/deleteSession";
import { FeedSkeleton } from "@/components/skeletetons";
import { Pin } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useQuery, useQueryClient } from "@tanstack/react-query";

type FeedItem =
  | { table: "notes"; item: notes; pinned: boolean }
  | { table: "weight"; item: weight; pinned: boolean }
  | { table: "gym_sessions"; item: full_gym_session; pinned: boolean };

export default function SessionFeed() {
  const [expandedItem, setExpandedItem] = useState<FeedItem | null>(null);
  const [editingItem, setEditingItem] = useState<FeedItem | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [visibleCount, setVisibleCount] = useState(10);

  const queryClient = useQueryClient();

  const session = useUserStore((state) => state.session);

  const {
    error,
    data: feed = [],
    isLoading,
    refetch,
  } = useQuery<FeedItem[]>({
    queryKey: ["feed"],
    queryFn: () => GetFeed(session!),
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  });

  const togglePin = async (
    session: Session,
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
        ? await unpinItems(session, item_id, table)
        : await pinItems(session, item_id, table);

      if (!result.success) {
        console.error("Error toggling pin:", result.error);
        throw new Error(result.error);
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

  const handleDelete = async (
    session: Session,
    item_id: string,
    table: string
  ) => {
    const previousFeed = queryClient.getQueryData<FeedItem[]>(["feed"]);

    const newFeed = previousFeed?.filter((item) => {
      return !(item.item.id === item_id && item.table === table);
    });

    queryClient.setQueryData(["feed"], newFeed);

    try {
      const result = await DeleteSession(session, item_id, table);

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

  // Infinite scroll handler
  const loadMore = () => {
    if (visibleCount >= feed.length) return;
    setVisibleCount((prev) => prev + 10);
  };

  const sortedFeed = [...feed].sort((a, b) => {
    const aIsPinned = a.pinned;
    const bIsPinned = b.pinned;

    if (aIsPinned && !bIsPinned) return -1;
    if (!aIsPinned && bIsPinned) return 1;
    return (
      new Date(b.item.created_at).getTime() -
      new Date(a.item.created_at).getTime()
    );
  });

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  return (
    <LinearGradient
      className="flex-1"
      colors={["#020618", "#1d293d"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View className="flex-1 items-center px-5 z-0">
        {isLoading ? (
          <>
            <FeedSkeleton count={5} />
          </>
        ) : error ? (
          <AppText className="text-center text-lg mt-10">
            Failed to load sessions. Please try again later.
          </AppText>
        ) : feed.length === 0 ? (
          <View className="text-center text-lg mt-10">
            <AppText>No sessions yet. Let&apos;s get started!</AppText>
          </View>
        ) : (
          <FlatList
            data={sortedFeed.slice(0, visibleCount)}
            keyExtractor={(item) => item.item.id}
            initialNumToRender={10}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <View className="mt-3">
                {item.pinned && (
                  <View className="flex-row items-center gap-2 mb-2">
                    <Pin size={20} color="#9ca3af" />
                    <AppText className="text-sm text-gray-400">Pinned</AppText>
                  </View>
                )}
                <FeedCard
                  {...item}
                  pinned={item.pinned}
                  onExpand={() => setExpandedItem(item)}
                  onTogglePin={() => {
                    if (!session) return;
                    togglePin(session, item.item.id, item.table, item.pinned);
                  }}
                  onDelete={() => {
                    if (!session) return;
                    handleDelete(session, item.item.id, item.table);
                  }}
                  onEdit={() => setEditingItem(item)}
                />
              </View>
            )}
            onEndReached={loadMore}
            onEndReachedThreshold={0.3}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={() => (
              <View className="text-center text-lg mt-10">
                <AppText>No sessions yet. Let&apos;s get started!</AppText>
              </View>
            )}
          />
        )}
      </View>
    </LinearGradient>
  );
}
