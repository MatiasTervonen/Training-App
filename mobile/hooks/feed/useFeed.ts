import { useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import getFeed from "@/database/feed/getFeed";
import { FeedData } from "@/types/session";
import { useEffect, useMemo } from "react";
import { FeedItem } from "@/types/models";

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
  const comingSoonFeed = useMemo(
    () =>
      feed.filter((i) => !i.pinned && (i.item as any).feed_context === "soon"),
    [feed]
  );
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

  return {
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
  };
}
