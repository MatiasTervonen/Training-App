import { useRef, useState, useEffect, useCallback, ReactNode } from "react";
import { View, ScrollView, NativeSyntheticEvent, NativeScrollEvent, LayoutChangeEvent } from "react-native";
import { useFullScreenModalScroll } from "@/components/FullScreenModal";
import { supabase } from "@/lib/supabase";
import { FeedComment } from "@/types/social-feed";
import InlineCommentSection from "@/features/social-feed/components/InlineCommentSection";
import CommentInputBar from "@/features/social-feed/components/CommentInputBar";

type ReplyState = {
  parentId: string;
  authorName: string;
} | null;

type SocialExpandedContentProps = {
  feedItemId: string;
  scrollToComments: boolean;
  isLoadingSession: boolean;
  children: ReactNode;
};

export default function SocialExpandedContent({
  feedItemId,
  scrollToComments,
  isLoadingSession,
  children,
}: SocialExpandedContentProps) {
  const modalScroll = useFullScreenModalScroll();
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<ReplyState>(null);
  const commentsSectionY = useRef(0);
  const hasScrolledRef = useRef(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUserId(session?.user?.id ?? null);
    });
  }, []);

  const handleCommentsSectionLayout = useCallback(
    (e: LayoutChangeEvent) => {
      commentsSectionY.current = e.nativeEvent.layout.y;
      // Scroll after layout is measured, only once
      if (scrollToComments && !hasScrolledRef.current && !isLoadingSession) {
        hasScrolledRef.current = true;
        setTimeout(() => {
          scrollViewRef.current?.scrollTo({
            y: commentsSectionY.current,
            animated: true,
          });
        }, 100);
      }
    },
    [scrollToComments, isLoadingSession],
  );

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (modalScroll) {
        modalScroll.innerScrollY.value = e.nativeEvent.contentOffset.y;
      }
    },
    [modalScroll],
  );

  const handleReply = useCallback((comment: FeedComment) => {
    setReplyingTo({
      parentId: comment.id,
      authorName: comment.author_display_name,
    });
  }, []);

  const handleClearReply = useCallback(() => {
    setReplyingTo(null);
  }, []);

  const handleCommentAdded = useCallback(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 200);
  }, []);

  return (
    <View className="flex-1">
      <ScrollView
        ref={scrollViewRef}
        className="flex-1"
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingBottom: 80 }}
        keyboardShouldPersistTaps="handled"
      >
        {children}
        <View onLayout={handleCommentsSectionLayout}>
          <InlineCommentSection
            feedItemId={feedItemId}
            currentUserId={currentUserId}
            onReply={handleReply}
          />
        </View>
      </ScrollView>
      <CommentInputBar
        feedItemId={feedItemId}
        replyingTo={replyingTo}
        onClearReply={handleClearReply}
        onCommentAdded={handleCommentAdded}
      />
    </View>
  );
}
