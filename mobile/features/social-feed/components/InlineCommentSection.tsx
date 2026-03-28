import { View, ActivityIndicator } from "react-native";
import AppText from "@/components/AppText";
import useFeedComments from "@/features/social-feed/hooks/useFeedComments";
import useDeleteComment from "@/features/social-feed/hooks/useDeleteComment";
import CommentItem from "@/features/social-feed/components/CommentItem";
import { FeedComment } from "@/types/social-feed";
import { useTranslation } from "react-i18next";

type InlineCommentSectionProps = {
  feedItemId: string;
  currentUserId: string | null;
  onReply: (comment: FeedComment) => void;
};

export default function InlineCommentSection({
  feedItemId,
  currentUserId,
  onReply,
}: InlineCommentSectionProps) {
  const { t } = useTranslation("social");
  const { data: comments, isLoading } = useFeedComments(feedItemId);
  const { mutate: deleteComment } = useDeleteComment();

  const handleDelete = (commentId: string) => {
    deleteComment({ commentId, feedItemId });
  };

  const commentCount = comments?.length ?? 0;

  return (
    <View className="border-t border-slate-700/50">
      <View className="px-4 py-3">
        <AppText className="text-base">
          {t("social.comments")} {commentCount > 0 && `(${commentCount})`}
        </AppText>
      </View>

      {isLoading ? (
        <View className="items-center justify-center py-10">
          <ActivityIndicator color="#94a3b8" />
        </View>
      ) : commentCount === 0 ? (
        <View className="items-center justify-center py-10">
          <AppText className="text-slate-500">
            {t("social.noComments")}
          </AppText>
        </View>
      ) : (
        comments?.map((comment: FeedComment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            isOwnComment={comment.user_id === currentUserId}
            onDelete={() => handleDelete(comment.id)}
            onReply={() => onReply(comment)}
          />
        ))
      )}
    </View>
  );
}
