import { useState, useCallback } from "react";
import { View, TextInput, Keyboard } from "react-native";
import { KeyboardStickyView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AppText from "@/components/AppText";
import AnimatedButton from "@/components/buttons/animatedButton";
import { X, SendHorizonal } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import useAddComment from "@/features/social-feed/hooks/useAddComment";

type ReplyState = {
  parentId: string;
  authorName: string;
} | null;

type CommentInputBarProps = {
  feedItemId: string;
  replyingTo: ReplyState;
  onClearReply: () => void;
  onCommentAdded: () => void;
  onInputFocus: () => void;
};

export default function CommentInputBar({
  feedItemId,
  replyingTo,
  onClearReply,
  onCommentAdded,
  onInputFocus,
}: CommentInputBarProps) {
  const { t } = useTranslation("social");
  const insets = useSafeAreaInsets();
  const [inputText, setInputText] = useState("");
  const { mutate: addComment } = useAddComment();

  const handleSend = useCallback(() => {
    if (!inputText.trim()) return;

    addComment({
      feedItemId,
      content: inputText.trim(),
      parentId: replyingTo?.parentId ?? null,
    });

    setInputText("");
    onClearReply();
    Keyboard.dismiss();

    setTimeout(() => {
      onCommentAdded();
    }, 100);
  }, [feedItemId, inputText, replyingTo, addComment, onClearReply, onCommentAdded]);

  return (
    <KeyboardStickyView offset={{ opened: insets.bottom }}>
      <View style={{ backgroundColor: "#0f172a", marginHorizontal: -8 }}>
        {replyingTo && (
          <View className="flex-row items-center justify-between px-4 py-2 bg-slate-800/50 border-t border-slate-700/50">
            <AppText className="text-xs text-slate-400">
              {t("social.replyingTo", { name: replyingTo.authorName })}
            </AppText>
            <AnimatedButton onPress={onClearReply} hitSlop={8}>
              <X size={16} color="#94a3b8" />
            </AnimatedButton>
          </View>
        )}
        <View className="flex-row items-center gap-2 px-4 py-3 border-t border-slate-700/50">
          <TextInput
            value={inputText}
            onChangeText={setInputText}
            onFocus={onInputFocus}
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
  );
}
