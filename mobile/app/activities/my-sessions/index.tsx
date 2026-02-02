import AppText from "@/components/AppText";
import {
  View,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useState } from "react";
import { FeedSkeleton } from "@/components/skeletetons";
import FeedFooter from "@/Features/feed/FeedFooter";
import FullScreenModal from "@/components/FullScreenModal";
import { LinearGradient } from "expo-linear-gradient";
import useMyActivitiesFeed from "@/Features/activities/hooks/useMyActivitiesFeed";
import FeedCard from "@/Features/feed-cards/FeedCard";
import { FeedItemUI } from "@/types/session";
import FeedHeader from "@/Features/feed/FeedHeader";
import useFullSessions from "@/Features/feed/hooks/useFullSessions";
import ActivitySession from "@/Features/activities/cards/activity-feed-expanded/activity";
import ActivitySessionEdit from "@/Features/activities/cards/activity-edit";
import useTogglePin from "@/Features/feed/hooks/useTogglePin";
import useDeleteSession from "@/Features/feed/hooks/useDeleteSession";
import useUpdateFeedItem from "@/Features/feed/hooks/useUpdateFeedItem";
import { useTranslation } from "react-i18next";

export default function MyActivitiesScreen() {
  const { t } = useTranslation("activities");
  const [expandedItem, setExpandedItem] = useState<FeedItemUI | null>(null);
  const [editingItem, setEditingItem] = useState<FeedItemUI | null>(null);
  const [refreshing, setRefreshing] = useState(false);

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
  } = useMyActivitiesFeed();

  // handle feedItem pin toggling
  const { togglePin } = useTogglePin(["myActivitySessions"]);

  // handle feedItem deletion
  const { handleDelete } = useDeleteSession();

  // handle feed item updates
  const { updateFeedItem } = useUpdateFeedItem(["myActivitySessions"]);

  const {
    activitySessionFull,
    activitySessionError,
    isLoadingActivitySession,
    refetchFullActivity,
  } = useFullSessions(expandedItem, editingItem);

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
          {t("activities.mySessions.loadError")}
        </AppText>
      ) : !data || (unpinnedFeed.length === 0 && pinnedFeed.length === 0) ? (
        <AppText className="text-center text-lg mt-20 mx-auto px-10">
          {t("activities.mySessions.noSessions")}
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
                    "activities",
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
              pinned_context="activities"
              queryKey={["myActivitySessions"]}
            />
          }
        />
      )}

      {expandedItem && (
        <FullScreenModal
          isOpen={!!expandedItem}
          onClose={() => setExpandedItem(null)}
        >
          {isLoadingActivitySession ? (
            <View className="gap-5 items-center justify-center mt-40 px-10">
              <AppText className="text-lg">
                {t("activities.mySessions.loadingDetails")}
              </AppText>
              <ActivityIndicator />
            </View>
          ) : activitySessionError ? (
            <AppText className="text-center text-xl mt-40 px-10">
              {t("activities.mySessions.loadDetailsError")}
            </AppText>
          ) : (
            activitySessionFull && <ActivitySession {...activitySessionFull} />
          )}
        </FullScreenModal>
      )}

      {editingItem && (
        <FullScreenModal
          isOpen={!!editingItem}
          onClose={() => setEditingItem(null)}
        >
          {isLoadingActivitySession ? (
            <View className="gap-5 items-center justify-center mt-40 px-10">
              <AppText className="text-lg">
                {t("activities.mySessions.loadingSession")}
              </AppText>
              <ActivityIndicator />
            </View>
          ) : activitySessionError ? (
            <AppText className="text-center text-xl mt-40 px-10">
              {t("activities.mySessions.loadDetailsError")}
            </AppText>
          ) : (
            activitySessionFull && (
              <ActivitySessionEdit
                activity={activitySessionFull}
                onClose={() => setEditingItem(null)}
                onSave={(updatedItem) => {
                  updateFeedItem(updatedItem);
                  refetchFullActivity();
                  setEditingItem(null);
                }}
              />
            )
          )}
        </FullScreenModal>
      )}
    </LinearGradient>
  );
}
