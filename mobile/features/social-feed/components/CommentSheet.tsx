import { useRef, useCallback, useMemo, useState, useEffect } from "react";
import { View, Keyboard, TextInput } from "react-native";
import BottomSheet, {
  BottomSheetFlatList,
  BottomSheetBackdrop,
} from "@gorhom/bottom-sheet";
import { KeyboardStickyView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppText from "@/components/AppText";
import AnimatedButton from "@/components/buttons/animatedButton";
import { X, SendHorizonal } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import useFeedComments from "@/features/social-feed/hooks/useFeedComments";
import useAddComment from "@/features/social-feed/hooks/useAddComment";
import useDeleteComment from "@/features/social-feed/hooks/useDeleteComment";
import CommentItem from "@/features/social-feed/components/CommentItem";
import { FeedComment } from "@/types/social-feed";
import { supabase } from "@/lib/supabase";
import { BottomSheetFlatListMethods } from "@gorhom/bottom-sheet";

type ReplyState = {
  parentId: string;
  authorName: string;
} | null;

type CommentSheetProps = {
  feedItemId: string | null;
  onClose: () => void;
};

export default function CommentSheet({ feedItemId, onClose }: CommentSheetProps) {
  const { t } = useTranslation("social");
  const bottomSheetRef = useRef<BottomSheet>(null);
  const flatListRef = useRef<BottomSheetFlatListMethods>(null);
  const insets = useSafeAreaInsets();
  const snapPoints = useMemo(() => ["50%", "90%"], []);
  const keyboardVisibleRef = useRef(false);
  const feedItemIdRef = useRef(feedItemId);
  feedItemIdRef.current = feedItemId;

  const [inputText, setInputText] = useState("");
  const [replyingTo, setReplyingTo] = useState<ReplyState>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const { data: comments, isLoading } = useFeedComments(feedItemId);
  const { mutate: addComment } = useAddComment();
  const { mutate: deleteComment } = useDeleteComment();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUserId(session?.user?.id ?? null);
    });
  }, []);

  // Track keyboard visibility and snap sheet
  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", () => {
      keyboardVisibleRef.current = true;
      if (feedItemIdRef.current) {
        bottomSheetRef.current?.snapToIndex(1);
      }
    });
    const hideSub = Keyboard.addListener("keyboardDidHide", () => {
      keyboardVisibleRef.current = false;
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const handleClose = useCallback(() => {
    setInputText("");
    setReplyingTo(null);
    Keyboard.dismiss();
    onClose();
  }, [onClose]);

  // If user swipes down while keyboard is open, close the sheet entirely
  const handleSheetChange = useCallback(
    (index: number) => {
      if (index === 0 && keyboardVisibleRef.current) {
        Keyboard.dismiss();
        bottomSheetRef.current?.close();
      }
    },
    [],
  );

  const handleSend = useCallback(() => {
    if (!feedItemId || !inputText.trim()) return;

    addComment({
      feedItemId,
      content: inputText.trim(),
      parentId: replyingTo?.parentId ?? null,
    });

    setInputText("");
    setReplyingTo(null);
    Keyboard.dismiss();

    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [feedItemId, inputText, replyingTo, addComment]);

  const handleReply = useCallback((comment: FeedComment) => {
    setReplyingTo({
      parentId: comment.id,
      authorName: comment.author_display_name,
    });
  }, []);

  const handleDelete = useCallback(
    (commentId: string) => {
      if (!feedItemId) return;
      deleteComment({ commentId, feedItemId });
    },
    [feedItemId, deleteComment],
  );

  const renderBackdrop = useCallback(
    (props: React.ComponentProps<typeof BottomSheetBackdrop>) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
        pressBehavior="close"
      />
    ),
    [],
  );

  const commentCount = comments?.length ?? 0;
  const sheetIndex = feedItemId ? 0 : -1;

  const listHeader = useCallback(
    () => (
      <View className="px-4 py-3 border-b border-slate-700/50">
        <AppText className="text-base font-semibold">
          {t("social.comments")} {commentCount > 0 && `(${commentCount})`}
        </AppText>
      </View>
    ),
    [commentCount, t],
  );

  const listEmpty = useCallback(
    () => (
      <View className="items-center justify-center py-10">
        <AppText className="text-slate-500">
          {isLoading ? `${t("social.comments")}...` : t("social.noComments")}
        </AppText>
      </View>
    ),
    [isLoading, t],
  );

  return (
    <>
      <BottomSheet
        ref={bottomSheetRef}
        index={sheetIndex}
        snapPoints={snapPoints}
        onClose={handleClose}
        onChange={handleSheetChange}
        backdropComponent={renderBackdrop}
        enablePanDownToClose
        enableDynamicSizing={false}
        backgroundStyle={{ backgroundColor: "#0f172a" }}
        handleIndicatorStyle={{ backgroundColor: "#475569" }}
        containerStyle={{ zIndex: 100 }}
      >
        <BottomSheetFlatList
          ref={flatListRef}
          data={comments ?? []}
          keyExtractor={(item: FeedComment) => item.id}
          renderItem={({ item }: { item: FeedComment }) => (
            <CommentItem
              comment={item}
              isOwnComment={item.user_id === currentUserId}
              onDelete={() => handleDelete(item.id)}
              onReply={() => handleReply(item)}
            />
          )}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={listEmpty}
          contentContainerStyle={{ paddingBottom: 80 }}
        />
      </BottomSheet>

      {feedItemId && (
        <KeyboardStickyView offset={{ opened: insets.bottom }} style={{ zIndex: 200 }}>
          <View style={{ backgroundColor: "#0f172a" }}>
            {replyingTo && (
              <View className="flex-row items-center justify-between px-4 py-2 bg-slate-800/50 border-t border-slate-700/50">
                <AppText className="text-xs text-slate-400">
                  {t("social.replyingTo", { name: replyingTo.authorName })}
                </AppText>
                <AnimatedButton onPress={() => setReplyingTo(null)} hitSlop={8}>
                  <X size={16} color="#94a3b8" />
                </AnimatedButton>
              </View>
            )}
            <View className="flex-row items-center gap-2 px-4 py-3 border-t border-slate-700/50">
              <TextInput
                value={inputText}
                onChangeText={setInputText}
                placeholder={t("social.addComment")}
                placeholderTextColor="#64748b"
                maxLength={500}
                multiline
                style={{
                  flex: 1,
                  color: "#e2e8f0",
                  fontSize: 14,
                  maxHeight: 80,
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  backgroundColor: "#1e293b",
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: "#334155",
                }}
              />
              <AnimatedButton
                onPress={handleSend}
                hitSlop={10}
                disabled={!inputText.trim()}
              >
                <SendHorizonal
                  size={22}
                  color={inputText.trim() ? "#3b82f6" : "#475569"}
                />
              </AnimatedButton>
            </View>
          </View>
        </KeyboardStickyView>
      )}
    </>
  );
}
