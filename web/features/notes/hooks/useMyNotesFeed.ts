"use client";

import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { getNotes, FolderFilter, getPinnedContext } from "@/database/notes/get-notes";
import { FeedData } from "@/types/session";
import { useEffect, useMemo, useRef } from "react";
import usePullToRefresh from "@/lib/usePullToRefresh";

export default function useMyNotesFeed(folderFilter?: FolderFilter) {
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const queryClient = useQueryClient();

  const queryKey = useMemo(() => {
    if (!folderFilter || folderFilter.type === "all") return ["myNotes"];
    return ["myNotes", folderFilter.folderId];
  }, [folderFilter]);

  const pinnedContext = useMemo(() => {
    return getPinnedContext(folderFilter);
  }, [folderFilter]);

  const {
    data,
    error,
    isLoading,
    refetch: mutateFeed,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam = 0 }) =>
      getNotes({ pageParam, limit: 10, folderFilter }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextPage,
  });

  // Keep only first page in cache when user leaves feed
  useEffect(() => {
    return () => {
      queryClient.setQueryData<FeedData>(queryKey, (old) => {
        if (!old) return old;

        return {
          ...old,
          pages: old.pages.slice(0, 1),
          pageParams: old.pageParams?.slice(0, 1) ?? [],
        };
      });
    };
  }, [queryClient, queryKey]);

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
    queryKey,
    pinnedContext,
  };
}
