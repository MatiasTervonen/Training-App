import AppText from "@/components/AppText";
import { View, FlatList, RefreshControl } from "react-native";
import { useState, useMemo } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { FeedSkeleton } from "@/components/skeletetons";
import FullScreenModal from "@/components/FullScreenModal";
import { LinearGradient } from "expo-linear-gradient";
import useMyNotesFeed from "@/features/notes/hooks/useMyNotesFeed";
import { FeedItemUI, FeedData } from "@/types/session";
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
import AnimatedButton from "@/components/buttons/animatedButton";
import { Plus, FolderCog } from "lucide-react-native";

export default function NotesScreen() {
  const { t } = useTranslation("notes");
  const router = useRouter();
  const [expandedItem, setExpandedItem] = useState<FeedItemUI | null>(null);
  const [editingItem, setEditingItem] = useState<FeedItemUI | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [moveToFolderItem, setMoveToFolderItem] = useState<FeedItemUI | null>(
    null,
  );

  const { folder } = useLocalSearchParams<{ folder?: string }>();
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(
    () => folder ?? null,
  );

  const folderFilter: FolderFilter | undefined = useMemo(() => {
    if (selectedFolderId) return { type: "folder", folderId: selectedFolderId };
    return undefined;
  }, [selectedFolderId]);

  const queryClient = useQueryClient();
  const { folders, isLoading: foldersLoading } = useFolders();

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
    queryKey,
    pinnedContext,
  } = useMyNotesFeed(folderFilter);

  const { handleDelete } = useDeleteSession();
  const { togglePin } = useTogglePin(queryKey);
  const { updateFeedItemToTop } = useUpdateFeedItemToTop();

  const { notesSessionFull, notesSessionError, isLoadingNotesSession } =
    useFullSessions(expandedItem, editingItem);

  const getEmptyMessage = () => {
    if (selectedFolderId) return t("notes.folders.folderEmpty");
    return t("notes.noNotes");
  };

  const headerContent = (
    <View>
      <View className="flex-row items-center">
        <View className="flex-1">
          {folders.length > 0 && (
            <FolderFilterChips
              folders={folders}
              selectedFolderId={selectedFolderId}
              onSelectAll={() => setSelectedFolderId(null)}
              onSelectFolder={(id) => setSelectedFolderId(id)}
            />
          )}
        </View>
        <AnimatedButton
          onPress={() => router.push("/notes/folders" as never)}
          className="pr-4 pl-2 py-3"
        >
          <FolderCog size={20} color="#94a3b8" />
        </AnimatedButton>
      </View>
    </View>
  );

  return (
    <LinearGradient
      className="flex-1"
      colors={["#020618", "#1d293d"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      {!foldersLoading && headerContent}
      {isLoading ? (
        <FeedSkeleton count={5} />
      ) : error ? (
        <AppText className="text-center text-lg mt-10 mx-auto">
          {t("notes.failedToLoad")}
        </AppText>
      ) : !data || (unpinnedFeed.length === 0 && pinnedFeed.length === 0) ? (
        <AppText className="text-center text-lg mt-10 mx-auto">
          {getEmptyMessage()}
        </AppText>
      ) : (
        <FlatList
          data={unpinnedFeed}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: 100,
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
                onExpand={() => setExpandedItem(feedItem)}
                onTogglePin={() =>
                  togglePin(
                    feedItem.id,
                    feedItem.type,
                    feedItem.feed_context,
                    pinnedContext,
                  )
                }
                onDelete={() => {
                  handleDelete(feedItem.source_id, feedItem.type, queryKey);
                }}
                onEdit={() => setEditingItem(feedItem)}
                onMoveToFolder={() => setMoveToFolderItem(feedItem)}
              />
            </View>
          )}
          ListFooterComponent={
            <FeedFooter
              isFetchingNextPage={isFetchingNextPage}
              hasNextPage={hasNextPage}
              data={data as FeedData}
            />
          }
          ListHeaderComponent={
            <View className={pinnedFeed.length === 0 ? "mb-4" : ""}>
              <FeedHeader
                pinnedFeed={pinnedFeed}
                setExpandedItem={setExpandedItem}
                setEditingItem={setEditingItem}
                pinned_context={pinnedContext}
                queryKey={queryKey}
              />
            </View>
          }
        />
      )}

      <AnimatedButton
        onPress={() => router.push("/notes/quick-notes")}
        className="absolute bottom-8 right-6 w-14 h-14 rounded-full bg-blue-600 items-center justify-center border-2 border-blue-400"
      >
        <Plus size={28} color="#f3f4f6" />
      </AnimatedButton>

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
            (moveToFolderItem.extra_fields as { folder_id?: string } | null)
              ?.folder_id ?? null
          }
          folders={folders}
        />
      )}
    </LinearGradient>
  );
}
