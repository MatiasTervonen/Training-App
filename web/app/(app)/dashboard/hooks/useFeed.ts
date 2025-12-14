"use client";

import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import getFeed from "@/app/(app)/database/feed";
import { FeedData } from "@/app/(app)/types/session";
import { FeedItem } from "@/app/(app)/types/models";
import { useEffect, useMemo, useRef } from "react";
import usePullToRefresh from "@/app/(app)/lib/usePullToRefresh";

export default function useFeed() {
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

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
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
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

  // Load more when the bottom of the feed is in view

  useEffect(() => {
    if (!loadMoreRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      {
        rootMargin: "300px",
      }
    );

    observer.observe(loadMoreRef.current);

    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const { containerRef, pullDistance, refreshing } = usePullToRefresh({
    onRefresh: async () => {
      await mutateFeed();
    },
  });

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

  return {
    data,
    error,
    isLoading,
    mutateFeed,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    pinnedFeed,
    unpinnedFeed,
    feed,
    containerRef,
    pullDistance,
    refreshing,
    loadMoreRef,
  };
}
