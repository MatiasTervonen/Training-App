"use client";

import { useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Modal from "@/components/modal";
import FeedCard from "@/features/feed-cards/FeedCard";
import NotesSession from "@/features/notes/cards/notes-expanded";
import EditNote from "@/features/notes/cards/notes-edit";
import Spinner from "@/components/spinner";
import { FeedSkeleton } from "@/ui/loadingSkeletons/skeletons";
import { FeedItemUI } from "@/types/session";
import useMyNotesFeed from "@/features/notes/hooks/useMyNotesFeed";
import useNotesTogglePin from "@/features/notes/hooks/useNotesTogglePin";
import useNotesDeleteSession from "@/features/notes/hooks/useNotesDeleteSession";
import useNotesUpdateFeedItemToTop from "@/features/notes/hooks/useNotesUpdateFeedItemToTop";
import FeedHeader from "@/features/dashboard/components/feedHeader";
import useFolders from "@/features/notes/hooks/useFolders";
import FolderFilterChips from "@/features/notes/components/FolderFilterChips";
import MoveToFolderDropdown from "@/features/notes/components/MoveToFolderDropdown";
import { useTranslation } from "react-i18next";
import type { FolderFilter } from "@/database/notes/get-notes";

export default function MyNotesPage() {
  const { t } = useTranslation("notes");
  const [expandedItem, setExpandedItem] = useState<FeedItemUI | null>(null);
  const [editingItem, setEditingItem] = useState<FeedItemUI | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [moveToFolderItem, setMoveToFolderItem] = useState<FeedItemUI | null>(
    null,
  );

  // Folder filter state — initialise from ?folder= search param
  const searchParams = useSearchParams();
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(
    () => searchParams.get("folder"),
  );

  const folderFilter: FolderFilter | undefined = useMemo(() => {
    if (selectedFolderId) return { type: "folder", folderId: selectedFolderId };
    return undefined;
  }, [selectedFolderId]);

  const { folders } = useFolders();

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
    pinnedContext,
  } = useMyNotesFeed(folderFilter);

  const { togglePin } = useNotesTogglePin(queryKey, pinnedContext);
  const { handleDelete } = useNotesDeleteSession();
  const { updateFeedItemToTop } = useNotesUpdateFeedItemToTop();


  const getEmptyMessage = () => {
    if (selectedFolderId) return t("notes.folders.folderEmpty");
    return t("notes.noNotes");
  };

  return (
    <div className="h-full">
      <div
        ref={containerRef}
        className="max-w-2xl mx-auto relative bg-linear-to-b from-slate-950 via-slate-900 to-slate-800 px-5 pt-3 pb-10 overflow-y-auto touch-pan-y h-full"
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

        {/* Folder filter chips */}
        {folders.length > 0 && (
          <div className={pinnedFeed.length === 0 ? "mb-4" : ""}>
            <FolderFilterChips
              folders={folders}
              selectedFolderId={selectedFolderId}
              onSelectAll={() => {
                setSelectedFolderId(null);
              }}
              onSelectFolder={(id) => {
                setSelectedFolderId(id);
              }}
            />
          </div>
        )}

        {isLoading && !data ? (
          <FeedSkeleton count={6} />
        ) : error ? (
          <p className="text-center text-lg mt-10">
            {t("notes.failedToLoad")}
          </p>
        ) : !data || (unpinnedFeed.length === 0 && pinnedFeed.length === 0) ? (
          <p className="text-center text-lg mt-20">{getEmptyMessage()}</p>
        ) : (
          <>
            <FeedHeader
              pinnedFeed={pinnedFeed}
              setExpandedItem={setExpandedItem}
              setEditingItem={setEditingItem}
              pinned_context={pinnedContext}
              queryKey={queryKey}
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
                        feedItem.feed_context,
                      )
                    }
                    onDelete={() =>
                      handleDelete(feedItem.source_id, feedItem.type)
                    }
                    onEdit={() => {
                      setEditingItem(feedItem);
                    }}
                    onMoveToFolder={() => {
                      setMoveToFolderItem(feedItem);
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

        {moveToFolderItem && (
          <Modal
            isOpen={true}
            onClose={() => setMoveToFolderItem(null)}
          >
            <div className="max-w-md mx-auto pt-12 px-5">
              <h2 className="text-xl text-center mb-6">
                {t("notes.folders.moveToFolder")}
              </h2>
              <MoveToFolderDropdown
                noteId={moveToFolderItem.source_id}
                currentFolderId={
                  (moveToFolderItem.extra_fields as { folder_id?: string } | null)?.folder_id ?? null
                }
                onMoved={() => setMoveToFolderItem(null)}
              />
            </div>
          </Modal>
        )}

      </div>
    </div>
  );
}
