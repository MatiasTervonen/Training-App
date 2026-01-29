import PinnedCarousel from "./PinnedCarousel";
import { Dimensions } from "react-native";
import { FeedItemUI } from "@/types/session";
import { useRouter } from "expo-router";
import useTogglePin from "@/Features/feed/hooks/useTogglePin";
import useDeleteSession from "@/Features/feed/hooks/useDeleteSession";

export default function FeedHeader({
  pinnedFeed,
  setExpandedItem,
  setEditingItem,
  pinned_context,
  queryKey = ["feed"],
}: {
  pinnedFeed: FeedItemUI[];
  setExpandedItem: (item: FeedItemUI) => void;
  setEditingItem: (item: FeedItemUI) => void;
  pinned_context: string;
  queryKey?: string[];
}) {
  const width = Dimensions.get("window").width;
  const router = useRouter();
  const { togglePin } = useTogglePin(queryKey);
  const { handleDelete } = useDeleteSession();

  return (
    <>
      {pinnedFeed.length > 0 && (
        <PinnedCarousel
          pinnedFeed={pinnedFeed}
          width={width}
          height={194.2}
          onExpand={setExpandedItem}
          onEdit={(feedItem) => {
            if (feedItem.type === "gym_sessions") {
              router.push(`/gym/gym/${feedItem.source_id}`);
            } else {
              setEditingItem(feedItem);
            }
          }}
          onTogglePin={(item) =>
            togglePin(item.id, item.type, item.feed_context, pinned_context)
          }
          onDelete={(item) => handleDelete(item.source_id, item.type)}
        />
      )}
    </>
  );
}
