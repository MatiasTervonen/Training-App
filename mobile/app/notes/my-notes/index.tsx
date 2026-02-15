import AppText from "@/components/AppText";
import { View, FlatList, RefreshControl } from "react-native";
import { useState } from "react";
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

export default function MyNotesScreen() {
  const { t } = useTranslation("notes");
  const [expandedItem, setExpandedItem] = useState<FeedItemUI | null>(null);
  const [editingItem, setEditingItem] = useState<FeedItemUI | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const queryClient = useQueryClient();

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
  } = useMyNotesFeed();

  // handle feedItem deletion
  const { handleDelete } = useDeleteSession();

  const { togglePin } = useTogglePin(["myNotes"]);

  // useUpdateFeedItem hook to update feed item in cache and move it to top
  const { updateFeedItemToTop } = useUpdateFeedItemToTop();

  const { notesSessionFull, notesSessionError, isLoadingNotesSession } =
    useFullSessions(expandedItem, editingItem);

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
        <AppText className="text-center text-lg mt-10 mx-auto">
          {t("notes.noNotes")}
        </AppText>
      ) : (
        <FlatList
          data={unpinnedFeed}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: 100,
            paddingTop: pinnedFeed.length === 0 ? 30 : 0,
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
            <FeedHeader
              pinnedFeed={pinnedFeed}
              setExpandedItem={setExpandedItem}
              setEditingItem={setEditingItem}
              pinned_context="notes"
              queryKey={["myNotes"]}
            />
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
    </LinearGradient>
  );
}
