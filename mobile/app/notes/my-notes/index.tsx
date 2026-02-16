import AppText from "@/components/AppText";
import { View, FlatList, RefreshControl } from "react-native";
import { useState, useMemo, useCallback } from "react";
import { FeedSkeleton } from "@/components/skeletetons";
import FullScreenModal from "@/components/FullScreenModal";
import { LinearGradient } from "expo-linear-gradient";
import useMyNotesFeed from "@/features/notes/hooks/useMyNotesFeed";
import { FeedItemUI } from "@/types/session";
import FeedCard from "@/features/feed-cards/FeedCard";
import useTogglePin from "@/features/feed/hooks/useTogglePin";
import FeedHeader from "@/features/feed/FeedHeader";
import FeedFooter from "@/features/feed/FeedFooter";
import NotesSession from "@/features/notes/cards/notes-expanded";
import EditNotes from "@/features/notes/cards/edit-notes";
import useUpdateFeedItemToTop from "@/features/feed/hooks/useUpdateFeedItemToTop";
import { useQueryClient } from "@tanstack/react-query";
import useDeleteSession from "@/features/feed/hooks/useDeleteSession";
import useFullSessions from "@/features/feed/hooks/useFullSessions";
import { useTranslation } from "react-i18next";
import useFolders from "@/features/notes/hooks/useFolders";
import FolderFilterChips from "@/features/notes/components/FolderFilterChips";
import MoveToFolderSheet from "@/features/notes/components/MoveToFolderSheet";
import type { FolderFilter } from "@/database/notes/get-notes";

export default function MyNotesScreen() {
  const { t } = useTranslation("notes");
  const [expandedItem, setExpandedItem] = useState<FeedItemUI | null>(null);
  const [editingItem, setEditingItem] = useState<FeedItemUI | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [moveToFolderItem, setMoveToFolderItem] = useState<FeedItemUI | null>(
    null,
  );

  // Folder filter state
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [isUnfiledSelected, setIsUnfiledSelected] = useState(false);

  const folderFilter: FolderFilter | undefined = useMemo(() => {
    if (isUnfiledSelected) return { type: "unfiled" };
    if (selectedFolderId) return { type: "folder", folderId: selectedFolderId };
    return undefined;
  }, [selectedFolderId, isUnfiledSelected]);

  const queryClient = useQueryClient();
  const { folders } = useFolders();

  const {
    data,
    error,
    isLoading,
    mutateFeed,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    pinnedFeed,
    unpinnedFeed,
  } = useMyNotesFeed(folderFilter);

  const { handleDelete } = useDeleteSession();
  const { togglePin } = useTogglePin(["myNotes"]);
  const { updateFeedItemToTop } = useUpdateFeedItemToTop();

  const { notesSessionFull, notesSessionError, isLoadingNotesSession } =
    useFullSessions(expandedItem, editingItem);

  // Build folder name lookup from folders
  const folderMap = useMemo(() => {
    const map = new Map<string, string>();
    folders.forEach((f) => map.set(f.id, f.name));
    return map;
  }, [folders]);

  const getFolderName = useCallback(
    (item: FeedItemUI) => {
      const folderId = (item.extra_fields as { folder_id?: string } | null)?.folder_id;
      if (!folderId) return null;
      return folderMap.get(folderId) ?? null;
    },
    [folderMap],
  );

  const getEmptyMessage = () => {
    if (isUnfiledSelected) return t("notes.folders.noUnfiled");
    if (selectedFolderId) return t("notes.folders.folderEmpty");
    return t("notes.noNotes");
  };

  return (
    <LinearGradient
      className="flex-1"
      colors={["#020618", "#1d293d"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      {isLoading ? (
        <FeedSkeleton count={5} />
      ) : error ? (
        <AppText className="text-center text-lg mt-10 mx-auto">
          {t("notes.failedToLoad")}
        </AppText>
      ) : !data || (unpinnedFeed.length === 0 && pinnedFeed.length === 0) ? (
        <View>
          {folders.length > 0 && (
            <FolderFilterChips
              folders={folders}
              selectedFolderId={selectedFolderId}
              isUnfiledSelected={isUnfiledSelected}
              onSelectAll={() => {
                setSelectedFolderId(null);
                setIsUnfiledSelected(false);
              }}
              onSelectUnfiled={() => {
                setSelectedFolderId(null);
                setIsUnfiledSelected(true);
              }}
              onSelectFolder={(id) => {
                setSelectedFolderId(id);
                setIsUnfiledSelected(false);
              }}
            />
          )}
          <AppText className="text-center text-lg mt-10 mx-auto">
            {getEmptyMessage()}
          </AppText>
        </View>
      ) : (
        <FlatList
          data={unpinnedFeed}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: 100,
            paddingTop: pinnedFeed.length === 0 && folders.length === 0 ? 30 : 0,
          }}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) {
              fetchNextPage();
            }
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={async () => {
                setRefreshing(true);
                await mutateFeed();
                setRefreshing(false);
              }}
            />
          }
          onEndReachedThreshold={0.5}
          renderItem={({ item: feedItem }) => (
            <View className={`px-4 ${unpinnedFeed ? "pb-10" : ""}`}>
              <FeedCard
                item={feedItem as FeedItemUI}
                pinned={false}
                onExpand={() => {
                  setExpandedItem(feedItem);
                }}
                onTogglePin={() =>
                  togglePin(
                    feedItem.id,
                    feedItem.type,
                    feedItem.feed_context,
                    "notes",
                  )
                }
                onDelete={() => {
                  handleDelete(feedItem.source_id, feedItem.type);
                }}
                onEdit={() => {
                  setEditingItem(feedItem);
                }}
                onMoveToFolder={() => {
                  setMoveToFolderItem(feedItem);
                }}
              />
            </View>
          )}
          ListFooterComponent={
            <FeedFooter
              isFetchingNextPage={isFetchingNextPage}
              hasNextPage={hasNextPage}
              data={data as any}
            />
          }
          ListHeaderComponent={
            <View>
              {folders.length > 0 && (
                <FolderFilterChips
                  folders={folders}
                  selectedFolderId={selectedFolderId}
                  isUnfiledSelected={isUnfiledSelected}
                  onSelectAll={() => {
                    setSelectedFolderId(null);
                    setIsUnfiledSelected(false);
                  }}
                  onSelectUnfiled={() => {
                    setSelectedFolderId(null);
                    setIsUnfiledSelected(true);
                  }}
                  onSelectFolder={(id) => {
                    setSelectedFolderId(id);
                    setIsUnfiledSelected(false);
                  }}
                />
              )}
              <FeedHeader
                pinnedFeed={pinnedFeed}
                setExpandedItem={setExpandedItem}
                setEditingItem={setEditingItem}
                pinned_context="notes"
                queryKey={["myNotes"]}
              />
            </View>
          }
        />
      )}

      {expandedItem && (
        <FullScreenModal
          isOpen={!!expandedItem}
          onClose={() => setExpandedItem(null)}
        >
          <NotesSession
            note={expandedItem}
            voiceRecordings={notesSessionFull}
            isLoadingVoice={isLoadingNotesSession}
            error={notesSessionError}
          />
        </FullScreenModal>
      )}

      {editingItem && (
        <FullScreenModal
          isOpen={!!editingItem}
          onClose={() => {
            setHasUnsavedChanges(false);
            setEditingItem(null);
          }}
          confirmBeforeClose={hasUnsavedChanges}
        >
          <EditNotes
            note={editingItem}
            onClose={() => setEditingItem(null)}
            onSave={(updatedItem) => {
              updateFeedItemToTop(updatedItem);
              queryClient.invalidateQueries({
                queryKey: ["fullNotesSession", editingItem.source_id],
              });
              setHasUnsavedChanges(false);
              setEditingItem(null);
            }}
            voiceRecordings={notesSessionFull}
            isLoadingVoice={isLoadingNotesSession}
            onDirtyChange={setHasUnsavedChanges}
          />
        </FullScreenModal>
      )}

      {moveToFolderItem && (
        <MoveToFolderSheet
          isOpen={!!moveToFolderItem}
          onClose={() => setMoveToFolderItem(null)}
          noteId={moveToFolderItem.source_id}
          currentFolderId={
            (moveToFolderItem.extra_fields as { folder_id?: string } | null)?.folder_id ?? null
          }
          folders={folders}
        />
      )}
    </LinearGradient>
  );
}
