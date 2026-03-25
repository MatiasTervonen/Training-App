import { useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { getActivitySessions, getActivityPinnedContext } from "@/database/activities/myActivitySessions/get-sessions";
import { FeedData } from "@/types/session";
import { useEffect, useMemo } from "react";

export default function useMyActivitiesFeed(activitySlug?: string) {
  const queryClient = useQueryClient();

  const queryKey = activitySlug
    ? ["myActivitySessions", activitySlug]
    : ["myActivitySessions"];

  const pinnedContext = getActivityPinnedContext(activitySlug);

  const {
    data,
    error,
    isLoading,
    refetch: mutateFeed,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isSuccess,
  } = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam = 0 }) =>
      getActivitySessions({ pageParam, limit: 10, activitySlug }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextPage,
  });

  // Keep only first page in cache when user leaves feed

  useEffect(() => {
    const qk = activitySlug
      ? ["myActivitySessions", activitySlug]
      : ["myActivitySessions"];
    return () => {
      queryClient.setQueryData<FeedData>(qk, (old) => {
        if (!old) return old;

        return {
          ...old,
          pages: old.pages.slice(0, 1),
          pageParams: old.pageParams.slice(0, 1),
        };
      });
    };
  }, [queryClient, activitySlug]);

  const { pinnedFeed, unpinnedFeed } = useMemo(() => {
    const pinned: NonNullable<typeof data>["pages"][0]["feed"] = [];
    const unpinned: typeof pinned = [];
    data?.pages.forEach((page) => {
      for (const item of page.feed) {
        if (item.feed_context === "pinned") pinned.push(item);
        else unpinned.push(item);
      }
    });
    return { pinnedFeed: pinned, unpinnedFeed: unpinned };
  }, [data]);

  return {
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
    queryKey,
    pinnedContext,
  };
}
