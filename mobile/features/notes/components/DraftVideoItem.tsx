import { View, Image, Alert } from "react-native";
import AnimatedButton from "@/components/buttons/animatedButton";
import AppText from "@/components/AppText";
import { X, Play } from "lucide-react-native";
import { useState } from "react";
import VideoPlayerModal from "@/features/notes/components/VideoPlayerModal";
import { useTranslation } from "react-i18next";

type Props = {
  uri: string;
  thumbnailUri: string;
  durationMs?: number;
  onDelete?: () => void;
};

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export default function DraftVideoItem({
  uri,
  thumbnailUri,
  durationMs,
  onDelete,
}: Props) {
  const { t } = useTranslation("notes");
  const [playerVisible, setPlayerVisible] = useState(false);

  const handleDelete = () => {
    Alert.alert(
      t("notes.videos.deleteVideoTitle"),
      t("notes.videos.deleteVideoMessage"),
      [
        { text: t("notes.videos.cancel"), style: "cancel" },
        { text: t("notes.videos.delete"), style: "destructive", onPress: onDelete },
      ],
    );
  };

  return (
    <>
      <AnimatedButton
        onPress={() => setPlayerVisible(true)}
        className="relative mb-3 rounded-md overflow-hidden border-2 border-blue-500 bg-slate-950"
      >
        <Image
          source={{ uri: thumbnailUri }}
          className="w-full h-48"
          resizeMode="cover"
        />
        {/* Play icon overlay */}
        <View className="absolute inset-0 items-center justify-center">
          <View className="bg-black/50 rounded-full p-3">
            <Play color="white" size={28} fill="white" />
          </View>
        </View>
        {/* Duration badge */}
        {durationMs !== undefined && (
          <View className="absolute bottom-2 left-2 bg-black/70 rounded px-2 py-0.5">
            <AppText className="text-xs text-white">
              {formatDuration(durationMs)}
            </AppText>
          </View>
        )}
        {/* Delete button */}
        {onDelete && (
          <View className="absolute top-2 right-2">
            <AnimatedButton
              onPress={handleDelete}
              className="bg-red-800 border-red-500 border-2 rounded-full p-1"
            >
              <X color="white" size={18} />
            </AnimatedButton>
          </View>
        )}
      </AnimatedButton>

      <VideoPlayerModal
        uri={uri}
        visible={playerVisible}
        onClose={() => setPlayerVisible(false)}
      />
    </>
  );
}
