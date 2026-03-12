import { forwardRef } from "react";
import { Image, View } from "react-native";
import AppText from "@/components/AppText";
import { formatDurationLong, formatDateShort } from "@/lib/formatDate";
import {
  computeShareStats,
  getTopExercises,
  TopExercise,
} from "@/features/gym/lib/shareCardUtils";
import { ExerciseEntry } from "@/types/session";
import { useTranslation } from "react-i18next";
import { APP_NAME } from "@/lib/app-config";
import { ShareCardTheme, ShareCardSize } from "@/lib/share/themes";
import ThemedCardWrapper from "@/lib/components/share/ThemedCardWrapper";
import ThemedStatBox from "@/lib/components/share/ThemedStatBox";

type ShareCardProps = {
  title: string;
  date: string;
  duration: number;
  exercises: ExerciseEntry[];
  weightUnit: string;
  theme: ShareCardTheme;
  size: ShareCardSize;
};

const ShareCard = forwardRef<View, ShareCardProps>(
  ({ title, date, duration, exercises, weightUnit, theme, size }, ref) => {
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
      return `${ex.weight} ${weightUnit} × ${ex.reps}`;
    };

    const { colors } = theme;

    if (size === "wide") {
      return (
        <ThemedCardWrapper ref={ref} theme={theme} size={size}>
          {/* Header - App branding */}
          <View className="flex-row items-center gap-4">
            <Image
              source={require("@/assets/images/android-chrome-192x192.png")}
              className="w-[64px] h-[64px] rounded-lg"
            />
            <AppText
              className="text-[36px]"
              style={{ color: colors.accent }}
            >
              {APP_NAME}
            </AppText>
          </View>

          {/* Title + Date centered */}
          <View className="items-center gap-3">
            <AppText
              className="text-[56px] text-center"
              style={{ color: colors.textPrimary }}
              numberOfLines={2}
            >
              {title}
            </AppText>
            <AppText
              className="text-[32px]"
              style={{ color: colors.textMuted }}
            >
              {formatDateShort(date)}
            </AppText>
          </View>

          {/* Stats + Exercises side by side */}
          <View className="flex-row gap-[40px]">
            {/* Left: 2x2 Stat Grid */}
            <View className="flex-1 gap-4">
              <View className="flex-row gap-4">
                <View className="flex-1">
                  <ThemedStatBox
                    label={t("gym.share.duration")}
                    value={formatDurationLong(duration)}
                    theme={theme}
                  />
                </View>
                <View className="flex-1">
                  <ThemedStatBox
                    label={t("gym.share.volume")}
                    value={formatVolume(stats.totalVolume)}
                    theme={theme}
                  />
                </View>
              </View>
              <View className="flex-row gap-4">
                <View className="flex-1">
                  <ThemedStatBox
                    label={t("gym.share.exercises")}
                    value={String(stats.exerciseCount)}
                    theme={theme}
                  />
                </View>
                <View className="flex-1">
                  <ThemedStatBox
                    label={t("gym.share.sets")}
                    value={String(stats.totalSets)}
                    theme={theme}
                  />
                </View>
              </View>
            </View>

            {/* Right: Top exercises */}
            <View className="flex-1 justify-center gap-3">
              {topExercises.map((ex, i) => (
                <View key={i} className="flex-row justify-between items-center">
                  <View className="flex-1 mr-4">
                    <AppText
                      className="text-[30px]"
                      style={{ color: colors.textSecondary }}
                      numberOfLines={1}
                    >
                      {ex.name}
                    </AppText>
                    <AppText
                      className="text-[22px]"
                      style={{ color: colors.textMuted }}
                    >
                      {t(`gym.equipment.${ex.equipment?.toLowerCase()}`)}
                    </AppText>
                  </View>
                  <AppText
                    className="text-[30px]"
                    style={{ color: colors.textMuted }}
                  >
                    {formatTopSet(ex)}
                  </AppText>
                </View>
              ))}
            </View>
          </View>

          {/* Footer watermark */}
          <View className="items-center">
            <AppText
              className="text-[28px]"
              style={{ color: colors.textMuted, opacity: 0.5 }}
            >
              {APP_NAME}
            </AppText>
          </View>
        </ThemedCardWrapper>
      );
    }

    const isStory = size === "story";

    return (
      <ThemedCardWrapper ref={ref} theme={theme} size={size}>
        {/* Header - App branding */}
        <View className="flex-row items-center gap-4">
          <Image
            source={require("@/assets/images/android-chrome-192x192.png")}
            style={{ width: isStory ? 80 : 64, height: isStory ? 80 : 64, borderRadius: 8 }}
          />
          <AppText
            style={{ fontSize: isStory ? 44 : 36, color: colors.accent }}
          >
            {APP_NAME}
          </AppText>
        </View>

        {/* Title + Date */}
        <View className="items-center gap-3">
          <AppText
            className="text-center"
            style={{ fontSize: isStory ? 68 : 52, color: colors.textPrimary }}
            numberOfLines={2}
          >
            {title}
          </AppText>
          <AppText
            style={{ fontSize: isStory ? 40 : 32, color: colors.textMuted }}
          >
            {formatDateShort(date)}
          </AppText>
        </View>

        {/* 2x2 Stat Grid */}
        <View className="gap-4">
          <View className="flex-row gap-4">
            <View className="flex-1">
              <ThemedStatBox
                label={t("gym.share.duration")}
                value={formatDurationLong(duration)}
                theme={theme}
                size={isStory ? "large" : "normal"}
              />
            </View>
            <View className="flex-1">
              <ThemedStatBox
                label={t("gym.share.volume")}
                value={formatVolume(stats.totalVolume)}
                theme={theme}
                size={isStory ? "large" : "normal"}
              />
            </View>
          </View>
          <View className="flex-row gap-4">
            <View className="flex-1">
              <ThemedStatBox
                label={t("gym.share.exercises")}
                value={String(stats.exerciseCount)}
                theme={theme}
                size={isStory ? "large" : "normal"}
              />
            </View>
            <View className="flex-1">
              <ThemedStatBox
                label={t("gym.share.sets")}
                value={String(stats.totalSets)}
                theme={theme}
                size={isStory ? "large" : "normal"}
              />
            </View>
          </View>
        </View>

        {/* Top Exercises */}
        <View className="gap-3">
          {topExercises.map((ex, i) => (
            <View key={i} className="flex-row justify-between items-center">
              <View className="flex-1 mr-4">
                <AppText
                  style={{ fontSize: isStory ? 36 : 28, color: colors.textSecondary }}
                  numberOfLines={1}
                >
                  {ex.name}
                </AppText>
                <AppText
                  style={{ fontSize: isStory ? 26 : 20, color: colors.textMuted }}
                >
                  {t(`gym.equipment.${ex.equipment?.toLowerCase()}`)}
                </AppText>
              </View>
              <AppText
                style={{ fontSize: isStory ? 36 : 28, color: colors.textMuted }}
              >
                {formatTopSet(ex)}
              </AppText>
            </View>
          ))}
        </View>

        {/* Footer watermark */}
        <View className="items-center">
          <AppText
            style={{ fontSize: isStory ? 34 : 28, color: colors.textMuted, opacity: 0.5 }}
          >
            {APP_NAME}
          </AppText>
        </View>
      </ThemedCardWrapper>
    );
  },
);

ShareCard.displayName = "ShareCard";

export default ShareCard;
