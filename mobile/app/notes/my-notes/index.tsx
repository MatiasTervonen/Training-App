import AppText from "@/components/AppText";
import { View, FlatList, RefreshControl } from "react-native";
import { useState } from "react";
import { notes } from "@/types/models";
import { FeedSkeleton } from "@/components/skeletetons";
import FeedFooter from "@/Features/feed/FeedFooter";
import NotesFeedCard from "@/Features/notes/cards/FeedCardNotes";
import FullScreenModal from "@/components/FullScreenModal";
import EditNotesMyNotes from "@/Features/notes/cards/MyNotes-edit";
import useUpdateMyNotes from "@/Features/notes/hooks/useUpdateMyNotes";
import MyNotesExpanded from "@/Features/notes/cards/MyNotes-expanded";
import useDeleteNotes from "@/Features/notes/hooks/useDeleteNotes";
import { LinearGradient } from "expo-linear-gradient";
import useTogglePinNotes from "@/Features/notes/hooks/useTogglePinNotes";
import MyNotesFeedHeader from "@/Features/notes/components/MyNotesFeedHeader";
import useMyNotesFeed from "@/Features/notes/hooks/useMyNotesFeed";

export default function MyNotesScreen() {
  const [expandedItem, setExpandedItem] = useState<notes | null>(null);
  const [editingItem, setEditingItem] = useState<notes | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const { updateMyNotes } = useUpdateMyNotes();

  const {
    data,
    error,
    isLoading,
    mutateFeed,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    pinnedNotes,
    unpinnedNotes,
  } = useMyNotesFeed();

  const { handleDelete } = useDeleteNotes();

  const { togglePin } = useTogglePinNotes();

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
          Failed to load notes. Please try again later.
        </AppText>
      ) : !data || (unpinnedNotes.length === 0 && pinnedNotes.length === 0) ? (
        <AppText className="text-center text-lg mt-10 mx-auto">
          No notes yet. Add a note to get started!
        </AppText>
      ) : (
        <FlatList
          data={unpinnedNotes}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: 100,
            paddingTop: pinnedNotes.length === 0 ? 30 : 0,
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
          renderItem={({ item }) => (
            <View className="px-4 pb-10">
              <NotesFeedCard
                item={item as notes}
                pinned={false}
                onExpand={() => setExpandedItem(item)}
                onTogglePin={() => togglePin(item.id, item.pinned ?? false)}
                onDelete={() => handleDelete(item.id)}
                onEdit={() => setEditingItem(item)}
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
            <MyNotesFeedHeader
              pinnedNotes={pinnedNotes}
              setExpandedItem={setExpandedItem}
              setEditingItem={setEditingItem}
            />
          }
        />
      )}

      {expandedItem && (
        <FullScreenModal
          isOpen={!!expandedItem}
          onClose={() => setExpandedItem(null)}
        >
          <MyNotesExpanded {...expandedItem} />
        </FullScreenModal>
      )}

      {editingItem && (
        <FullScreenModal
          isOpen={!!editingItem}
          onClose={() => setEditingItem(null)}
        >
          <EditNotesMyNotes
            note={editingItem}
            onClose={() => setEditingItem(null)}
            onSave={(updatedItem) => {
              updateMyNotes(updatedItem);
              setEditingItem(null);
            }}
          />
        </FullScreenModal>
      )}
    </LinearGradient>
  );
}
