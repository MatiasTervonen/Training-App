import { formatDate } from "@/lib/formatDate";
import { useUserStore } from "@/lib/stores/useUserStore";
import { View, ActivityIndicator, ScrollView } from "react-native";
import AppText from "@/components/AppText";
import BodyText from "@/components/BodyText";
import PageContainer from "@/components/PageContainer";
import LinkButton from "@/components/buttons/LinkButton";
import { FeedItemUI } from "@/types/session";
import { useQuery } from "@tanstack/react-query";
import { getWeight } from "@/database/weight/get-weight";
import WeightFeedChart from "@/features/weight/WeightFeedChart";
import { ChartNoAxesCombined } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { FullWeightSession } from "@/database/weight/get-full-weight";
import DraftImageItem from "@/features/notes/components/DraftImageItem";
import DraftVideoItem from "@/features/notes/components/DraftVideoItem";
import { DraftRecordingItem } from "@/features/notes/components/draftRecording";
import ImageViewerModal from "@/features/notes/components/ImageViewerModal";
import { NotesVoiceSkeleton } from "@/components/skeletetons";
import { useState } from "react";

type weightPayload = {
  weight: number;
  notes: string;
  "image-count"?: number;
  "video-count"?: number;
  "voice-count"?: number;
};

type WeightSessionProps = {
  weightMedia?: FullWeightSession | null;
  isLoadingMedia?: boolean;
  mediaError?: unknown;
} & FeedItemUI;

export default function WeightSession({
  weightMedia,
  isLoadingMedia,
  mediaError,
  ...weight
}: WeightSessionProps) {
  const { t } = useTranslation("weight");
  const [viewerIndex, setViewerIndex] = useState(-1);
  const payload = weight.extra_fields as weightPayload;
  const imageCount = payload["image-count"] ?? 0;
  const videoCount = payload["video-count"] ?? 0;
  const voiceCount = payload["voice-count"] ?? 0;
  const images = weightMedia?.images ?? [];
  const videos = weightMedia?.videos ?? [];

  const weightUnit =
    useUserStore((state) => state.profile?.weight_unit) || "kg";

  const {
    data: weightData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["get-weight"],
    queryFn: getWeight,
  });

  return (
  <>
    <ScrollView showsVerticalScrollIndicator={false}>
    <PageContainer>
      <AppText className="text-sm text-gray-400 text-center">
        {formatDate(weight.created_at!)}
      </AppText>
      <View className="justify-between flex-1">
        <View>
          <AppText className="my-5 text-2xl text-center break-words">
            {weight.title}
          </AppText>
          <View className="bg-slate-900 p-4 rounded-md shadow-md mt-5">
            <View className="flex flex-col">
              {payload.notes && (
                <BodyText className="mb-5 text-center">
                  {payload.notes}
                </BodyText>
              )}
              <AppText className="text-center text-xl">
                {payload.weight} {weightUnit}
              </AppText>
            </View>
          </View>

          {/* Images */}
          {imageCount > 0 && (
            <View className="mt-5">
              {isLoadingMedia ? (
                <NotesVoiceSkeleton count={imageCount} />
              ) : (
                images.map((image, idx) => (
                  <DraftImageItem
                    key={image.id}
                    uri={image.uri}
                    onPress={() => setViewerIndex(idx)}
                  />
                ))
              )}
            </View>
          )}

          {/* Videos */}
          {videoCount > 0 && (
            <View className="mt-3">
              {isLoadingMedia ? (
                <NotesVoiceSkeleton count={videoCount} />
              ) : (
                videos.map((video) => (
                  <DraftVideoItem
                    key={video.id}
                    uri={video.uri}
                    thumbnailUri={video.thumbnailUri}
                    durationMs={video.duration_ms ?? undefined}
                  />
                ))
              )}
            </View>
          )}

          {/* Voice Recordings */}
          {voiceCount > 0 && (
            <View className="mt-3">
              {isLoadingMedia ? (
                <NotesVoiceSkeleton count={voiceCount} />
              ) : mediaError ? (
                <AppText className="text-center text-red-500 mt-2">
                  {t("weight.mediaLoadError")}
                </AppText>
              ) : (
                weightMedia?.voiceRecordings.map((recording) => (
                  <DraftRecordingItem
                    key={recording.id}
                    uri={recording.uri}
                    durationMs={recording.duration_ms ?? undefined}
                  />
                ))
              )}
            </View>
          )}

          {isLoading ? (
            <View className="mt-5 bg-slate-900 shadow-md rounded-md p-4 h-[340px]">
              <View className="justify-center items-center flex-1">
                <ActivityIndicator size="large" color="#f3f4f6" />
              </View>
            </View>
          ) : error ? (
            <View className="mt-5 bg-slate-900 shadow-md rounded-md p-4 h-[340px]">
              <View className="justify-center items-center flex-1">
                <AppText className="text-red-500">
                  {t("weight.chartError")}
                </AppText>
              </View>
            </View>
          ) : (
            weightData &&
            weightData.length > 0 && (
              <View className="mt-5 bg-slate-900 shadow-md rounded-md">
                <WeightFeedChart data={weightData} />
              </View>
            )
          )}
        </View>
        <View className="my-10">
          <LinkButton label={t("weight.fullAnalytics")} href="/weight">
            <ChartNoAxesCombined color="#f3f4f6" className="ml-2" />
          </LinkButton>
        </View>
      </View>
    </PageContainer>
    </ScrollView>
    {images.length > 0 && viewerIndex >= 0 && (
      <ImageViewerModal
        images={images}
        initialIndex={viewerIndex}
        visible={viewerIndex >= 0}
        onClose={() => setViewerIndex(-1)}
      />
    )}
  </>
  );
}
