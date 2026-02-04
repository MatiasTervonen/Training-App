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
import useMyGymFeed from "@/features/gym/hooks/useMyGymFeed";
import FeedCard from "@/features/feed-cards/FeedCard";
import { FeedItemUI } from "@/types/session";
import { useRouter } from "expo-router";
import FeedHeader from "@/features/feed/FeedHeader";
import useFullSessions from "@/features/feed/hooks/useFullSessions";
import GymSession from "@/features/gym/cards/gym-expanded";
import useTogglePin from "@/features/feed/hooks/useTogglePin";
import useDeleteSession from "@/features/feed/hooks/useDeleteSession";
import { useTranslation } from "react-i18next";

export default function MyGymScreen() {
  const { t } = useTranslation("gym");
  const [expandedItem, setExpandedItem] = useState<FeedItemUI | null>(null);
  const [editingItem, setEditingItem] = useState<FeedItemUI | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const router = useRouter();

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
  } = useMyGymFeed();

  // handle feedItem pin toggling

  const { togglePin } = useTogglePin(["myGymSessions"]);

  // handle feedItem deletion

  const { handleDelete } = useDeleteSession();

  const { GymSessionFull, GymSessionError, isLoadingGymSession } =
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
        <AppText className="text-center text-lg mt-20 mx-auto px-10">
          {t("gym.mySessions.loadError")}
        </AppText>
      ) : !data || (unpinnedFeed.length === 0 && pinnedFeed.length === 0) ? (
        <AppText className="text-center text-lg mt-20 mx-auto px-10">
          {t("gym.mySessions.noSessions")}
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
                    "gym",
                  )
                }
                onDelete={() => {
                  handleDelete(feedItem.source_id, feedItem.type);
                }}
                onEdit={() => {
                  router.push(`/gym/gym/${feedItem.source_id}` as any);
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
              pinned_context="gym"
              queryKey={["myGymSessions"]}
            />
          }
        />
      )}

      {expandedItem && (
        <FullScreenModal
          isOpen={!!expandedItem}
          onClose={() => setExpandedItem(null)}
        >
          {isLoadingGymSession ? (
            <View className="gap-5 items-center justify-center mt-40 px-10">
              <AppText className="text-lg">
                {t("gym.mySessions.loadingDetails")}
              </AppText>
              <ActivityIndicator />
            </View>
          ) : GymSessionError ? (
            <AppText className="text-center text-xl mt-40 px-10">
              {t("gym.mySessions.loadDetailsError")}
            </AppText>
          ) : (
            GymSessionFull && <GymSession {...GymSessionFull} />
          )}
        </FullScreenModal>
      )}
    </LinearGradient>
  );
}
