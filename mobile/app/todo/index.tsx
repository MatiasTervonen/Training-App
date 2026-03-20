import AppText from "@/components/AppText";
import BodyText from "@/components/BodyText";
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
import FloatingActionButton from "@/components/buttons/FloatingActionButton";
import { Plus, ClipboardList } from "lucide-react-native";
import type { TodoFilter } from "@/database/todo/get-todo-sessions";
import AppTextNC from "@/components/AppTextNC";

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
    <View className="mt-[6px] mb-1 mx-3 bg-slate-800 rounded-lg">
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
      <View className="absolute top-0 left-0 right-0 z-10">
        {filterTabs}
      </View>
      {isLoading ? (
        <FeedSkeleton count={5} subFeed />
      ) : error ? (
        <BodyText className="text-center text-lg mt-20 mx-auto px-10">
          {t("todo.failedToLoad")}
        </BodyText>
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
            <BodyText className="text-sm text-gray-400 text-center">
              {getEmptyDescription()}
            </BodyText>
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

      <FloatingActionButton onPress={() => router.push("/todo/create-todo")}>
        <Plus size={30} color="#06b6d4" />
      </FloatingActionButton>

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
              <BodyText className="text-lg">{t("todo.loadingDetails")}</BodyText>
              <ActivityIndicator />
            </View>
          ) : todoSessionError ? (
            <BodyText className="text-center text-xl mt-40 px-10">
              {t("todo.failedToLoadDetails")}
            </BodyText>
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
            refetchFullTodo();
            refetchFullTodoMedia();
            setEditingItem(null);
          }}
          confirmBeforeClose={hasUnsavedChanges}
        >
          {isLoadingTodoSession ? (
            <View className="gap-5 items-center justify-center mt-40 px-10">
              <BodyText className="text-lg">{t("todo.loadingTodoList")}</BodyText>
              <ActivityIndicator />
            </View>
          ) : todoSessionError ? (
            <BodyText className="text-center text-xl mt-40 px-10">
              {t("todo.failedToLoadDetails")}
            </BodyText>
          ) : (
            todoSessionFull && (
              <EditTodo
                todo_session={todoSessionFull}
                onClose={() => setEditingItem(null)}
                onSave={(updatedItem) => {
                  updateFeedItem(updatedItem);
                  refetchFullTodo();
                  refetchFullTodoMedia();
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
