import { useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import getFeed from "@/database/feed/getFeed";
import { FeedData } from "@/types/session";
import { useEffect, useMemo } from "react";

export default function useFeed() {
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
    queryKey: ["feed"],
    queryFn: ({ pageParam = 0 }) => getFeed({ pageParam, limit: 10 }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextPage,
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
  };
}
