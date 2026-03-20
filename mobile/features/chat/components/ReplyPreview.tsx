import { memo } from "react";
import { View } from "react-native";
import { useTranslation } from "react-i18next";
import AnimatedButton from "@/components/buttons/animatedButton";
import BodyTextNC from "@/components/BodyTextNC";
import AppTextNC from "@/components/AppTextNC";
import { MessageType } from "@/types/chat";

type ReplyPreviewProps = {
  senderName: string | null;
  content: string | null;
  messageType: MessageType | null;
  isDeleted: boolean;
  isOwn: boolean;
  onPress: () => void;
};

function getReplyContent(
  content: string | null,
  messageType: MessageType | null,
  isDeleted: boolean,
  t: (key: string) => string,
): string {
  if (isDeleted) return t("chat.messageDeleted");
  if (messageType === "image") return t("chat.photo");
  if (messageType === "video") return t("chat.video");
  if (messageType === "voice") return t("chat.voiceMessage");
  return content ?? "";
}

function ReplyPreview({
  senderName,
  content,
  messageType,
  isDeleted,
  isOwn,
  onPress,
}: ReplyPreviewProps) {
  const { t } = useTranslation("chat");
  const displayContent = getReplyContent(content, messageType, isDeleted, t);

  return (
    <AnimatedButton onPress={onPress} className="mb-1">
      <View
        className={`flex-row rounded-lg overflow-hidden min-w-[180px] ${
          isOwn ? "bg-cyan-900/40" : "bg-slate-600/40"
        }`}
      >
        <View className="w-1 bg-cyan-400" />
        <View className="px-2 py-1.5 flex-1">
          {senderName && (
            <AppTextNC className="text-[11px] text-cyan-300" numberOfLines={1}>
              {senderName}
            </AppTextNC>
          )}
          <BodyTextNC
            className={`text-xs ${isDeleted ? "italic text-slate-400" : "text-slate-300"}`}
            numberOfLines={2}
          >
            {displayContent}
          </BodyTextNC>
        </View>
      </View>
    </AnimatedButton>
  );
}

export default memo(ReplyPreview);
