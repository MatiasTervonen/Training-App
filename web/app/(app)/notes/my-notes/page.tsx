"use client";

import { useState } from "react";
import Modal from "@/app/(app)/components/modal";
import FeedCard from "@/app/(app)/components/feed-cards/FeedCard";
import NotesSession from "@/app/(app)/components/expand-session-cards/notes";
import EditNote from "@/app/(app)/components/edit-session-cards/EditNotes";
import Spinner from "@/app/(app)/components/spinner";
import { FeedSkeleton } from "@/app/(app)/ui/loadingSkeletons/skeletons";
import { FeedItemUI } from "@/app/(app)/types/session";
import useMyNotesFeed from "@/app/(app)/notes/hooks/useMyNotesFeed";
import useNotesTogglePin from "@/app/(app)/notes/hooks/useNotesTogglePin";
import useNotesDeleteSession from "@/app/(app)/notes/hooks/useNotesDeleteSession";
import useNotesUpdateFeedItemToTop from "@/app/(app)/notes/hooks/useNotesUpdateFeedItemToTop";
import PinnedCarousel from "./components/PinnedCarousel";

export default function MyNotesPage() {
  const [expandedItem, setExpandedItem] = useState<FeedItemUI | null>(null);
  const [editingItem, setEditingItem] = useState<FeedItemUI | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

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
  } = useMyNotesFeed();

  const { togglePin } = useNotesTogglePin();
  const { handleDelete } = useNotesDeleteSession();
  const { updateFeedItemToTop } = useNotesUpdateFeedItemToTop();

  return (
    <div className="h-full">
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
          <FeedSkeleton count={6} />
        ) : error ? (
          <p className="text-center text-lg mt-10">
            Failed to load notes. Please try again later.
          </p>
        ) : !data || (unpinnedFeed.length === 0 && pinnedFeed.length === 0) ? (
          <p className="text-center text-lg mt-20">
            No notes yet. Create a note to see it here!
          </p>
        ) : (
          <>
            <PinnedCarousel
              pinnedFeed={pinnedFeed}
              setExpandedItem={setExpandedItem}
              setEditingItem={setEditingItem}
              togglePin={togglePin}
              handleDelete={handleDelete}
            />

            {unpinnedFeed.map((feedItem) => {
              return (
                <div className="mt-8" key={feedItem.id}>
                  <FeedCard
                    item={feedItem}
                    pinned={false}
                    onExpand={() => {
                      setExpandedItem(feedItem);
                    }}
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
                    onEdit={() => {
                      setEditingItem(feedItem);
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
                No more notes
              </p>
            )}
          </>
        )}

        {expandedItem && (
          <Modal onClose={() => setExpandedItem(null)} isOpen={true}>
            <NotesSession {...expandedItem} />
          </Modal>
        )}

        {editingItem && (
          <Modal
            isOpen={true}
            onClose={() => {
              setEditingItem(null);
              setHasUnsavedChanges(false);
            }}
            confirmBeforeClose={hasUnsavedChanges}
          >
            <EditNote
              note={editingItem}
              onDirtyChange={setHasUnsavedChanges}
              onSave={(updatedItem) => {
                updateFeedItemToTop(updatedItem);
                setEditingItem(null);
                setHasUnsavedChanges(false);
              }}
            />
          </Modal>
        )}
      </div>
    </div>
  );
}
