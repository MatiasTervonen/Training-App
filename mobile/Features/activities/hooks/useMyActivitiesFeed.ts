import { useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { getActivitySessions } from "@/database/activities/myActivitySessions/get-sessions";
import { FeedData } from "@/types/session";
import { useEffect, useMemo } from "react";

export default function useMyActivitiesFeed() {
  const queryClient = useQueryClient();

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
    queryKey: ["myActivitySessions"],
    queryFn: ({ pageParam = 0 }) =>
      getActivitySessions({ pageParam, limit: 10 }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextPage,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  // Keep only first page in cache when user leaves feed

  useEffect(() => {
    return () => {
      queryClient.setQueryData<FeedData>(["myActivitySessions"], (old) => {
        if (!old) return old;

        return {
          ...old,
          pages: old.pages.slice(0, 1),
          pageParams: old.pageParams.slice(0, 1),
        };
      });
    };
  }, [queryClient]);

  const pinnedFeed = useMemo(() => {
    return (
      data?.pages.flatMap((page) =>
        page.feed.filter((item) => item.feed_context === "pinned"),
      ) ?? []
    );
  }, [data]);

  const unpinnedFeed = useMemo(() => {
    return (
      data?.pages.flatMap((page) =>
        page.feed.filter((item) => item.feed_context === "feed"),
      ) ?? []
    );
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
  };
}
