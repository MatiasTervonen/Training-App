import { memo } from "react";
import { View, ActivityIndicator } from "react-native";
import { Image } from "expo-image";
import { X, Mic } from "lucide-react-native";
import BodyText from "@/components/BodyText";
import AnimatedButton from "@/components/buttons/animatedButton";
import { formatDurationNotesVoice } from "@/lib/formatDate";
import { useTranslation } from "react-i18next";
import { MessageType } from "@/types/chat";

type ChatMediaPreviewProps = {
  type: Exclude<MessageType, "text">;
  uri: string;
  thumbnailUri?: string;
  durationMs?: number;
  isCompressing?: boolean;
  onCancel: () => void;
};

function ChatMediaPreview({
  type,
  uri,
  thumbnailUri,
  durationMs,
  isCompressing,
  onCancel,
}: ChatMediaPreviewProps) {
  const { t } = useTranslation("chat");

  return (
    <View className="px-4 pt-2 pb-1 border-t border-slate-700 bg-slate-900">
      <View className="flex-row items-center gap-3">
        <AnimatedButton onPress={onCancel} hitSlop={8}>
          <X color="#94a3b8" size={20} />
        </AnimatedButton>

        {type === "image" && (
          <View className="w-16 h-16 rounded-lg overflow-hidden">
            {uri ? (
              <Image
                source={{ uri }}
                className="w-full h-full"
                contentFit="cover"
              />
            ) : (
              <View className="w-full h-full bg-slate-700 items-center justify-center">
                <ActivityIndicator color="#94a3b8" size="small" />
              </View>
            )}
          </View>
        )}

        {type === "video" && (
          <View className="flex-row items-center gap-2">
            <View className="w-16 h-16 rounded-lg overflow-hidden">
              {thumbnailUri || uri ? (
                <Image
                  source={{ uri: thumbnailUri ?? uri }}
                  className="w-full h-full"
                  contentFit="cover"
                />
              ) : (
                <View className="w-full h-full bg-slate-700 items-center justify-center">
                  <ActivityIndicator color="#94a3b8" size="small" />
                </View>
              )}
              {isCompressing && (
                <View className="absolute inset-0 bg-black/40 items-center justify-center">
                  <ActivityIndicator color="white" size="small" />
                </View>
              )}
            </View>
            {durationMs != null && (
              <BodyText className="text-sm">
                {formatDurationNotesVoice(durationMs)}
              </BodyText>
            )}
          </View>
        )}

        {type === "voice" && (
          <View className="flex-row items-center gap-2">
            <Mic color="#94a3b8" size={20} />
            <BodyText className="text-sm">
              {t("chat.mediaVoice")} {durationMs != null ? formatDurationNotesVoice(durationMs) : ""}
            </BodyText>
          </View>
        )}
      </View>
    </View>
  );
}

export default memo(ChatMediaPreview);
