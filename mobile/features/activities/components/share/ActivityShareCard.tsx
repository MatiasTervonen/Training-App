import { forwardRef } from "react";
import { ActivityIndicator, View } from "react-native";
import { Image } from "expo-image";
import AppText from "@/components/AppText";
import { LinearGradient } from "expo-linear-gradient";
import { formatDateShort } from "@/lib/formatDate";
import { StatItem } from "@/features/activities/lib/activityShareCardUtils";
import { useTranslation } from "react-i18next";
import { APP_NAME } from "@/lib/app-config";
import {
  ShareCardTheme,
  ShareCardSize,
  SHARE_CARD_DIMENSIONS,
} from "@/lib/share/themes";
import ThemedCardWrapper from "@/lib/components/share/ThemedCardWrapper";
import ThemedStatBox from "@/lib/components/share/ThemedStatBox";

type ActivityShareCardProps = {
  title: string;
  date: string;
  activityName: string | null;
  activitySlug: string | null;
  mapSnapshotUri: string | null;
  hasRoute: boolean;
  selectedStats: StatItem[];
  theme: ShareCardTheme;
  size: ShareCardSize;
  showGradient?: boolean;
};

/** Convert a hex color to rgba string */
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

const ActivityShareCard = forwardRef<View, ActivityShareCardProps>(
  (
    {
      title,
      date,
      activityName,
      activitySlug,
      mapSnapshotUri,
      hasRoute,
      selectedStats,
      theme,
      size,
      showGradient = true,
    },
    ref,
  ) => {
    const { t } = useTranslation("activities");
    const dims = SHARE_CARD_DIMENSIONS[size];
    const { colors } = theme;

    const displayActivityName = (() => {
      if (activitySlug) {
        const translated = t(`activities.activityNames.${activitySlug}`, {
          defaultValue: "",
        });
        if (translated && translated !== `activities.activityNames.${activitySlug}`) {
          return translated;
        }
      }
      return activityName;
    })();

    if (hasRoute) {
      return (
        <GPSLayout
          ref={ref}
          title={title}
          date={date}
          displayActivityName={displayActivityName}
          mapSnapshotUri={mapSnapshotUri}
          selectedStats={selectedStats}
          theme={theme}
          size={size}
          dims={dims}
          colors={colors}
          showGradient={showGradient}
        />
      );
    }

    // Non-GPS layout
    return (
      <NoGPSLayout
        ref={ref}
        title={title}
        date={date}
        displayActivityName={displayActivityName}
        selectedStats={selectedStats}
        theme={theme}
        size={size}
      />
    );
  },
);

ActivityShareCard.displayName = "ActivityShareCard";

// ---------------------------------------------------------------------------
// GPS Layout (with map)
// ---------------------------------------------------------------------------

type GPSLayoutProps = {
  title: string;
  date: string;
  displayActivityName: string | null;
  mapSnapshotUri: string | null;
  selectedStats: StatItem[];
  theme: ShareCardTheme;
  size: ShareCardSize;
  dims: { width: number; height: number };
  colors: ShareCardTheme["colors"];
  showGradient: boolean;
};

const GPSLayout = forwardRef<View, GPSLayoutProps>(
  (
    {
      title,
      date,
      displayActivityName,
      mapSnapshotUri,
      selectedStats,
      theme,
      size,
      dims,
      colors,
      showGradient,
    },
    ref,
  ) => {
    const bgColor = colors.background[0];
    const isLight = theme.id === "clean";
    const overlayTopColors: [string, string] = [
      hexToRgba(bgColor, 0.75),
      "transparent",
    ];
    const overlayBottomColors: [string, string] = [
      "transparent",
      hexToRgba(bgColor, 0.8),
    ];

    // When gradient is off on light theme, swap to white text with shadow
    const noGradientOverride = !showGradient && isLight
      ? {
          textPrimary: "#ffffff",
          textSecondary: "#d1d5db",
          textMuted: "#9ca3af",
        }
      : null;
    const textShadow = !showGradient
      ? {
          textShadowColor: "rgba(0,0,0,0.8)",
          textShadowOffset: { width: 0, height: 2 },
          textShadowRadius: 6,
        }
      : undefined;

    // All sizes: map fills entire card, everything overlaid on top
    // Bottom gradient is taller for story (more stats space) and wide
    const bottomGradientHeight = size === "story" ? "45%" : size === "wide" ? "50%" : "45%";

    if (size === "wide") {
      // Wide: full-bleed map, title top-left, stats bottom-right
      return (
        <View
          ref={ref}
          collapsable={false}
          style={{ width: dims.width, height: dims.height, backgroundColor: bgColor }}
        >
          {/* Full-bleed map */}
          <View className="absolute top-0 left-0 right-0 bottom-0">
            <MapImage uri={mapSnapshotUri} bgColor={bgColor} accentColor={colors.accent} />
          </View>

          {/* Top gradient for title readability */}
          {showGradient && (
            <LinearGradient
              colors={overlayTopColors}
              className="absolute top-0 left-0 right-0 h-[200px]"
            />
          )}

          {/* Bottom gradient for stats readability */}
          {showGradient && (
            <LinearGradient
              colors={overlayBottomColors}
              className="absolute bottom-0 left-0 right-0"
              style={{ height: bottomGradientHeight }}
            />
          )}

          {/* Title overlay at top-left */}
          <View className="absolute top-[40px] left-[50px] right-[50px]">
            <AppText
              className="text-[52px]"
              style={{ color: noGradientOverride?.textPrimary ?? colors.textPrimary, ...textShadow }}
              numberOfLines={1}
            >
              {title}
            </AppText>
            <AppText
              className="text-[28px] mt-1"
              style={{ color: noGradientOverride?.textSecondary ?? colors.textSecondary, ...textShadow }}
            >
              {displayActivityName && `${displayActivityName}  ·  `}
              {formatDateShort(date)}
            </AppText>
          </View>

          {/* Stats overlaid at bottom */}
          <View className="absolute bottom-[40px] left-[50px] right-[50px]">
            <FlexibleStatsGrid stats={selectedStats} theme={theme} />
            <View className="flex-row items-center gap-3 self-end mt-4">
              <Image
                source={require("@/assets/images/android-chrome-192x192.png")}
                className="w-[48px] h-[48px] rounded-lg"
              />
              <AppText className="text-[30px]" style={{ color: noGradientOverride?.textMuted ?? colors.textMuted, ...textShadow }}>
                {APP_NAME}
              </AppText>
            </View>
          </View>
        </View>
      );
    }

    // Square & Story: same structure, map fills 100%, title top, stats bottom
    return (
      <View
        ref={ref}
        collapsable={false}
        style={{ width: dims.width, height: dims.height, backgroundColor: bgColor }}
      >
        {/* Full-bleed map */}
        <View className="absolute top-0 left-0 right-0 bottom-0">
          <MapImage uri={mapSnapshotUri} bgColor={bgColor} accentColor={colors.accent} />
        </View>

        {/* Top gradient for title readability */}
        {showGradient && (
          <LinearGradient
            colors={overlayTopColors}
            className="absolute top-0 left-0 right-0 h-[200px]"
          />
        )}

        {/* Bottom gradient for stats readability */}
        {showGradient && (
          <LinearGradient
            colors={overlayBottomColors}
            className="absolute bottom-0 left-0 right-0"
            style={{ height: bottomGradientHeight }}
          />
        )}

        {/* Title + Date overlay at top */}
        <View className="absolute top-[40px] left-[50px] right-[50px]">
          <AppText
            className="text-[52px]"
            style={{ color: noGradientOverride?.textPrimary ?? colors.textPrimary, ...textShadow }}
            numberOfLines={1}
          >
            {title}
          </AppText>
          <AppText
            className="text-[28px] mt-1"
            style={{ color: noGradientOverride?.textSecondary ?? colors.textSecondary, ...textShadow }}
          >
            {displayActivityName && `${displayActivityName}  ·  `}
            {formatDateShort(date)}
          </AppText>
        </View>

        {/* Stats + logo overlaid at bottom */}
        <View
          className="absolute left-[50px] right-[50px]"
          style={{ bottom: size === "story" ? 100 : 40 }}
        >
          <FlexibleStatsGrid stats={selectedStats} theme={theme} />
          <View className="flex-row items-center gap-3 self-end mt-4">
            <Image
              source={require("@/assets/images/android-chrome-192x192.png")}
              className="w-[48px] h-[48px] rounded-lg"
            />
            <AppText className="text-[30px]" style={{ color: noGradientOverride?.textMuted ?? colors.textMuted, ...textShadow }}>
              {APP_NAME}
            </AppText>
          </View>
        </View>
      </View>
    );
  },
);

GPSLayout.displayName = "GPSLayout";

// ---------------------------------------------------------------------------
// Non-GPS Layout (no map)
// ---------------------------------------------------------------------------

type NoGPSLayoutProps = {
  title: string;
  date: string;
  displayActivityName: string | null;
  selectedStats: StatItem[];
  theme: ShareCardTheme;
  size: ShareCardSize;
};

const NoGPSLayout = forwardRef<View, NoGPSLayoutProps>(
  ({ title, date, displayActivityName, selectedStats, theme, size }, ref) => {
    const { colors } = theme;

    if (size === "story") {
      // Story: title at top, centered stats, logo at bottom
      return (
        <ThemedCardWrapper
          ref={ref}
          theme={theme}
          size={size}
          className="flex-1 justify-between"
        >
          {/* Title at top */}
          <View>
            <AppText
              className="text-[68px]"
              style={{ color: colors.textPrimary }}
              numberOfLines={1}
            >
              {title}
            </AppText>
            <AppText
              className="text-[40px] mt-1"
              style={{ color: colors.textSecondary }}
            >
              {displayActivityName && `${displayActivityName}  ·  `}
              {formatDateShort(date)}
            </AppText>
          </View>

          {/* Stats — nudged slightly above center */}
          <View style={{ marginBottom: 80 }}>
            <NoMapStatsLayout stats={selectedStats} theme={theme} statSize="large" />
          </View>

          {/* App logo at bottom */}
          <View className="flex-row items-center gap-3 self-end">
            <Image
              source={require("@/assets/images/android-chrome-192x192.png")}
              className="w-[48px] h-[48px] rounded-lg"
            />
            <AppText className="text-[30px]" style={{ color: colors.textMuted }}>
              {APP_NAME}
            </AppText>
          </View>
        </ThemedCardWrapper>
      );
    }

    if (size === "wide") {
      // Wide: title top, stats in a row centered, logo bottom-right
      return (
        <ThemedCardWrapper
          ref={ref}
          theme={theme}
          size={size}
          className="flex-1 justify-between"
        >
          <View>
            <AppText
              className="text-[56px]"
              style={{ color: colors.textPrimary }}
              numberOfLines={1}
            >
              {title}
            </AppText>
            <AppText
              className="text-[30px] mt-1"
              style={{ color: colors.textSecondary }}
            >
              {displayActivityName && `${displayActivityName}  ·  `}
              {formatDateShort(date)}
            </AppText>
          </View>

          {/* Stats in a centered row */}
          <View className="flex-row gap-4">
            {selectedStats.map((s) => (
              <FlexStatBox key={s.key} stat={s} theme={theme} size="large" />
            ))}
          </View>

          <View className="flex-row items-center gap-3 self-end">
            <Image
              source={require("@/assets/images/android-chrome-192x192.png")}
              className="w-[48px] h-[48px] rounded-lg"
            />
            <AppText className="text-[30px]" style={{ color: colors.textMuted }}>
              {APP_NAME}
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
        className="flex-1 justify-between"
          contentStyle={{ paddingHorizontal: 50, paddingTop: 40, paddingBottom: 40 }}
      >
        {/* Title + Date at top */}
        <View>
          <AppText
            className="text-[52px]"
            style={{ color: colors.textPrimary }}
            numberOfLines={1}
          >
            {title}
          </AppText>
          <AppText
            className="text-[28px] mt-1"
            style={{ color: colors.textSecondary }}
          >
            {displayActivityName && `${displayActivityName}  ·  `}
            {formatDateShort(date)}
          </AppText>
        </View>

        {/* Stats Grid - centered */}
        <View>
          <NoMapStatsLayout stats={selectedStats} theme={theme} />
        </View>

        {/* App logo at bottom-right */}
        <View className="flex-row items-center gap-3 self-end">
          <Image
            source={require("@/assets/images/android-chrome-192x192.png")}
            className="w-[48px] h-[48px] rounded-lg"
          />
          <AppText className="text-[30px]" style={{ color: colors.textMuted }}>
            {APP_NAME}
          </AppText>
        </View>
      </ThemedCardWrapper>
    );
  },
);

NoGPSLayout.displayName = "NoGPSLayout";

// ---------------------------------------------------------------------------
// Map image helper
// ---------------------------------------------------------------------------

function MapImage({
  uri,
  bgColor,
  accentColor,
}: {
  uri: string | null;
  bgColor: string;
  accentColor: string;
}) {
  if (uri) {
    return (
      <Image
        source={{ uri }}
        className="w-full h-full"
        contentFit="cover"
      />
    );
  }
  return (
    <View
      className="w-full h-full items-center justify-center"
      style={{ backgroundColor: bgColor }}
    >
      <ActivityIndicator size="large" color={accentColor} />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Stats grid layouts
// ---------------------------------------------------------------------------

/** Stat box wrapped in flex-1 for use inside flex-row containers */
function FlexStatBox({ stat, theme, size }: { stat: StatItem; theme: ShareCardTheme; size?: "normal" | "large" }) {
  return (
    <View className="flex-1">
      <ThemedStatBox label={stat.label} value={stat.value} theme={theme} size={size} />
    </View>
  );
}

/** Flexible grid layout: 2->1x2, 3->1x3, 4->2x2, 5->3+2, 6->2x3, 7->4+3 */
function FlexibleStatsGrid({
  stats,
  theme,
}: {
  stats: StatItem[];
  theme: ShareCardTheme;
}) {
  if (stats.length <= 3) {
    return (
      <View className="flex-row gap-4">
        {stats.map((s) => (
          <FlexStatBox key={s.key} stat={s} theme={theme} />
        ))}
      </View>
    );
  }

  if (stats.length === 4) {
    return (
      <View className="gap-4">
        <View className="flex-row gap-4">
          {stats.slice(0, 2).map((s) => (
            <FlexStatBox key={s.key} stat={s} theme={theme} />
          ))}
        </View>
        <View className="flex-row gap-4">
          {stats.slice(2, 4).map((s) => (
            <FlexStatBox key={s.key} stat={s} theme={theme} />
          ))}
        </View>
      </View>
    );
  }

  if (stats.length === 5) {
    return (
      <View className="gap-4">
        <View className="flex-row gap-4">
          {stats.slice(0, 3).map((s) => (
            <FlexStatBox key={s.key} stat={s} theme={theme} />
          ))}
        </View>
        <View className="flex-row gap-4">
          {stats.slice(3, 5).map((s) => (
            <FlexStatBox key={s.key} stat={s} theme={theme} />
          ))}
        </View>
      </View>
    );
  }

  if (stats.length === 6) {
    return (
      <View className="gap-4">
        <View className="flex-row gap-4">
          {stats.slice(0, 3).map((s) => (
            <FlexStatBox key={s.key} stat={s} theme={theme} />
          ))}
        </View>
        <View className="flex-row gap-4">
          {stats.slice(3, 6).map((s) => (
            <FlexStatBox key={s.key} stat={s} theme={theme} />
          ))}
        </View>
      </View>
    );
  }

  // 7 stats: row of 4 + row of 3
  return (
    <View className="gap-4">
      <View className="flex-row gap-4">
        {stats.slice(0, 4).map((s) => (
          <FlexStatBox key={s.key} stat={s} theme={theme} />
        ))}
      </View>
      <View className="flex-row gap-4">
        {stats.slice(4, 7).map((s) => (
          <FlexStatBox key={s.key} stat={s} theme={theme} />
        ))}
      </View>
    </View>
  );
}

/** Layout for sessions without a map: large primary stat + smaller grid */
function NoMapStatsLayout({
  stats,
  theme,
  statSize = "normal",
}: {
  stats: StatItem[];
  theme: ShareCardTheme;
  statSize?: "normal" | "large";
}) {
  if (stats.length === 0) return null;

  const [primary, ...rest] = stats;

  return (
    <View className="gap-4">
      {/* Large primary stat */}
      <ThemedStatBox
        label={primary.label}
        value={primary.value}
        theme={theme}
        size="large"
      />
      {/* Remaining stats in rows of 2 */}
      {rest.length > 0 && (
        <View className="gap-4">
          {chunk(rest, 2).map((row, i) => (
            <View key={i} className="flex-row gap-4">
              {row.map((s) => (
                <FlexStatBox key={s.key} stat={s} theme={theme} size={statSize} />
              ))}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function chunk<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}

export default ActivityShareCard;
