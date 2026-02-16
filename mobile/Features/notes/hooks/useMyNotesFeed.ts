import { useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { getNotes, FolderFilter } from "@/database/notes/get-notes";
import { useEffect, useMemo } from "react";
import { FeedData } from "@/types/session";

export default function useMyNotesFeed(folderFilter?: FolderFilter) {
  const queryClient = useQueryClient();

  const queryKey = useMemo(() => {
    if (!folderFilter || folderFilter.type === "all") return ["myNotes"];
    if (folderFilter.type === "unfiled") return ["myNotes", "unfiled"];
    return ["myNotes", folderFilter.folderId];
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
          pageParams: old.pageParams.slice(0, 1),
        };
      });
    };
  }, [queryClient, queryKey]);

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
