"use client";

import { useState } from "react";
import Modal from "@/components/modal";
import FeedCard from "@/features/feed-cards/FeedCard";
import ReminderSession from "@/features/reminders/cards/reminder-expanded";
import EditReminder from "@/features/reminders/cards/EditGlobalReminder";
import Spinner from "@/components/spinner";
import { FeedSkeleton } from "@/ui/loadingSkeletons/skeletons";
import { FeedItemUI } from "@/types/session";
import useMyRemindersFeed from "@/features/reminders/hooks/useMyRemindersFeed";
import useRemindersTogglePin from "@/features/reminders/hooks/useRemindersTogglePin";
import useRemindersDeleteSession from "@/features/reminders/hooks/useRemindersDeleteSession";
import useRemindersUpdateFeedItemToTop from "@/features/reminders/hooks/useRemindersUpdateFeedItemToTop";
import FeedHeader from "@/features/dashboard/components/feedHeader";
import { Plus, Bell } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import type { ReminderFilter } from "@/database/reminders/get-reminders-feed";
import EmptyState from "@/components/EmptyState";

const FILTERS: ReminderFilter[] = ["upcoming", "delivered"];

export default function RemindersPage() {
  const { t } = useTranslation("reminders");
  const [expandedItem, setExpandedItem] = useState<FeedItemUI | null>(null);
  const [editingItem, setEditingItem] = useState<FeedItemUI | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [filter, setFilter] = useState<ReminderFilter>("upcoming");

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
    queryKey,
  } = useMyRemindersFeed(filter);

  const { togglePin } = useRemindersTogglePin(queryKey);
  const { handleDelete } = useRemindersDeleteSession(queryKey);
  const { updateFeedItemToTop } = useRemindersUpdateFeedItemToTop();

  const getEmptyMessage = () => {
    if (filter === "upcoming") return t("reminders.noRemindersUpcoming");
    return t("reminders.noRemindersDelivered");
  };

  const getEmptyDescription = () => {
    if (filter === "upcoming") return t("reminders.noRemindersUpcomingDesc");
    return t("reminders.noRemindersDeliveredDesc");
  };

  return (
    <div className="h-full relative">
      <div
        ref={containerRef}
        className="max-w-2xl mx-auto relative bg-linear-to-b from-slate-950 via-slate-900 to-slate-800 px-5 pt-3 pb-10 overflow-y-auto touch-pan-y h-full"
      >
        {/* Filter tabs */}
        <div className="sticky top-0 z-10 bg-slate-800 rounded-lg mb-4">
          <div className="flex p-1 gap-2">
            {FILTERS.map((f) => {
              const isActive = filter === f;
              return (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`flex-1 py-2 px-3 rounded-md cursor-pointer transition-colors ${
                    isActive
                      ? "bg-slate-700 text-cyan-400"
                      : "text-gray-200 hover:text-gray-100"
                  }`}
                >
                  {t(`reminders.tabs.${f}`)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Pull to refresh */}
        <div
          className="flex items-center justify-center transition-all"
          style={{ height: pullDistance }}
        >
          {refreshing ? (
            <div className="flex text-xl items-center gap-4">
              <p className="font-body">Refreshing...</p>
              <Spinner />
            </div>
          ) : pullDistance > 0 ? (
            <div className="flex text-xl items-center gap-2">
              <p className="font-body text-gray-100/70">Pull to refresh...</p>
            </div>
          ) : null}
        </div>

        {isLoading && !data ? (
          <FeedSkeleton count={6} />
        ) : error ? (
          <p className="font-body text-center text-lg mt-10">
            {t("reminders.errorLoading")}
          </p>
        ) : (
          <>
            <FeedHeader
              pinnedFeed={pinnedFeed}
              setExpandedItem={setExpandedItem}
              setEditingItem={setEditingItem}
              pinned_context="reminders"
              queryKey={queryKey}
            />

            {unpinnedFeed.length === 0 ? (
              <EmptyState
                icon={Bell}
                title={getEmptyMessage()}
                description={getEmptyDescription()}
              />
            ) : (
              <>
                {unpinnedFeed.map((feedItem, i) => (
                  <div className={i === 0 && pinnedFeed.length === 0 ? "mt-2" : "mt-8"} key={feedItem.id}>
                    <FeedCard
                      item={feedItem}
                      pinned={false}
                      onExpand={() => setExpandedItem(feedItem)}
                      onTogglePin={() =>
                        togglePin(
                          feedItem.id,
                          feedItem.type,
                          feedItem.feed_context
                        )
                      }
                      onDelete={() =>
                        handleDelete(feedItem.source_id, feedItem.type)
                      }
                      onEdit={() => setEditingItem(feedItem)}
                    />
                  </div>
                ))}
                {isFetchingNextPage && (
                  <div className="flex flex-col gap-2 items-center mt-10">
                    <p className="font-body">Loading more...</p>
                    <Spinner />
                  </div>
                )}

                {hasNextPage && <div ref={loadMoreRef} className="h-20"></div>}

                {!hasNextPage && (data?.pages.length ?? 0) > 1 && (
                  <p className="font-body text-center justify-center mt-10 text-gray-300">
                    No more reminders
                  </p>
                )}
              </>
            )}
          </>
        )}

        {expandedItem && (
          <Modal
            onClose={() => setExpandedItem(null)}
            isOpen={true}
          >
            <ReminderSession {...expandedItem} />
          </Modal>
        )}

        {editingItem && (
          <Modal
            isOpen={true}
            onClose={() => { setEditingItem(null); setHasUnsavedChanges(false); }}
            confirmBeforeClose={hasUnsavedChanges}
          >
            <EditReminder
              reminder={editingItem}
              onClose={() => setEditingItem(null)}
              onSave={(updatedItem) => {
                updateFeedItemToTop(updatedItem);
              }}
              onDirtyChange={setHasUnsavedChanges}
            />
          </Modal>
        )}

      </div>

      {/* Floating Action Button */}
      <div className="absolute bottom-8 right-6 z-50 pointer-events-none">
        <Link
          href="/reminders/global-reminders"
          className="pointer-events-auto w-14 h-14 rounded-full bg-slate-800 border-[1.5px] border-yellow-400/60 shadow-lg shadow-yellow-400/30 flex items-center justify-center hover:scale-110 transition-transform"
        >
          <Plus size={30} className="text-yellow-400" />
        </Link>
      </div>
    </div>
  );
}
