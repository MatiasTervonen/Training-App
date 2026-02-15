import { useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { getNotes } from "@/database/notes/get-notes";
import { useEffect, useMemo } from "react";
import { FeedData } from "@/types/session";

export default function useMyNotesFeed() {
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
    queryKey: ["myNotes"],
    queryFn: ({ pageParam = 0 }) => getNotes({ pageParam, limit: 10 }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextPage,
  });

  // Keep only first page in cache when user leaves feed
  useEffect(() => {
    return () => {
      queryClient.setQueryData<FeedData>(["myNotes"], (old) => {
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
    pinnedFeed,
    unpinnedFeed,
  };
}
