import { ChevronRight, Trash2 } from "lucide-react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import AppText from "@/components/AppText";
import { weight } from "@/types/session";
import { View, Pressable } from "react-native";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { getFullWeightSession } from "@/database/weight/get-full-weight";
import DraftImageItem from "@/features/notes/components/DraftImageItem";
import DraftVideoItem from "@/features/notes/components/DraftVideoItem";
import { DraftRecordingItem } from "@/features/notes/components/draftRecording";
import ImageViewerModal from "@/features/notes/components/ImageViewerModal";


type RowAllDataProps = {
  item: weight;
  weightUnit: string;
  onDelete: (id: string) => void;
  onExpand: (id: string) => void;
  expanded: boolean;
};

export default function WeightRow({
  item,
  weightUnit,
  onDelete,
  onExpand,
  expanded,
}: RowAllDataProps) {
  const { t } = useTranslation("weight");
  const [viewerIndex, setViewerIndex] = useState(-1);
  const rotation = useSharedValue(0);

  const {
    data: weightMedia,
    isLoading: isLoadingMedia,
  } = useQuery({
    queryKey: ["fullWeightSession", item.id],
    queryFn: () => getFullWeightSession(item.id),
    enabled: expanded,
  });

  const images = weightMedia?.images ?? [];
  const videos = weightMedia?.videos ?? [];
  const voiceRecordings = weightMedia?.voiceRecordings ?? [];
  const hasMedia = images.length > 0 || videos.length > 0 || voiceRecordings.length > 0;

  useEffect(() => {
    rotation.value = withSpring(expanded ? 90 : 0);
  }, [expanded, rotation]);

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <View key={item.id}>
      <View className="border-b border-gray-700 px-4 py-3 bg-gray-900">
        <View className="flex-row justify-between items-center">
          <AppText className="text-base min-w-[70px]">
            {item.weight} {weightUnit}
          </AppText>
          <AppText className="text-gray-400">
            {new Date(item.created_at).toLocaleDateString()}
          </AppText>

          <Pressable
            onPress={() => {
              onExpand(item.id);
              rotation.value = withSpring(rotation.value === 0 ? 90 : 0);
            }}
            hitSlop={10}
          >
            <Animated.View style={[chevronStyle]}>
              <ChevronRight size={20} color="#f3f4f6" />
            </Animated.View>
          </Pressable>
        </View>
      </View>
      {expanded && (
        <View className="bg-gray-800 px-6 py-3">
          <View className="flex-row justify-between items-center">
            <AppText className="text-gray-300 flex-1 mr-3">
              {item.notes || t("weight.analyticsScreen.noNotes")}
            </AppText>
            <Pressable onPress={async () => onDelete(item.id)}>
              <Trash2 size={20} color="#d1d5db" />
            </Pressable>
          </View>

          {isLoadingMedia && item.has_media && (
            <View className="mt-3 items-center">
              <AppText className="text-gray-500 text-sm">{t("common:common.loading")}</AppText>
            </View>
          )}

          {!isLoadingMedia && hasMedia && (
            <View className="mt-3">
              {images.map((image, idx) => (
                <DraftImageItem
                  key={image.id}
                  uri={image.uri}
                  onPress={() => setViewerIndex(idx)}
                />
              ))}

              {videos.map((video) => (
                <DraftVideoItem
                  key={video.id}
                  uri={video.uri}
                  thumbnailUri={video.thumbnailUri}
                  durationMs={video.duration_ms ?? undefined}
                />
              ))}

              {voiceRecordings.map((recording) => (
                <DraftRecordingItem
                  key={recording.id}
                  uri={recording.uri}
                  durationMs={recording.duration_ms ?? undefined}
                />
              ))}
            </View>
          )}
        </View>
      )}
      {images.length > 0 && viewerIndex >= 0 && (
        <ImageViewerModal
          images={images}
          initialIndex={viewerIndex}
          visible={viewerIndex >= 0}
          onClose={() => setViewerIndex(-1)}
        />
      )}
    </View>
  );
}
