import { View } from "react-native";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react-native";
import AnimatedButton from "@/components/buttons/animatedButton";
import BodyTextNC from "@/components/BodyTextNC";
import { ChatMessage } from "@/types/chat";

type ReplyInputBarProps = {
  message: ChatMessage;
  onDismiss: () => void;
};

export default function ReplyInputBar({ message, onDismiss }: ReplyInputBarProps) {
  const { t } = useTranslation("chat");

  const previewContent = (() => {
    if (message.message_type === "image") return t("chat.photo");
    if (message.message_type === "video") return t("chat.video");
    if (message.message_type === "voice") return t("chat.voiceMessage");
    if (message.message_type === "session_share") {
      try {
        const data = JSON.parse(message.content ?? "{}");
        return data.title ?? t("chat.sessionShare");
      } catch {
        return t("chat.sessionShare");
      }
    }
    if (message.message_type === "location") return t("chat.location");
    return message.content ?? "";
  })();

  return (
    <View className="flex-row items-center bg-slate-800 border-t border-slate-700 px-4 py-2 gap-3">
      <View className="w-1 h-10 bg-cyan-400 rounded-full" />
      <View className="flex-1">
        <BodyTextNC className="text-xs text-cyan-300 font-semibold" numberOfLines={1}>
          {t("chat.replyingTo", { name: message.sender_display_name })}
        </BodyTextNC>
        <BodyTextNC className="text-xs text-slate-400" numberOfLines={1}>
          {previewContent}
        </BodyTextNC>
      </View>
      <AnimatedButton onPress={onDismiss} className="p-1">
        <X color="#94a3b8" size={18} />
      </AnimatedButton>
    </View>
  );
}
