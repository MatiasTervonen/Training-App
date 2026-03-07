import { forwardRef } from "react";
import { Image, View } from "react-native";
import AppText from "@/components/AppText";
import { LinearGradient } from "expo-linear-gradient";
import { formatDuration, formatDateShort, formatMeters } from "@/lib/formatDate";
import {
  computeShareStats,
  getTopExercises,
  TopExercise,
} from "@/features/gym/lib/shareCardUtils";
import { ExerciseEntry } from "@/types/session";
import { useTranslation } from "react-i18next";
import { APP_NAME } from "@/lib/app-config";

type ShareCardProps = {
  title: string;
  date: string;
  duration: number;
  exercises: ExerciseEntry[];
  weightUnit: string;
};

const ShareCard = forwardRef<View, ShareCardProps>(
  ({ title, date, duration, exercises, weightUnit }, ref) => {
    const { t } = useTranslation("gym");
    const stats = computeShareStats(exercises);
    const topExercises = getTopExercises(exercises);

    const formatVolume = (volume: number) => {
      if (volume >= 1000) {
        return `${(volume / 1000).toFixed(1)}t ${weightUnit}`;
      }
      return `${Math.round(volume)} ${weightUnit}`;
    };

    const formatTopSet = (ex: TopExercise) => {
      if (ex.isCardio) {
        const parts = [];
        if (ex.time_min) parts.push(`${ex.time_min} min`);
        if (ex.distance_meters) {
          parts.push(formatMeters(ex.distance_meters));
        }
        return parts.join(" / ") || "-";
      }
      return `${ex.weight} ${weightUnit} × ${ex.reps}`;
    };

    return (
      <View
        ref={ref}
        collapsable={false}
        className="w-[1080px] h-[1080px]"
      >
        <LinearGradient
          colors={["#1e3a8a", "#0f172a", "#0f172a"]}
          start={{ x: 0.8, y: 0 }}
          end={{ x: 0.2, y: 1 }}
          className="flex-1 p-[60px] justify-between"
        >
          {/* Header - App branding */}
          <View className="flex-row items-center gap-4">
            <Image
              source={require("@/assets/images/android-chrome-192x192.png")}
              className="w-[64px] h-[64px] rounded-lg"
            />
            <AppText className="text-[36px] text-blue-400">{APP_NAME}</AppText>
          </View>

          {/* Title + Date */}
          <View className="items-center gap-3 mt-[40px]">
            <AppText className="text-[52px] text-center" numberOfLines={2}>
              {title}
            </AppText>
            <AppText className="text-[32px] text-gray-400">
              {formatDateShort(date)}
            </AppText>
          </View>

          {/* 2x2 Stat Grid */}
          <View className="gap-4 mt-[40px]">
            <View className="flex-row gap-4">
              <StatBox
                label={t("gym.share.duration")}
                value={formatDuration(duration)}
              />
              <StatBox
                label={t("gym.share.volume")}
                value={formatVolume(stats.totalVolume)}
              />
            </View>
            <View className="flex-row gap-4">
              <StatBox
                label={t("gym.share.exercises")}
                value={String(stats.exerciseCount)}
              />
              <StatBox
                label={t("gym.share.sets")}
                value={String(stats.totalSets)}
              />
            </View>
          </View>

          {/* Top Exercises */}
          <View className="mt-[40px] gap-3">
            {topExercises.map((ex, i) => (
              <View key={i} className="flex-row justify-between items-center">
                <AppText
                  className="text-[28px] text-gray-200 flex-1 mr-4"
                  numberOfLines={1}
                >
                  {ex.name}
                </AppText>
                <AppText className="text-[28px] text-gray-400">
                  {formatTopSet(ex)}
                </AppText>
              </View>
            ))}
          </View>

          {/* Footer watermark */}
          <View className="items-center mt-[40px]">
            <AppText className="text-[28px] text-gray-600">{APP_NAME}</AppText>
          </View>
        </LinearGradient>
      </View>
    );
  },
);

ShareCard.displayName = "ShareCard";

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 items-center justify-center gap-2 border-blue-500 border rounded-lg bg-slate-950/50 py-[30px] px-[20px]">
      <AppText className="text-[24px] text-gray-300">{label}</AppText>
      <AppText className="text-[36px] text-gray-100">{value}</AppText>
    </View>
  );
}

export default ShareCard;
