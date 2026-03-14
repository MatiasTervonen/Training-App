import AppText from "@/components/AppText";
import AppTextNC from "@/components/AppTextNC";
import {
  View,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useState, useMemo } from "react";
import { useRouter } from "expo-router";
import { FeedSkeleton } from "@/components/skeletetons";
import FeedFooter from "@/features/feed/FeedFooter";
import FullScreenModal from "@/components/FullScreenModal";
import { LinearGradient } from "expo-linear-gradient";
import useMyTodoFeed from "@/features/todo/hooks/useMyTodoFeed";
import FeedCard from "@/features/feed-cards/FeedCard";
import { FeedItemUI, FeedData } from "@/types/session";
import FeedHeader from "@/features/feed/FeedHeader";
import useFullSessions from "@/features/feed/hooks/useFullSessions";
import TodoSession from "@/features/todo/cards/todo-expanded";
import EditTodo from "@/features/todo/cards/todo-edit";
import useTogglePin from "@/features/feed/hooks/useTogglePin";
import useDeleteSession from "@/features/feed/hooks/useDeleteSession";
import useUpdateFeedItem from "@/features/feed/hooks/useUpdateFeedItem";
import { useTranslation } from "react-i18next";
import AnimatedButton from "@/components/buttons/animatedButton";
import { Plus, ClipboardList } from "lucide-react-native";
import type { TodoFilter } from "@/database/todo/get-todo-sessions";

type TodoExtraFields = { completed?: number; total?: number } | null;

const FILTERS: TodoFilter[] = ["active", "completed", "all"];

export default function TodoScreen() {
  const { t } = useTranslation("todo");
  const router = useRouter();
  const [expandedItem, setExpandedItem] = useState<FeedItemUI | null>(null);
  const [editingItem, setEditingItem] = useState<FeedItemUI | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [hasUnsavedExpandedChanges, setHasUnsavedExpandedChanges] =
    useState(false);
  const [filter, setFilter] = useState<TodoFilter>("active");

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
  } = useMyTodoFeed(filter);

  const { togglePin } = useTogglePin(queryKey);
  const { handleDelete } = useDeleteSession();
  const { updateFeedItem } = useUpdateFeedItem(queryKey);

  const {
    todoSessionFull,
    todoSessionError,
    isLoadingTodoSession,
    refetchFullTodo,
    todoMediaFull,
    refetchFullTodoMedia,
  } = useFullSessions(expandedItem, editingItem);

  const handleSave = (updatedItem: FeedItemUI) => {
    updateFeedItem(updatedItem);
  };

  // Pinned items come unfiltered from the query — filter them client-side
  const filteredPinned = useMemo(() => {
    if (filter === "all") return pinnedFeed;
    return pinnedFeed.filter((item) => {
      const extra = item.extra_fields as TodoExtraFields;
      const completed = extra?.completed ?? 0;
      const total = extra?.total ?? 0;
      if (filter === "active") return completed < total;
      return total > 0 && completed === total;
    });
  }, [pinnedFeed, filter]);

  const getEmptyMessage = () => {
    if (filter === "active") return t("todo.noActiveTodoLists");
    if (filter === "completed") return t("todo.noCompletedTodoLists");
    return t("todo.noTodoLists");
  };

  const getEmptyDescription = () => {
    if (filter === "active") return t("todo.noActiveTodoListsDesc");
    if (filter === "completed") return t("todo.noCompletedTodoListsDesc");
    return t("todo.noTodoListsDesc");
  };

  const filterTabs = (
    <View className="mt-3 mb-1 mx-4 bg-slate-800 rounded-lg">
      <View className="flex-row p-1 gap-2">
        {FILTERS.map((f) => {
          const isActive = filter === f;
          return (
            <AnimatedButton
              key={f}
              onPress={() => setFilter(f)}
              className={`flex-1 py-2 px-3 rounded-md ${isActive ? "bg-slate-700" : ""}`}
            >
              <AppTextNC
                className={`text-center font-medium ${
                  isActive ? "text-cyan-400" : "text-gray-200"
                }`}
              >
                {t(`todo.filter.${f}`)}
              </AppTextNC>
            </AnimatedButton>
          );
        })}
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
      {filterTabs}
      {isLoading ? (
        <FeedSkeleton count={5} />
      ) : error ? (
        <AppText className="text-center text-lg mt-20 mx-auto px-10">
          {t("todo.failedToLoad")}
        </AppText>
      ) : !data ||
        (unpinnedFeed.length === 0 && filteredPinned.length === 0) ? (
        <View className="flex-1 items-center mt-[30%] px-8">
          <View className="items-center">
            <View className="w-20 h-20 rounded-full bg-slate-800 border border-slate-700 items-center justify-center mb-5">
              <ClipboardList size={36} color="#94a3b8" />
            </View>
            <AppText className="text-xl text-center mb-3">
              {getEmptyMessage()}
            </AppText>
            <AppText className="text-sm text-gray-400 text-center leading-5">
              {getEmptyDescription()}
            </AppText>
          </View>
        </View>
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
                    "todo",
                  )
                }
                onDelete={() => {
                  handleDelete(feedItem.source_id, feedItem.type, queryKey);
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
              data={data as FeedData}
            />
          }
          ListHeaderComponent={
            <View className={filteredPinned.length === 0 ? "mb-4" : ""}>
              <FeedHeader
                pinnedFeed={filteredPinned}
                setExpandedItem={setExpandedItem}
                setEditingItem={setEditingItem}
                pinned_context="todo"
                queryKey={queryKey}
              />
            </View>
          }
        />
      )}

      <View className="absolute bottom-8 right-6">
        <View className="absolute -inset-1 rounded-full bg-cyan-400/30" />
        <View className="absolute -inset-3 rounded-full bg-cyan-400/15" />
        <View className="absolute -inset-5 rounded-full bg-cyan-400/5" />
        <AnimatedButton
          onPress={() => router.push("/todo/create-todo")}
          className="w-14 h-14 rounded-full bg-slate-800 items-center justify-center shadow-xl shadow-cyan-400/60 border-2 border-cyan-300"
        >
          <Plus size={30} color="#67e8f9" />
        </AnimatedButton>
      </View>

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
                taskMedia={todoMediaFull}
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
                  refetchFullTodoMedia();
                  setHasUnsavedChanges(false);
                  setEditingItem(null);
                }}
                onDirtyChange={setHasUnsavedChanges}
                taskMedia={todoMediaFull}
              />
            )
          )}
        </FullScreenModal>
      )}
    </LinearGradient>
  );
}
