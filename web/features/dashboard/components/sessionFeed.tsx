"use client";

import { useState, useEffect, useRef } from "react";
import NotesSession from "@/features/notes/cards/notes-expanded";
import Modal from "@/components/modal";
import FeedCard from "@/features/feed-cards/FeedCard";
import EditNote from "@/features/notes/cards/notes-edit";
import GymSession from "@/features/gym/cards/gym-expanded";
import Spinner from "@/components/spinner";
import WeightSession from "@/features/weight/cards/weight-expanded";
import EditWeight from "@/features/weight/cards/weight-edit";
import { FeedSkeleton } from "@/ui/loadingSkeletons/skeletons";
import TodoSession from "@/features/todo/cards/todo-expanded";
import EditTodo from "@/features/todo/cards/todo-edit";
import ReminderSession from "@/features/reminders/cards/reminder-expanded";
import EditReminder from "@/features/reminders/cards/EditGlobalReminder";
import { useRouter } from "next/navigation";
import useDeleteSession from "@/features/dashboard/hooks/useDeleteSession";
import useTogglePin from "@/features/dashboard/hooks/useTogglePin";
import useHideFeedItem from "@/features/dashboard/hooks/useHideFeedItem";
import { FeedItemUI } from "@/types/session";
import useFeed from "@/features/dashboard/hooks/useFeed";
import useFullSessions from "@/features/dashboard/hooks/useFullSessions";
import useUpdateFeedItem from "@/features/dashboard/hooks/useUpdateFeedItem";
import useUpdateFeedItemToTop from "@/features/dashboard/hooks/useUpdateFeedItemToTop";
import { useTranslation } from "react-i18next";
import ActivitySession from "@/features/activities/cards/activity-feed-expanded/activity";
import EditActivity from "@/features/activities/cards/activity-edit";
import TutorialSession from "@/features/feed-cards/tutorial-expanded";
import FeedHeader from "@/features/dashboard/components/feedHeader";
import EmptyState from "@/components/EmptyState";
import { LayoutDashboard, Users } from "lucide-react";

// Social feed imports
import FeedModeToggle from "@/features/social-feed/components/FeedModeToggle";
import SocialFeedCard from "@/features/social-feed/components/SocialFeedCard";
import SocialPostModal from "@/features/social-feed/components/SocialPostModal";
import useSocialFeed from "@/features/social-feed/hooks/useSocialFeed";
import useToggleLike from "@/features/social-feed/hooks/useToggleLike";
import { SocialFeedItem } from "@/types/social-feed";
import { useQuery } from "@tanstack/react-query";
import { getFriendGymSession } from "@/database/social-feed/get-friend-gym-session";
import { getFriendActivitySession } from "@/database/social-feed/get-friend-activity-session";
import type { FullGymSession } from "@/database/gym/get-full-gym-session";
import type { FullActivitySession } from "@/types/models";

type FeedMode = "my" | "friends";

export default function SessionFeed() {
  const { t } = useTranslation("feed");
  const { t: tSocial } = useTranslation("social");
  const [feedMode, setFeedMode] = useState<FeedMode>("my");
  const [expandedItem, setExpandedItem] = useState<FeedItemUI | null>(null);
  const [editingItem, setEditingItem] = useState<FeedItemUI | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [hasUnsavedExpandedChanges, setHasUnsavedExpandedChanges] = useState(false);

  // Social feed state — one modal for both details and comments
  const [openSocialItem, setOpenSocialItem] = useState<{ item: SocialFeedItem; scrollToComments: boolean } | null>(null);

  const router = useRouter();

  // ─── Personal feed ───
  const {
    data,
    error,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    pinnedFeed,
    unpinnedFeed,
    containerRef,
    pullDistance,
    refreshing,
    loadMoreRef,
  } = useFeed();

  const { togglePin } = useTogglePin();
  const { handleDelete } = useDeleteSession();
  const { handleHide } = useHideFeedItem();

  const {
    GymSessionFull,
    GymSessionError,
    isLoadingGymSession,
    TodoSessionFull,
    TodoSessionError,
    isLoadingTodoSession,
    refetchFullTodo,
    activitySessionFull,
    activitySessionError,
    isLoadingActivitySession,
    refetchFullActivity,
  } = useFullSessions(expandedItem, editingItem);

  const { updateFeedItem } = useUpdateFeedItem();
  const { updateFeedItemToTop } = useUpdateFeedItemToTop();

  // ─── Social feed ───
  const socialFeed = useSocialFeed();
  const { mutate: toggleLike } = useToggleLike();

  // Social feed infinite scroll
  const socialLoadMoreRef = useRef<HTMLDivElement | null>(null);

  const { hasNextPage: socialHasNext, isFetchingNextPage: socialFetchingNext, fetchNextPage: socialFetchNext } = socialFeed;

  useEffect(() => {
    if (feedMode !== "friends" || !socialLoadMoreRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && socialHasNext && !socialFetchingNext) {
          socialFetchNext();
        }
      },
      { rootMargin: "300px" },
    );

    observer.observe(socialLoadMoreRef.current);
    return () => observer.disconnect();
  }, [feedMode, socialHasNext, socialFetchingNext, socialFetchNext]);

  // Friend expanded session queries
  const {
    data: friendGymSession,
    error: friendGymError,
    isLoading: isLoadingFriendGym,
  } = useQuery<FullGymSession>({
    queryKey: ["friendGymSession", openSocialItem?.item.id],
    queryFn: () => getFriendGymSession(openSocialItem!.item.id),
    enabled: !!openSocialItem && openSocialItem.item.type === "gym_sessions",
  });

  const {
    data: friendActivitySession,
    error: friendActivityError,
    isLoading: isLoadingFriendActivity,
  } = useQuery<FullActivitySession>({
    queryKey: ["friendActivitySession", openSocialItem?.item.id],
    queryFn: () => getFriendActivitySession(openSocialItem!.item.id),
    enabled: !!openSocialItem && openSocialItem.item.type === "activity_sessions",
  });

  return (
    <div className="h-full relative max-w-2xl mx-auto">
      <div
        ref={containerRef}
        className="relative bg-linear-to-b from-slate-950 via-slate-900 to-slate-800 px-5 pt-3 pb-10 overflow-y-auto touch-pan-y h-full"
      >
        <div
          className="flex items-center justify-center transition-all"
          style={{ height: pullDistance }}
        >
          {refreshing ? (
            <div className="flex text-xl items-center gap-4 font-body">
              <p>{t("feed.refreshing")}</p>
              <Spinner />
            </div>
          ) : pullDistance > 0 ? (
            <div className="flex text-xl items-center gap-2 font-body">
              <p className="text-gray-100/70">{t("feed.pullToRefresh")}</p>
            </div>
          ) : null}
        </div>

        {/* Feed mode toggle — rendered outside scroll container, see below */}

        {/* ─── Personal feed ─── */}
        {feedMode === "my" && (
          <>
            {isLoading && !data ? (
              <FeedSkeleton count={6} />
            ) : error ? (
              <p className="text-center text-lg mt-10 font-body">{t("feed.loadError")}</p>
            ) : (
              <>
                <FeedHeader
                  pinnedFeed={pinnedFeed}
                  setExpandedItem={setExpandedItem}
                  setEditingItem={setEditingItem}
                  pinned_context="main"
                />

                {unpinnedFeed.length === 0 && pinnedFeed.length === 0 ? (
                  <EmptyState
                    icon={LayoutDashboard}
                    title={t("feed.noSessions")}
                    description={t("feed.noSessionsDesc")}
                  />
                ) : (
                  <>
                    {unpinnedFeed.map((feedItem, i) => {
                      return (
                        <div className={i === 0 && pinnedFeed.length === 0 ? "mt-2" : "mt-8"} key={feedItem.id}>
                          <FeedCard
                            item={feedItem}
                            pinned={false}
                            onExpand={() => {
                              if (feedItem.type === "habits") {
                                router.push("/habits");
                              } else {
                                setExpandedItem(feedItem);
                              }
                            }}
                            onTogglePin={() =>
                              togglePin(
                                feedItem.id,
                                feedItem.type,
                                feedItem.feed_context,
                                "main",
                              )
                            }
                            onDelete={() =>
                              handleDelete(feedItem.source_id, feedItem.type)
                            }
                            onHide={() => handleHide(feedItem.id)}
                            onEdit={() => {
                              if (feedItem.type === "gym_sessions") {
                                router.push(`/gym/gym/${feedItem.source_id}/edit`);
                              } else {
                                setEditingItem(feedItem);
                              }
                            }}
                          />
                        </div>
                      );
                    })}
                    {isFetchingNextPage && (
                      <div className="flex flex-col gap-2 items-center mt-10 font-body">
                        <p>{t("feed.loadingMore")}</p>
                        <Spinner />
                      </div>
                    )}

                    {hasNextPage && <div ref={loadMoreRef} className="h-20"></div>}

                  </>
                )}
              </>
            )}
          </>
        )}

        {/* ─── Social feed ─── */}
        {feedMode === "friends" && (
          <>
            {socialFeed.isLoading ? (
              <FeedSkeleton count={6} />
            ) : socialFeed.error ? (
              <p className="text-center text-lg mt-10 font-body">{t("feed.loadError")}</p>
            ) : socialFeed.items.length === 0 ? (
              <EmptyState
                icon={Users}
                title={tSocial("social.noFriendPosts")}
                description={tSocial("social.noFriendsYet")}
              />
            ) : (
              <>
                {socialFeed.items.map((item) => (
                  <div className="mt-4" key={item.id}>
                    <SocialFeedCard
                      item={item}
                      onToggleLike={() => toggleLike(item.id)}
                      onExpand={() => setOpenSocialItem({ item, scrollToComments: false })}
                      onOpenComments={() => setOpenSocialItem({ item, scrollToComments: true })}
                    />
                  </div>
                ))}

                {socialFeed.isFetchingNextPage && (
                  <div className="flex flex-col gap-2 items-center mt-10 font-body">
                    <p>{t("feed.loadingMore")}</p>
                    <Spinner />
                  </div>
                )}

                {socialFeed.hasNextPage && <div ref={socialLoadMoreRef} className="h-20"></div>}

              </>
            )}
          </>
        )}

        {/* ─── Personal feed expanded modals ─── */}
        {expandedItem && (
          <Modal
            onClose={() => { setExpandedItem(null); setHasUnsavedExpandedChanges(false); }}
            isOpen={true}
            confirmBeforeClose={hasUnsavedExpandedChanges}
          >
            {expandedItem.type === "notes" && (
              <NotesSession {...expandedItem} />
            )}
            {expandedItem.type === "global_reminders" && (
              <ReminderSession {...expandedItem} />
            )}

            {expandedItem.type === "local_reminders" && (
              <ReminderSession {...expandedItem} />
            )}

            {expandedItem.type === "gym_sessions" && (
              <>
                {isLoadingGymSession ? (
                  <div className="flex flex-col gap-5 items-center justify-center pt-40 px-10 font-body">
                    <p className="text-lg">{t("feed.loadingGym")}</p>
                    <Spinner />
                  </div>
                ) : GymSessionError ? (
                  <p className="text-center text-lg mt-40 px-10 font-body">
                    {t("feed.gymError")}
                  </p>
                ) : (
                  GymSessionFull && <GymSession {...GymSessionFull} />
                )}
              </>
            )}

            {expandedItem.type === "activity_sessions" && (
              <>
                {isLoadingActivitySession ? (
                  <div className="flex flex-col gap-5 items-center justify-center pt-40 px-10 font-body">
                    <p className="text-lg">{t("feed.loadingActivity")}</p>
                    <Spinner />
                  </div>
                ) : activitySessionError ? (
                  <p className="text-center text-lg mt-40 px-10 font-body">
                    {t("feed.activityError")}
                  </p>
                ) : (
                  activitySessionFull && (
                    <ActivitySession {...activitySessionFull} />
                  )
                )}
              </>
            )}

            {expandedItem.type === "weight" && (
              <WeightSession {...expandedItem} />
            )}

            {expandedItem.type === "tutorial" && (
              <TutorialSession />
            )}

            {expandedItem.type === "todo_lists" && (
              <>
                {isLoadingTodoSession ? (
                  <div className="flex flex-col gap-5 items-center justify-center pt-40 px-10 font-body">
                    <p>{t("feed.loadingTodo")}</p>
                    <Spinner />
                  </div>
                ) : TodoSessionError ? (
                  <p className="text-center text-lg mt-40 px-10">
                    {t("feed.todoError")}
                  </p>
                ) : (
                  TodoSessionFull && (
                    <TodoSession
                      initialTodo={TodoSessionFull}
                      onSave={async (updatedItem) => {
                        await Promise.all([
                          updateFeedItemToTop(updatedItem),
                          refetchFullTodo(),
                        ]);
                      }}
                      onDirtyChange={setHasUnsavedExpandedChanges}
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
            onClose={() => { setEditingItem(null); setHasUnsavedChanges(false); }}
            confirmBeforeClose={hasUnsavedChanges}
          >
            {editingItem.type === "notes" && (
              <EditNote
                note={editingItem}
                onSave={(updatedItem) => {
                  updateFeedItemToTop(updatedItem);
                }}
                onDirtyChange={setHasUnsavedChanges}
              />
            )}
            {editingItem.type === "global_reminders" && (
              <EditReminder
                reminder={editingItem}
                onClose={() => setEditingItem(null)}
                onSave={(updatedItem) => {
                  updateFeedItemToTop(updatedItem);
                }}
                onDirtyChange={setHasUnsavedChanges}
              />
            )}
            {editingItem.type === "todo_lists" && (
              <>
                {isLoadingTodoSession ? (
                  <div className="flex flex-col gap-5 items-center justify-center pt-40 px-10 font-body">
                    <p>{t("feed.loadingTodo")}</p>
                    <Spinner />
                  </div>
                ) : TodoSessionError ? (
                  <p className="text-center text-lg mt-40 px-10 font-body">
                    {t("feed.todoError")}
                  </p>
                ) : (
                  TodoSessionFull && (
                    <EditTodo
                      todo_session={TodoSessionFull}
                      onClose={() => setEditingItem(null)}
                      onSave={async (updatedItem) => {
                        await Promise.all([
                          updateFeedItemToTop(updatedItem),
                          refetchFullTodo(),
                        ]);
                      }}
                      onDirtyChange={setHasUnsavedChanges}
                    />
                  )
                )}
              </>
            )}
            {editingItem.type === "weight" && (
              <EditWeight
                weight={editingItem}
                onClose={() => setEditingItem(null)}
                onSave={(updatedItem) => {
                  updateFeedItem(updatedItem);
                }}
                onDirtyChange={setHasUnsavedChanges}
              />
            )}
            {editingItem.type === "activity_sessions" && (
              <>
                {isLoadingActivitySession ? (
                  <div className="flex flex-col gap-5 items-center justify-center pt-40 px-10 font-body">
                    <p>{t("feed.loadingActivity")}</p>
                    <Spinner />
                  </div>
                ) : activitySessionError ? (
                  <p className="text-center text-lg mt-40 px-10 font-body">
                    {t("feed.activityError")}
                  </p>
                ) : (
                  activitySessionFull && (
                    <EditActivity
                      activity={activitySessionFull}
                      onClose={() => setEditingItem(null)}
                      onSave={async (updatedItem) => {
                        await Promise.all([
                          updateFeedItem(updatedItem),
                          refetchFullActivity(),
                        ]);
                      }}
                      onDirtyChange={setHasUnsavedChanges}
                    />
                  )
                )}
              </>
            )}
          </Modal>
        )}

        {/* ─── Social post modal (details + comments) ─── */}
        {openSocialItem && (
          <SocialPostModal
            item={openSocialItem.item}
            onClose={() => setOpenSocialItem(null)}
            onToggleLike={() => toggleLike(openSocialItem.item.id)}
            scrollToComments={openSocialItem.scrollToComments}
            isLoadingSession={
              openSocialItem.item.type === "gym_sessions" ? isLoadingFriendGym : isLoadingFriendActivity
            }
            sessionError={
              openSocialItem.item.type === "gym_sessions" ? !!friendGymError : !!friendActivityError
            }
            sessionContent={
              <>
                {openSocialItem.item.type === "gym_sessions" && friendGymSession && (
                  <GymSession {...friendGymSession} readOnly />
                )}
                {openSocialItem.item.type === "activity_sessions" && friendActivitySession && (
                  <ActivitySession {...friendActivitySession} feed_context="feed" />
                )}
              </>
            }
          />
        )}

      </div>
      <FeedModeToggle feedMode={feedMode} setFeedMode={setFeedMode} />
    </div>
  );
}
