"use client";

import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import getFeed from "@/app/(app)/database/feed/get-feed";
import { FeedData } from "@/app/(app)/types/session";
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
          pageParams: old.pageParams?.slice(0, 1) ?? [],
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

  const pinnedFeed = useMemo(() => {
    return (
      data?.pages.flatMap((page) =>
        page.feed.filter((item) => item.feed_context === "pinned")
      ) ?? []
    );
  }, [data]);

  const unpinnedFeed = useMemo(() => {
    return (
      data?.pages.flatMap((page) =>
        page.feed.filter((item) => item.feed_context === "feed")
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
    pinnedFeed,
    unpinnedFeed,
    containerRef,
    pullDistance,
    refreshing,
    loadMoreRef,
  };
}
