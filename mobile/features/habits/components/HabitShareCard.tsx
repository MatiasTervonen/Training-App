import { forwardRef } from "react";
import { Image, View } from "react-native";
import AppText from "@/components/AppText";
import { HabitStats } from "@/types/habit";
import { useTranslation } from "react-i18next";
import { APP_NAME } from "@/lib/app-config";
import { ShareCardTheme, ShareCardSize } from "@/lib/share/themes";
import ThemedCardWrapper from "@/lib/components/share/ThemedCardWrapper";
import ThemedStatBox from "@/lib/components/share/ThemedStatBox";

type HabitShareCardProps = {
  habitName: string;
  stats: HabitStats;
  theme: ShareCardTheme;
  size: ShareCardSize;
};

const HabitShareCard = forwardRef<View, HabitShareCardProps>(
  ({ habitName, stats, theme, size }, ref) => {
    const { t, i18n } = useTranslation("habits");

    const dateText = new Date().toLocaleDateString(i18n.language, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    if (size === "wide") {
      return (
        <ThemedCardWrapper
          ref={ref}
          theme={theme}
          size={size}
          contentStyle={{ paddingHorizontal: 160, paddingBottom: 100 }}
        >
          {/* Header - App branding */}
          <View className="flex-row items-center gap-4">
            <Image
              source={require("@/assets/images/app-logos/kurvi_icon_ice_blue_rounded-converted-1024-1024.png")}
              style={{ width: 64, height: 64, borderRadius: 8 }}
            />
            <AppText style={{ fontSize: 36, color: theme.colors.accent }}>
              {APP_NAME}
            </AppText>
          </View>

          {/* Title + Date centered */}
          <View className="items-center gap-3">
            <AppText
              className="text-center"
              style={{ fontSize: 56, color: theme.colors.textPrimary }}
            >
              {habitName}
            </AppText>
            <AppText style={{ fontSize: 32, color: theme.colors.textMuted }}>
              {dateText}
            </AppText>
          </View>

          {/* Stats 2x2 grid */}
          <View style={{ gap: 16 }}>
            <View className="flex-row" style={{ gap: 16 }}>
              <View className="flex-1">
                <ThemedStatBox
                  label={t("stats.currentStreak")}
                  value={`${stats.current_streak} ${t("stats.days")}`}
                  theme={theme}
                />
              </View>
              <View className="flex-1">
                <ThemedStatBox
                  label={t("stats.longestStreak")}
                  value={`${stats.longest_streak} ${t("stats.days")}`}
                  theme={theme}
                />
              </View>
            </View>
            <View className="flex-row" style={{ gap: 16 }}>
              <View className="flex-1">
                <ThemedStatBox
                  label={t("stats.completionRate")}
                  value={`${stats.completion_rate}%`}
                  theme={theme}
                />
              </View>
              <View className="flex-1">
                <ThemedStatBox
                  label={t("stats.totalCompletions")}
                  value={`${stats.total}`}
                  theme={theme}
                />
              </View>
            </View>
          </View>

          {/* URL bottom center */}
          <View style={{ position: "absolute", bottom: 30, left: 0, right: 0, alignItems: "center" }}>
            <AppText style={{ fontSize: 24, color: theme.colors.textMuted, opacity: 0.5 }}>
              kurvi.io
            </AppText>
          </View>
        </ThemedCardWrapper>
      );
    }

    if (size === "story") {
      return (
        <ThemedCardWrapper ref={ref} theme={theme} size={size}>
          {/* Top content */}
          <View style={{ gap: 350 }}>
            {/* Header - App branding */}
            <View className="flex-row items-center gap-4">
              <Image
                source={require("@/assets/images/app-logos/kurvi_icon_ice_blue_rounded-converted-1024-1024.png")}
                style={{ width: 80, height: 80, borderRadius: 8 }}
              />
              <AppText style={{ fontSize: 44, color: theme.colors.accent }}>
                {APP_NAME}
              </AppText>
            </View>

            {/* Title + Date */}
            <View className="items-center gap-3">
              <AppText
                className="text-center"
                style={{ fontSize: 68, color: theme.colors.textPrimary }}
              >
                {habitName}
              </AppText>
              <AppText style={{ fontSize: 40, color: theme.colors.textMuted }}>
                {dateText}
              </AppText>
            </View>

            {/* Stats 2x2 grid */}
            <View style={{ gap: 16 }}>
              <View className="flex-row" style={{ gap: 16 }}>
                <View className="flex-1">
                  <ThemedStatBox
                    label={t("stats.currentStreak")}
                    value={`${stats.current_streak} ${t("stats.days")}`}
                    theme={theme}
                    size="large"
                  />
                </View>
                <View className="flex-1">
                  <ThemedStatBox
                    label={t("stats.longestStreak")}
                    value={`${stats.longest_streak} ${t("stats.days")}`}
                    theme={theme}
                    size="large"
                  />
                </View>
              </View>
              <View className="flex-row" style={{ gap: 16 }}>
                <View className="flex-1">
                  <ThemedStatBox
                    label={t("stats.completionRate")}
                    value={`${stats.completion_rate}%`}
                    theme={theme}
                    size="large"
                  />
                </View>
                <View className="flex-1">
                  <ThemedStatBox
                    label={t("stats.totalCompletions")}
                    value={`${stats.total}`}
                    theme={theme}
                    size="large"
                  />
                </View>
              </View>
            </View>
          </View>

          {/* URL bottom center */}
          <View style={{ position: "absolute", bottom: 30, left: 0, right: 0, alignItems: "center" }}>
            <AppText style={{ fontSize: 28, color: theme.colors.textMuted, opacity: 0.5 }}>
              kurvi.io
            </AppText>
          </View>
        </ThemedCardWrapper>
      );
    }

    // Square (default)
    return (
      <ThemedCardWrapper
        ref={ref}
        theme={theme}
        size={size}
        contentStyle={{ paddingBottom: 300 }}
      >
        {/* Header - App branding */}
        <View className="flex-row items-center gap-4">
          <Image
            source={require("@/assets/images/app-logos/kurvi_icon_ice_blue_rounded-converted-1024-1024.png")}
            style={{ width: 64, height: 64, borderRadius: 8 }}
          />
          <AppText style={{ fontSize: 36, color: theme.colors.accent }}>
            {APP_NAME}
          </AppText>
        </View>

        {/* Title + Date */}
        <View className="items-center gap-3">
          <AppText
            className="text-center"
            style={{ fontSize: 52, color: theme.colors.textPrimary }}
          >
            {habitName}
          </AppText>
          <AppText style={{ fontSize: 28, color: theme.colors.textMuted }}>
            {dateText}
          </AppText>
        </View>

        {/* Stats 2x2 grid */}
        <View style={{ gap: 16 }}>
          <View className="flex-row" style={{ gap: 16 }}>
            <View className="flex-1">
              <ThemedStatBox
                label={t("stats.currentStreak")}
                value={`${stats.current_streak} ${t("stats.days")}`}
                theme={theme}
              />
            </View>
            <View className="flex-1">
              <ThemedStatBox
                label={t("stats.longestStreak")}
                value={`${stats.longest_streak} ${t("stats.days")}`}
                theme={theme}
              />
            </View>
          </View>
          <View className="flex-row" style={{ gap: 16 }}>
            <View className="flex-1">
              <ThemedStatBox
                label={t("stats.completionRate")}
                value={`${stats.completion_rate}%`}
                theme={theme}
              />
            </View>
            <View className="flex-1">
              <ThemedStatBox
                label={t("stats.totalCompletions")}
                value={`${stats.total}`}
                theme={theme}
              />
            </View>
          </View>
        </View>

        {/* URL bottom center */}
        <View style={{ position: "absolute", bottom: 30, left: 0, right: 0, alignItems: "center" }}>
          <AppText style={{ fontSize: 24, color: theme.colors.textMuted, opacity: 0.5 }}>
            kurvi.io
          </AppText>
        </View>
      </ThemedCardWrapper>
    );
  },
);

HabitShareCard.displayName = "HabitShareCard";

export default HabitShareCard;
