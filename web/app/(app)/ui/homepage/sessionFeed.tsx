"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import NotesSession from "@/app/(app)/components/expandSession/notes";
import Modal from "@/app/(app)/components/modal";
import { useInView } from "react-intersection-observer";
import FeedCard from "@/app/(app)/components/FeedCard";
import { Pin } from "lucide-react";
import EditNote from "@/app/(app)/ui/editSession/EditNotes";
import GymSession from "@/app/(app)/components/expandSession/gym";
import useSWR from "swr";
import Spinner from "@/app/(app)/components/spinner";
import usePullToRefresh from "@/app/(app)/lib/usePullToRefresh";
import WeightSession from "@/app/(app)/components/expandSession/weight";
import EditWeight from "@/app/(app)/ui/editSession/EditWeight";
import toast from "react-hot-toast";
import { FeedSkeleton } from "../loadingSkeletons/skeletons";
import { full_gym_session, full_todo_session } from "@/app/(app)/types/models";
import { fetcher } from "@/app/(app)/lib/fetcher";
import { Feed_item } from "@/app/(app)/types/session";
import useSWRInfinite from "swr/infinite";
import { getFeedKey } from "@/app/(app)/lib/feedKeys";
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

type FeedItem = FeedCardProps;

type FeedResponse = {
  feed: Feed_item[];
  nextPage: number | null;
};

export default function SessionFeed() {
  const [expandedItem, setExpandedItem] = useState<FeedItem | null>(null);
  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: "200px",
  });
  const [editingItem, setEditingItem] = useState<FeedItem | null>(null);

  const router = useRouter();

  const loadingMoreRef = useRef(false);

  const hasTriggeredWhileVisibleRef = useRef(false);

  const setBlockSwipe = useModalPageConfig((s) => s.setBlockSwipe);

  const {
    data,
    error,
    isLoading,
    mutate: mutateFeed,
    setSize,
    isValidating,
  } = useSWRInfinite<FeedResponse>(getFeedKey, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    revalidateFirstPage: false, // Prevent revalidating page 1 unnecessarily
  });

  const hasNextPage = useMemo(() => {
    if (!data || data.length === 0) return false;
    return Boolean(data[data.length - 1]?.nextPage);
  }, [data]);

  function getCanonicalId(item: { id?: string; item_id?: string }) {
    return item.item_id ?? item.id ?? "";
  }

  // Load more when the bottom of the feed is in view
  useEffect(() => {
    if (!inView) {
      hasTriggeredWhileVisibleRef.current = false;
      return;
    }
    if (hasTriggeredWhileVisibleRef.current) return;
    if (!hasNextPage) return;
    if (loadingMoreRef.current) return;

    hasTriggeredWhileVisibleRef.current = true;
    loadingMoreRef.current = true;

    setSize((prev) => prev + 1).finally(() => {
      loadingMoreRef.current = false;
    });
  }, [inView, hasNextPage, setSize]);

  const { containerRef, pullDistance, refreshing } = usePullToRefresh({
    onRefresh: async () => {
      await mutateFeed();
    },
  });

  // Flattens the data in single array of FeedItem[]

  const feed: FeedItem[] = useMemo(() => {
    if (!data) return [];
    return data.flatMap((page) =>
      page.feed.map((item) => {
        return {
          table: item.type as FeedItem["table"],
          item: { ...item, id: getCanonicalId(item) },
          pinned: item.pinned,
        } as unknown as FeedItem;
      })
    );
  }, [data]);

  // Pinned items first, then by created_at desc for stable ordering in UI

  const pinnedFeed = useMemo(() => feed.filter((i) => i.pinned), [feed]);
  const unpinnedFeed = useMemo(
    () =>
      feed
        .filter((i) => !i.pinned)
        .sort(
          (a, b) =>
            new Date(b.item.created_at).getTime() -
            new Date(a.item.created_at).getTime()
        ),
    [feed]
  );

  const togglePin = async (
    item_id: string,
    table: "notes" | "gym_sessions" | "weight" | "todo_lists" | "reminders",
    isPinned: boolean
  ) => {
    if (!isPinned && pinnedFeed.length >= 10) {
      toast.error("You can only pin 10 items. Unpin something first.");
      return;
    }

    const snapshot = data
      ? data.map((page) => ({
          ...page,
          feed: page.feed.map((item) => ({ ...item })),
        }))
      : undefined;

    await mutateFeed(
      (currentPages) => {
        if (!currentPages) return currentPages;

        return currentPages.map((page) => ({
          ...page,
          feed: page.feed.map((item) => {
            const matches = item.id === item_id || item.item_id === item_id;
            if (!matches) return item;

            return matches ? { ...item, pinned: !isPinned } : item;
          }),
        }));
      },
      { revalidate: false }
    );

    try {
      if (isPinned) {
        await unpinItem({ item_id, table });
      } else {
        await pinItem({ item_id, table });
      }

      toast.success(
        `Item has been ${isPinned ? "unpinned" : "pinned"} successfully.`
      );
    } catch (error) {
      handleError(error, {
        message: "Failed to toggle pin",
        route: "server-action: pinSession/sessionFeed",
        method: "direct",
      });
      toast.error("Failed to toggle pin");
      mutateFeed(snapshot, { revalidate: false });
    }
  };

  const handleDelete = async (
    item_id: string,
    table: "notes" | "gym_sessions" | "weight" | "todo_lists" | "reminders"
  ) => {
    const confirmDetlete = confirm(
      "Are you sure you want to delete this session?"
    );
    if (!confirmDetlete) return;

    const snapshot = data
      ? data.map((page) => ({
          ...page,
          feed: page.feed.map((item) => ({ ...item })),
        }))
      : undefined;

    await mutateFeed(
      (currentPages) => {
        if (!currentPages) return currentPages;

        return currentPages.map((page) => ({
          ...page,
          feed: page.feed.filter((item) => {
            const matches =
              (item.id === item_id || item.item_id === item_id) &&
              item.type === table;
            return !matches;
          }),
        }));
      },
      { revalidate: false }
    );

    try {
      await deleteSession({ item_id, table });

      toast.success("Item has been deleted successfully.");
    } catch (error) {
      handleError(error, {
        message: "Failed to delete session",
        route: "server-action: deleteSession",
        method: "direct",
      });
      toast.error("Failed to delete session");
      mutateFeed(snapshot, { revalidate: false });
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
  } = useSWR<full_gym_session>(
    gymId ? `/api/gym/get-full-gym-session?id=${gymId}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
    }
  );

  const {
    data: TodoSessionFull,
    error: TodoSessionError,
    isLoading: isLoadingTodoSession,
    mutate: mutateFullTodoSession,
  } = useSWR<full_todo_session>(
    todoId ? `/api/todo-list/get-full-todo-session?id=${todoId}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
    }
  );

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

  return (
    <div>
      <ActiveSessionPopup />
      <div
        ref={containerRef}
        className="max-w-3xl mx-auto relative bg-linear-to-b from-slate-950 via-slate-900 to-slate-800  px-5 pt-3 pb-20 text-gray-100 overflow-y-auto touch-pan-y"
      >
        <div
          className="flex items-center justify-center text-white transition-all"
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
          <p className="text-center text-lg mt-10 ">
            Failed to load sessions. Please try again later.
          </p>
        ) : !data || feed.length === 0 ? (
          <p className="text-center text-lg mt-10">
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
                        className="flex-none basis-1/2 min-w-0 mr-5 select-none"
                        key={feedItem.item.id}
                      >
                        <FeedCard
                          {...feedItem}
                          pinned={true}
                          onExpand={() => {
                            setExpandedItem(feedItem);
                          }}
                          onTogglePin={() =>
                            togglePin(
                              getCanonicalId(feedItem.item),
                              feedItem.table,
                              true
                            )
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
                    onExpand={() => {
                      setExpandedItem(feedItem);
                    }}
                    onTogglePin={() =>
                      togglePin(
                        getCanonicalId(feedItem.item),
                        feedItem.table,
                        false
                      )
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
            {feed.length > 0 && hasNextPage && (
              <div ref={ref} className="h-10" />
            )}
            {isValidating && (
              <div className="flex flex-col gap-2 items-center">
                <p>Loading...</p>
                <Spinner />
              </div>
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
                  <p className="text-center text-lg mt-10">
                    Failed to load todo session details. Please try again later.
                  </p>
                ) : (
                  TodoSessionFull && (
                    <TodoSession
                      initialTodo={TodoSessionFull}
                      mutateFullTodoSession={async () => {
                        await mutateFullTodoSession();
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
                        await Promise.all([
                          mutateFeed(),
                          mutateFullTodoSession(),
                        ]);

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
