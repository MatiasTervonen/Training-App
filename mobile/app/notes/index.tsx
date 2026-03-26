import AppText from "@/components/AppText";
import BodyText from "@/components/BodyText";
import { View, FlatList, RefreshControl } from "react-native";
import { useState, useMemo, useEffect } from "react";
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
import FloatingActionButton from "@/components/buttons/FloatingActionButton";
import { Plus, FolderCog, StickyNote } from "lucide-react-native";
import BodyTextNC from "@/components/BodyTextNC";
import { useModalPageConfig } from "@/lib/stores/modalPageConfig";

export default function NotesScreen() {
  const { t } = useTranslation(["notes", "common"]);
  const router = useRouter();
  const setModalPageConfig = useModalPageConfig((s) => s.setModalPageConfig);

  useEffect(() => {
    setModalPageConfig({
      rightLabel: t("common:navigation.new"),
      onSwipeLeft: () => router.push("/notes/quick-notes"),
    });
    return () => setModalPageConfig(null);
  }, [router, setModalPageConfig, t]);
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
    <FolderFilterChips
      folders={folders}
      selectedFolderId={selectedFolderId}
      onSelectAll={() => setSelectedFolderId(null)}
      onSelectFolder={(id) => setSelectedFolderId(id)}
      rightIcon={
        <AnimatedButton
          onPress={() => router.push("/notes/folders" as never)}
          className="px-3 py-2 ml-1 mr-2"
        >
          <FolderCog size={20} color="#94a3b8" />
        </AnimatedButton>
      }
    />
  );

  return (
    <LinearGradient
      className="flex-1"
      colors={["#020618", "#1d293d"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View className="absolute top-0 left-0 right-0 z-10">
        {headerContent}
      </View>
      {isLoading ? (
        <FeedSkeleton count={5} subFeed />
      ) : error ? (
        <BodyText className="text-center text-lg mt-10 mx-auto">
          {t("notes.failedToLoad")}
        </BodyText>
      ) : !data || (unpinnedFeed.length === 0 && pinnedFeed.length === 0) ? (
        <View className="flex-1 items-center mt-[30%] px-8">
          <View className="items-center">
            <View className="w-20 h-20 rounded-full bg-slate-800 border border-slate-700 items-center justify-center mb-5">
              <StickyNote size={36} color="#94a3b8" />
            </View>
            <AppText className="text-xl text-center mb-3">
              {getEmptyMessage()}
            </AppText>
            <BodyTextNC className="text-sm text-gray-400 text-center">
              {selectedFolderId
                ? t("notes.folders.moveToFolder")
                : t("notes.noNotesDesc")}
            </BodyTextNC>
          </View>
        </View>
      ) : (
        <FlatList
          data={unpinnedFeed}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: 100,
            paddingTop: 50,
          }}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) {
              fetchNextPage();
            }
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              progressViewOffset={50}
              onRefresh={async () => {
                setRefreshing(true);
                await mutateFeed();
                setRefreshing(false);
              }}
            />
          }
          onEndReachedThreshold={0.5}
          renderItem={({ item: feedItem }) => (
            <View className={`px-4 ${unpinnedFeed ? "pb-5" : ""}`}>
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

      <FloatingActionButton onPress={() => router.push("/notes/quick-notes")} color="#a855f7">
        <Plus size={30} color="#a855f7" />
      </FloatingActionButton>

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
