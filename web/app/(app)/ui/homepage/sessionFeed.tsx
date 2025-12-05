"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import NotesSession from "@/app/(app)/components/expandSession/notes";
import Modal from "@/app/(app)/components/modal";
import FeedCard from "@/app/(app)/components/FeedCard";
import { Pin } from "lucide-react";
import EditNote from "@/app/(app)/ui/editSession/EditNotes";
import GymSession from "@/app/(app)/components/expandSession/gym";
import Spinner from "@/app/(app)/components/spinner";
import usePullToRefresh from "@/app/(app)/lib/usePullToRefresh";
import WeightSession from "@/app/(app)/components/expandSession/weight";
import EditWeight from "@/app/(app)/ui/editSession/EditWeight";
import toast from "react-hot-toast";
import { FeedSkeleton } from "../loadingSkeletons/skeletons";
import { full_gym_session, full_todo_session } from "@/app/(app)/types/models";
import TodoSession from "@/app/(app)/components/expandSession/todo";
import EditTodo from "@/app/(app)/ui/editSession/EditTodo";
import ReminderSession from "../../components/expandSession/reminder";
import EditReminder from "@/app/(app)/ui/editSession/EditReminder";
import { handleError } from "../../utils/handleError";
import { useRouter } from "next/navigation";
import { deleteSession } from "../../database/feed";
import { pinItem, unpinItem } from "../../database/pinned";
import { FeedCardProps } from "@/app/(app)/types/models";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { useModalPageConfig } from "@/app/(app)/lib/stores/modalPageConfig";
import ActiveSessionPopup from "@/app/(app)/components/activeSessionPopup";
import { getFullGymSession } from "../../database/gym";
import {
  useQuery,
  useInfiniteQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { getFullTodoSession } from "../../database/todo";
import getFeed from "../../database/feed";
import { Feed_item } from "../../types/session";

type FeedItem = FeedCardProps;

type FeedData = {
  pageParams: number[];
  pages: {
    feed: Feed_item[];
    nextPage: number;
  }[];
};

export default function SessionFeed() {
  const [expandedItem, setExpandedItem] = useState<FeedItem | null>(null);
  const [editingItem, setEditingItem] = useState<FeedItem | null>(null);

  const router = useRouter();

  const queryClient = useQueryClient();

  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const setBlockSwipe = useModalPageConfig((s) => s.setBlockSwipe);

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

  const togglePin = async (
    id: string,
    table: "notes" | "gym_sessions" | "weight" | "todo_lists" | "reminders",
    isPinned: boolean
  ) => {
    if (!isPinned && pinnedFeed.length >= 10) {
      toast.error("You can only pin 10 items. Unpin something first.");
      return;
    }
    const queryKey = ["feed"];

    await queryClient.cancelQueries({ queryKey });

    const previousFeed = queryClient.getQueryData(queryKey);

    queryClient.setQueryData<FeedData>(["feed"], (oldData) => {
      if (!oldData) return oldData;

      return {
        ...oldData,
        pages: oldData.pages.map((page) => ({
          ...page,
          feed: page.feed.map((feedItem) =>
            feedItem.id === id ? { ...feedItem, pinned: !isPinned } : feedItem
          ),
        })),
      };
    });

    try {
      if (isPinned) {
        await unpinItem({ id, table });
      } else {
        await pinItem({ id, table });
      }

      toast.success(
        `Item has been ${isPinned ? "unpinned" : "pinned"} successfully.`
      );
    } catch (error) {
      queryClient.setQueryData(queryKey, previousFeed);
      handleError(error, {
        message: "Failed to toggle pin",
        route: "server-action: pinSession/sessionFeed",
        method: "direct",
      });
      toast.error("Failed to toggle pin");
    }
  };

  const handleDelete = async (
    id: string,
    table: "notes" | "gym_sessions" | "weight" | "todo_lists" | "reminders"
  ) => {
    const confirmDetlete = confirm(
      "Are you sure you want to delete this session?"
    );
    if (!confirmDetlete) return;

    const queryKey = ["feed"];

    await queryClient.cancelQueries({ queryKey });

    const perviousFeed = queryClient.getQueryData(queryKey);

    queryClient.setQueryData<FeedData>(queryKey, (oldData) => {
      if (!oldData) return oldData;

      const newPages = oldData.pages.map((page) => {
        const newFeed = page.feed.filter((feedItem) => feedItem.id !== id);
        return { ...page, feed: newFeed };
      });
      return { ...oldData, pages: newPages };
    });

    try {
      await deleteSession({ id, table });

      if (table === "weight") {
        queryClient.refetchQueries({
          queryKey: ["get-weight"],
          exact: true,
        });
      }

      if (table === "reminders") {
        queryClient.refetchQueries({
          queryKey: ["get-reminders"],
          exact: true,
        });
      }

      toast.success("Item has been deleted successfully.");
      queryClient.invalidateQueries({ queryKey });
    } catch {
      queryClient.setQueryData(queryKey, perviousFeed);
      toast.error("Failed to delete session");
    }
  };

  const getId = (fi: FeedItem | null) => fi?.item.id ?? null;

  const expandedId = getId(expandedItem);
  const editingId = getId(editingItem);

  const gymId =
    expandedItem?.table === "gym_sessions"
      ? expandedId
      : editingItem?.table === "gym_sessions"
      ? editingId
      : null;

  const todoId =
    expandedItem?.table === "todo_lists"
      ? expandedId
      : editingItem?.table === "todo_lists"
      ? editingId
      : null;

  const {
    data: GymSessionFull,
    error: GymSessionError,
    isLoading: isLoadingGymSession,
  } = useQuery<full_gym_session>({
    queryKey: ["fullGymSession", gymId],
    queryFn: async () => await getFullGymSession(gymId!),
    enabled: !!gymId,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const {
    data: TodoSessionFull,
    error: TodoSessionError,
    isLoading: isLoadingTodoSession,
    refetch: refetchFullTodo,
  } = useQuery<full_todo_session>({
    queryKey: ["fullTodoSession", todoId],
    queryFn: async () => await getFullTodoSession(todoId!),
    enabled: !!todoId,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  // runs when feed finishes loading. Prefetch full sessions

  const hashPrefetched = useRef(false);

  useEffect(() => {
    if (!data || hashPrefetched.current) return;
    if (data.pages.length === 0) return;

    hashPrefetched.current = true;

    const firstPageFeed = data.pages[0].feed;

    firstPageFeed.forEach((f) => {
      if (f.type === "todo_lists") {
        queryClient.prefetchQuery({
          queryKey: ["fullTodoSession", f.id],
          queryFn: () => getFullTodoSession(f.id!),
        });
      }
    });

    firstPageFeed.forEach((f) => {
      if (f.type === "gym_sessions") {
        queryClient.prefetchQuery({
          queryKey: ["fullGymSession", f.id],
          queryFn: () => getFullGymSession(f.id!),
        });
      }
    });
  }, [data, queryClient]);

  // Pinned carousell

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [Autoplay()]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!emblaApi) return;

    const onSelect = () => {
      setActiveIndex(emblaApi!.selectedScrollSnap);
    };

    const onPointerDown = () => setBlockSwipe(true);
    const onPointerUp = () => setBlockSwipe(false);

    emblaApi.on("select", onSelect);
    emblaApi.on("pointerDown", onPointerDown);
    emblaApi.on("pointerUp", onPointerUp);

    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("pointerDown", onPointerDown);
      emblaApi.off("pointerUp", onPointerUp);
    };
  }, [emblaApi, setBlockSwipe]);

  useEffect(() => {
    if (activeIndex >= pinnedFeed.length) {
      setActiveIndex(0);
    }
  }, [pinnedFeed, activeIndex]);

  return (
    <div className="h-full">
      <ActiveSessionPopup />
      <div
        ref={containerRef}
        className="max-w-3xl mx-auto relative bg-linear-to-b from-slate-950 via-slate-900 to-slate-800 px-5 pt-3 pb-10 overflow-y-auto touch-pan-y h-full"
      >
        <div
          className="flex items-center justify-center transition-all"
          style={{ height: pullDistance }}
        >
          {refreshing ? (
            <div className="flex text-xl items-center gap-4">
              <p>Refreshing...</p>
              <Spinner />
            </div>
          ) : pullDistance > 0 ? (
            <div className="flex text-xl items-center gap-2">
              <p className="text-gray-100/70">Pull to refresh...</p>
            </div>
          ) : null}
        </div>
        {isLoading && !data ? (
          <>
            <FeedSkeleton count={6} />
          </>
        ) : error ? (
          <p className="text-center text-lg mt-10">
            Failed to load sessions. Please try again later.
          </p>
        ) : !data || feed.length === 0 ? (
          <p className="text-center text-lg mt-20">
            No sessions yet. Let&apos;s get started!
          </p>
        ) : (
          <>
            {pinnedFeed.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Pin size={20} />
                  <p className="text-gray-400">Pinned</p>
                  <p className="text-gray-400">
                    {activeIndex + 1} / {pinnedFeed.length}
                  </p>
                </div>

                <div className="embla" ref={emblaRef}>
                  <div className="embla__container flex">
                    {pinnedFeed.map((feedItem) => (
                      <div
                        className="flex-none w-full min-w-0 mr-5 select-none"
                        key={feedItem.item.id}
                      >
                        <FeedCard
                          {...feedItem}
                          pinned={true}
                          onExpand={() => {
                            setExpandedItem(feedItem);
                          }}
                          onTogglePin={() =>
                            togglePin(feedItem.item.id, feedItem.table, true)
                          }
                          onDelete={() =>
                            handleDelete(feedItem.item.id!, feedItem.table)
                          }
                          onEdit={() => {
                            if (feedItem.table === "gym_sessions") {
                              router.push(
                                `/training/gym/${feedItem.item.id}/edit`
                              );
                            } else {
                              setEditingItem(feedItem);
                            }
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {unpinnedFeed.map((feedItem) => {
              return (
                <div className="mt-8" key={feedItem.item.id}>
                  <FeedCard
                    {...feedItem}
                    pinned={false}
                    onExpand={() => {
                      setExpandedItem(feedItem);
                    }}
                    onTogglePin={() =>
                      togglePin(feedItem.item.id, feedItem.table, false)
                    }
                    onDelete={() =>
                      handleDelete(feedItem.item.id!, feedItem.table)
                    }
                    onEdit={() => {
                      if (feedItem.table === "gym_sessions") {
                        router.push(`/training/gym/${feedItem.item.id}/edit`);
                      } else {
                        setEditingItem(feedItem);
                      }
                    }}
                  />
                </div>
              );
            })}
            {isFetchingNextPage && (
              <div className="flex flex-col gap-2 items-center mt-10">
                <p>Loading more...</p>
                <Spinner />
              </div>
            )}

            {hasNextPage && <div ref={loadMoreRef} className="h-20"></div>}

            {!hasNextPage && data?.pages.length > 1 && (
              <p className="text-center justify-center mt-10 text-gray-300">
                No more sessions
              </p>
            )}
          </>
        )}

        {expandedItem && (
          <Modal onClose={() => setExpandedItem(null)} isOpen={true}>
            {expandedItem.table === "notes" && (
              <NotesSession {...expandedItem.item} />
            )}
            {expandedItem.table === "reminders" && (
              <ReminderSession {...expandedItem.item} />
            )}
            {expandedItem.table === "gym_sessions" && (
              <>
                {isLoadingGymSession ? (
                  <div className="flex flex-col gap-5 items-center justify-center pt-40">
                    <p>Loading gym session details...</p>
                    <Spinner />
                  </div>
                ) : GymSessionError ? (
                  <p className="text-center text-lg mt-10">
                    Failed to load gym session details. Please try again later.
                  </p>
                ) : (
                  GymSessionFull && <GymSession {...GymSessionFull} />
                )}
              </>
            )}
            {expandedItem.table === "weight" && (
              <WeightSession {...expandedItem.item} />
            )}
            {expandedItem.table === "todo_lists" && (
              <>
                {isLoadingTodoSession ? (
                  <div className="flex flex-col gap-5 items-center justify-center pt-40">
                    <p>Loading todo session details...</p>
                    <Spinner />
                  </div>
                ) : TodoSessionError ? (
                  <p className="text-center text-lg mt-20">
                    Failed to load todo session details. Please try again later.
                  </p>
                ) : (
                  TodoSessionFull && (
                    <TodoSession
                      initialTodo={TodoSessionFull}
                      mutateFullTodoSession={async () => {
                        await refetchFullTodo();
                      }}
                    />
                  )
                )}
              </>
            )}
          </Modal>
        )}

        {editingItem && (
          <Modal
            isOpen={true}
            onClose={() => {
              setEditingItem(null);
            }}
          >
            {editingItem.table === "notes" && (
              <EditNote
                note={editingItem.item}
                onClose={() => setEditingItem(null)}
                onSave={async () => {
                  await mutateFeed();

                  setEditingItem(null);
                }}
              />
            )}
            {editingItem.table === "reminders" && (
              <EditReminder
                reminder={editingItem.item}
                onClose={() => setEditingItem(null)}
                onSave={async () => {
                  await mutateFeed();

                  setEditingItem(null);
                }}
              />
            )}
            {editingItem.table === "todo_lists" && (
              <>
                {isLoadingTodoSession ? (
                  <div className="flex flex-col gap-5 items-center justify-center pt-40">
                    <p>Loading todo session details...</p>
                    <Spinner />
                  </div>
                ) : TodoSessionError ? (
                  <p className="text-center text-lg mt-10">
                    Failed to load todo session details. Please try again later.
                  </p>
                ) : (
                  TodoSessionFull && (
                    <EditTodo
                      todo_session={TodoSessionFull}
                      onClose={() => setEditingItem(null)}
                      onSave={async () => {
                        await Promise.all([mutateFeed(), refetchFullTodo()]);

                        setEditingItem(null);
                      }}
                    />
                  )
                )}
              </>
            )}
            {editingItem.table === "weight" && (
              <EditWeight
                weight={editingItem.item}
                onClose={() => setEditingItem(null)}
                onSave={async () => {
                  await mutateFeed();
                  setEditingItem(null);
                }}
              />
            )}
          </Modal>
        )}
      </div>
    </div>
  );
}
