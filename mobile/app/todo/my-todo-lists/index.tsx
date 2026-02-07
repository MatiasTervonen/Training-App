import AppText from "@/components/AppText";
import {
  View,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useState } from "react";
import { FeedSkeleton } from "@/components/skeletetons";
import FeedFooter from "@/features/feed/FeedFooter";
import FullScreenModal from "@/components/FullScreenModal";
import { LinearGradient } from "expo-linear-gradient";
import useMyTodoFeed from "@/features/todo/hooks/useMyTodoFeed";
import FeedCard from "@/features/feed-cards/FeedCard";
import { FeedItemUI } from "@/types/session";
import FeedHeader from "@/features/feed/FeedHeader";
import useFullSessions from "@/features/feed/hooks/useFullSessions";
import TodoSession from "@/features/expand-session-cards/todo";
import EditTodo from "@/features/edit-session-cards/editTodo";
import useTogglePin from "@/features/feed/hooks/useTogglePin";
import useDeleteSession from "@/features/feed/hooks/useDeleteSession";
import useUpdateFeedItem from "@/features/feed/hooks/useUpdateFeedItem";
import { useTranslation } from "react-i18next";

export default function MyTodoListsScreen() {
  const { t } = useTranslation("todo");
  const [expandedItem, setExpandedItem] = useState<FeedItemUI | null>(null);
  const [editingItem, setEditingItem] = useState<FeedItemUI | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [hasUnsavedExpandedChanges, setHasUnsavedExpandedChanges] = useState(false);

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
  } = useMyTodoFeed();

  // handle feedItem pin toggling

  const { togglePin } = useTogglePin(["myTodoLists"]);

  // handle feedItem deletion

  const { handleDelete } = useDeleteSession();

  // handle feedItem update

  const { updateFeedItem } = useUpdateFeedItem(["myTodoLists"]);

  const {
    todoSessionFull,
    todoSessionError,
    isLoadingTodoSession,
    refetchFullTodo,
  } = useFullSessions(expandedItem, editingItem);

  const handleSave = (updatedItem: FeedItemUI) => {
    updateFeedItem(updatedItem);
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
        <AppText className="text-center text-lg mt-20 mx-auto px-10">
          {t("todo.failedToLoad")}
        </AppText>
      ) : !data || (unpinnedFeed.length === 0 && pinnedFeed.length === 0) ? (
        <AppText className="text-center text-lg mt-20 mx-auto px-10">
          {t("todo.noTodoLists")}
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
                    "todo",
                  )
                }
                onDelete={() => {
                  handleDelete(feedItem.source_id, feedItem.type);
                }}
                onEdit={() => {
                  setEditingItem({ ...feedItem, id: feedItem.source_id });
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
              pinned_context="todo"
              queryKey={["myTodoLists"]}
            />
          }
        />
      )}

      {expandedItem && (
        <FullScreenModal
          isOpen={!!expandedItem}
          onClose={() => {
            setHasUnsavedExpandedChanges(false);
            setExpandedItem(null);
          }}
          confirmBeforeClose={hasUnsavedExpandedChanges}
        >
          {isLoadingTodoSession ? (
            <View className="gap-5 items-center justify-center mt-40 px-10">
              <AppText className="text-lg">{t("todo.loadingDetails")}</AppText>
              <ActivityIndicator />
            </View>
          ) : todoSessionError ? (
            <AppText className="text-center text-xl mt-40 px-10">
              {t("todo.failedToLoadDetails")}
            </AppText>
          ) : (
            todoSessionFull && (
              <TodoSession
                initialTodo={todoSessionFull}
                onSave={(updatedItem) => {
                  handleSave(updatedItem);
                  setHasUnsavedExpandedChanges(false);
                }}
                onDirtyChange={setHasUnsavedExpandedChanges}
              />
            )
          )}
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
          {isLoadingTodoSession ? (
            <View className="gap-5 items-center justify-center mt-40 px-10">
              <AppText className="text-lg">{t("todo.loadingTodoList")}</AppText>
              <ActivityIndicator />
            </View>
          ) : todoSessionError ? (
            <AppText className="text-center text-xl mt-40 px-10">
              {t("todo.failedToLoadDetails")}
            </AppText>
          ) : (
            todoSessionFull && (
              <EditTodo
                todo_session={todoSessionFull}
                onClose={() => setEditingItem(null)}
                onSave={(updatedItem) => {
                  updateFeedItem(updatedItem);
                  refetchFullTodo();
                  setHasUnsavedChanges(false);
                  setEditingItem(null);
                }}
                onDirtyChange={setHasUnsavedChanges}
              />
            )
          )}
        </FullScreenModal>
      )}
    </LinearGradient>
  );
}
