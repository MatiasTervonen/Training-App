import { View } from "react-native";
import { useTranslation } from "react-i18next";
import { Reply, Copy, Forward, Trash2 } from "lucide-react-native";
import AppText from "@/components/AppText";
import AnimatedButton from "@/components/buttons/animatedButton";
import { ChatMessage } from "@/types/chat";

const QUICK_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🔥"];

type MessageToolbarProps = {
  message: ChatMessage;
  isOwn: boolean;
  onReply: () => void;
  onCopy: () => void;
  onForward: () => void;
  onDelete: () => void;
  onReaction: (emoji: string) => void;
};

export default function MessageToolbar({
  message,
  isOwn,
  onReply,
  onCopy,
  onForward,
  onDelete,
  onReaction,
}: MessageToolbarProps) {
  const { t } = useTranslation("chat");
  const isDeleted = !!message.deleted_at;
  const isText = message.message_type === "text";

  return (
    <View className={`my-1.5 px-4 ${isOwn ? "items-end" : "items-start"}`}>
      <View className="bg-slate-800 rounded-2xl border border-slate-600 px-3 py-2.5">
        {/* Quick reactions */}
        {!isDeleted && (
          <>
            <View className="flex-row gap-2">
              {QUICK_EMOJIS.map((emoji) => (
                <AnimatedButton
                  key={emoji}
                  onPress={() => onReaction(emoji)}
                  className="w-10 h-10 rounded-full bg-slate-700 items-center justify-center"
                >
                  <AppText className="text-xl">{emoji}</AppText>
                </AnimatedButton>
              ))}
            </View>

            <View className="h-[1px] bg-slate-600 my-2.5" />
          </>
        )}

        {/* Action buttons */}
        <View className="flex-row gap-6 justify-center">
          {!isDeleted && (
            <AnimatedButton
              onPress={onReply}
              className="items-center gap-1"
            >
              <Reply color="#94a3b8" size={22} />
              <AppText className="text-[11px] text-slate-400">
                {t("chat.reply")}
              </AppText>
            </AnimatedButton>
          )}

          {!isDeleted && isText && (
            <AnimatedButton
              onPress={onCopy}
              className="items-center gap-1"
            >
              <Copy color="#94a3b8" size={22} />
              <AppText className="text-[11px] text-slate-400">
                {t("chat.copy")}
              </AppText>
            </AnimatedButton>
          )}

          {!isDeleted && (
            <AnimatedButton
              onPress={onForward}
              className="items-center gap-1"
            >
              <Forward color="#94a3b8" size={22} />
              <AppText className="text-[11px] text-slate-400">
                {t("chat.forward")}
              </AppText>
            </AnimatedButton>
          )}

          {isOwn && !isDeleted && (
            <AnimatedButton
              onPress={onDelete}
              className="items-center gap-1"
            >
              <Trash2 color="#ef4444" size={22} />
              <AppText className="text-[11px] text-red-400">
                {t("chat.delete")}
              </AppText>
            </AnimatedButton>
          )}
        </View>
      </View>
    </View>
  );
}
