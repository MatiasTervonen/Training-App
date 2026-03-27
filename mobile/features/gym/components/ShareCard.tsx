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
          {/* Logo fixed at top */}
          <View className="flex-row items-center gap-4" style={{ position: "absolute", top: 60, left: 60 }}>
            <Image
              source={require("@/assets/images/app-logos/kurvi_icon_ice_blue_rounded-converted-1024-1024.png")}
              style={{ width: 64, height: 64, borderRadius: 8 }}
            />
            <AppText style={{ fontSize: 36, color: colors.accent }}>
              {APP_NAME}
            </AppText>
          </View>

          {/* Title fixed at top center */}
          <View style={{ position: "absolute", top: 60, left: 0, right: 0, alignItems: "center", gap: 8 }}>
            <AppText
              style={{ fontSize: 56, color: colors.textPrimary, textAlign: "center" }}
              numberOfLines={2}
            >
              {title}
            </AppText>
            <AppText style={{ fontSize: 32, color: colors.textMuted }}>
              {formatDateShort(date)}
            </AppText>
          </View>

          {/* All content centered */}
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <View className="flex-row" style={{ gap: 80, alignItems: "center" }}>
              {/* Left: 2x2 Stat Grid */}
              <View className="flex-1" style={{ gap: 16 }}>
                <View className="flex-row" style={{ gap: 16 }}>
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
                <View className="flex-row" style={{ gap: 16 }}>
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
              <View className="flex-1" style={{ gap: 12 }}>
                <AppText style={{ fontSize: 28, color: colors.textPrimary, marginBottom: 16,  }}>
                  {t("gym.share.bestSets")}
                </AppText>
                {topExercises.map((ex, i) => (
                  <View key={i} className="flex-row justify-between items-center">
                    <View className="mr-4">
                      <AppText
                        style={{ fontSize: 30, color: colors.textSecondary }}
                        numberOfLines={1}
                      >
                        {ex.name}
                      </AppText>
                      <AppText
                        style={{ fontSize: 22, color: colors.textMuted }}
                      >
                        {t(`gym.equipment.${ex.equipment?.toLowerCase()}`)}
                      </AppText>
                    </View>
                    <AppText style={{ fontSize: 30, color: colors.textMuted }}>
                      {formatTopSet(ex)}
                    </AppText>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* URL bottom center */}
          <View style={{ position: "absolute", bottom: 30, left: 0, right: 0, alignItems: "center" }}>
            <AppText style={{ fontSize: 24, color: colors.textMuted, opacity: 0.5 }}>
              kurvi.io
            </AppText>
          </View>
        </ThemedCardWrapper>
      );
    }

    const isStory = size === "story";

    return (
      <ThemedCardWrapper ref={ref} theme={theme} size={size}>
        {/* Logo fixed at top — story pushed down to clear Instagram's UI overlay */}
        <View className="flex-row items-center gap-4" style={{ position: "absolute", top: isStory ? 200 : 60, left: 60 }}>
          <Image
            source={require("@/assets/images/app-logos/kurvi_icon_ice_blue_rounded-converted-1024-1024.png")}
            style={{ width: isStory ? 80 : 64, height: isStory ? 80 : 64, borderRadius: 8 }}
          />
          <AppText
            style={{ fontSize: isStory ? 44 : 36, color: colors.accent }}
          >
            {APP_NAME}
          </AppText>
        </View>

        {/* All content */}
        <View style={{ flex: 1, justifyContent: "center", gap: isStory ? 60 : 40, paddingTop: isStory ? 140 : 0, paddingBottom: isStory ? 120 : 0 }}>
          {/* Title + Date */}
          <View className="items-center gap-3" style={{ transform: [{ translateY: isStory ? -80 : -70 }] }}>
            <AppText
              className="text-center"
              style={{ fontSize: isStory ? 58 : 44, color: colors.textPrimary }}
              numberOfLines={2}
            >
              {title}
            </AppText>
            <AppText
              style={{ fontSize: isStory ? 34 : 26, color: colors.textMuted }}
            >
              {formatDateShort(date)}
            </AppText>
          </View>

          {/* 2x2 Stat Grid */}
          <View className="gap-4 self-center" style={{ width: isStory ? "80%" : "75%", transform: [{ translateY: isStory ? 0 : -40 }] }}>
            <View className="flex-row gap-4">
              <View className="flex-1">
                <ThemedStatBox
                  label={t("gym.share.duration")}
                  value={formatDurationLong(duration)}
                  theme={theme}
                  size={isStory ? "normal" : "small"}
                />
              </View>
              <View className="flex-1">
                <ThemedStatBox
                  label={t("gym.share.volume")}
                  value={formatVolume(stats.totalVolume)}
                  theme={theme}
                  size={isStory ? "normal" : "small"}
                />
              </View>
            </View>
            <View className="flex-row gap-4">
              <View className="flex-1">
                <ThemedStatBox
                  label={t("gym.share.exercises")}
                  value={String(stats.exerciseCount)}
                  theme={theme}
                  size={isStory ? "normal" : "small"}
                />
              </View>
              <View className="flex-1">
                <ThemedStatBox
                  label={t("gym.share.sets")}
                  value={String(stats.totalSets)}
                  theme={theme}
                  size={isStory ? "normal" : "small"}
                />
              </View>
            </View>
          </View>

          {/* Top Exercises */}
          <View className="self-center" style={{ width: "85%", gap: 12 }}>
            <AppText style={{ fontSize: isStory ? 36 : 28, color: colors.textPrimary, textAlign: "center", marginBottom: isStory ? 24 : 20 }}>
              {t("gym.share.bestSets")}
            </AppText>
            {topExercises.map((ex, i) => (
              <View key={i} className="flex-row justify-between items-center">
                <View className="mr-4">
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
        </View>

        {/* URL bottom center */}
        <View style={{ position: "absolute", bottom: 30, left: 0, right: 0, alignItems: "center" }}>
          <AppText style={{ fontSize: isStory ? 28 : 24, color: colors.textMuted, opacity: 0.5 }}>
            kurvi.io
          </AppText>
        </View>
      </ThemedCardWrapper>
    );
  },
);

ShareCard.displayName = "ShareCard";

export default ShareCard;
