import { useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import getNotes from "@/database/notes/get-notes";
import { useEffect, useMemo } from "react";
import { notes } from "@/types/models";

type FeedData = {
  pageParams: number[];
  pages: {
    feed: notes[];
    nextPage?: number | null;
  }[];
};

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
    isSuccess,
  } = useInfiniteQuery({
    queryKey: ["myNotes"],
    queryFn: ({ pageParam = 0 }) => getNotes({ pageParam, limit: 10 }),
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

  const pinnedNotes = useMemo(() => {
    return (
      data?.pages.flatMap((page) =>
        page.feed.filter((item) => item.pinned)
      ) ?? []
    );
  }, [data]);

  const unpinnedNotes = useMemo(() => {
    return (
      data?.pages.flatMap((page) =>
        page.feed.filter((item) => !item.pinned)
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
    pinnedNotes,
    unpinnedNotes,
  };
}
