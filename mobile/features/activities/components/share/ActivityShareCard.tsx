import { forwardRef } from "react";
import { ActivityIndicator, View } from "react-native";
import { Image } from "expo-image";
import AppText from "@/components/AppText";
import { LinearGradient } from "expo-linear-gradient";
import { formatDateShort } from "@/lib/formatDate";
import { StatItem } from "@/features/activities/lib/activityShareCardUtils";
import { useTranslation } from "react-i18next";

const GRADIENT_COLORS: [string, string, string] = ["#1e3a8a", "#0f172a", "#0f172a"];
const GRADIENT_START = { x: 0.8, y: 0 };
const GRADIENT_END = { x: 0.2, y: 1 };
const MAP_OVERLAY_TOP_COLORS: [string, string] = ["rgba(0,0,0,0.7)", "transparent"];
const MAP_OVERLAY_BOTTOM_COLORS: [string, string] = ["transparent", "rgba(15,23,42,0.8)"];

type ActivityShareCardProps = {
  title: string;
  date: string;
  activityName: string | null;
  activitySlug: string | null;
  mapSnapshotUri: string | null;
  hasRoute: boolean;
  selectedStats: StatItem[];
};

const ActivityShareCard = forwardRef<View, ActivityShareCardProps>(
  ({ title, date, activityName, activitySlug, mapSnapshotUri, hasRoute, selectedStats }, ref) => {
    const { t } = useTranslation("activities");

    const displayActivityName = (() => {
      if (activitySlug) {
        const translated = t(`activities.activityNames.${activitySlug}`, { defaultValue: "" });
        if (translated && translated !== `activities.activityNames.${activitySlug}`) {
          return translated;
        }
      }
      return activityName;
    })();
    if (hasRoute) {
      return (
        <View
          ref={ref}
          collapsable={false}
          className="w-[1080px] h-[1080px] bg-[#0f172a]"
        >
          {/* Map section — fills top portion with overlays */}
          <View className="w-full h-[680px]">
            {mapSnapshotUri ? (
              <Image
                source={{ uri: mapSnapshotUri }}
                className="w-full h-full"
                contentFit="cover"
              />
            ) : (
              <View className="w-full h-full items-center justify-center bg-[#0f172a]">
                <ActivityIndicator size="large" color="#3b82f6" />
              </View>
            )}
            {/* Top gradient fade for title readability */}
            <LinearGradient
              colors={MAP_OVERLAY_TOP_COLORS}
              className="absolute top-0 left-0 right-0 h-[200px]"
            />
            {/* Bottom shadow — fades map into the stats area */}
            <LinearGradient
              colors={MAP_OVERLAY_BOTTOM_COLORS}
              className="absolute bottom-0 left-0 right-0 h-[120px]"
            />
            {/* Title + Date overlay at top */}
            <View className="absolute top-[40px] left-[50px] right-[50px]">
              <AppText
                className="text-[52px] text-white"
                numberOfLines={1}
              >
                {title}
              </AppText>
              <AppText className="text-[28px] text-gray-300 mt-1">
                {displayActivityName && `${displayActivityName}  ·  `}{formatDateShort(date)}
              </AppText>
            </View>
            {/* App logo overlay at bottom-right */}
            <View className="absolute bottom-[24px] right-[36px] flex-row items-center gap-3">
              <Image
                source={require("@/assets/images/android-chrome-192x192.png")}
                className="w-[48px] h-[48px] rounded-lg"
              />
              <AppText className="text-[30px] text-white/80">MyTrack</AppText>
            </View>
          </View>

          {/* Stats section below map */}
          <View className="flex-1 px-[50px] pt-[30px] pb-[30px] justify-center">
            <FlexibleStatsGrid stats={selectedStats} />
          </View>
        </View>
      );
    }

    // Non-GPS layout (no map)
    return (
      <View
        ref={ref}
        collapsable={false}
        className="w-[1080px] h-[1080px]"
      >
        <LinearGradient
          colors={GRADIENT_COLORS}
          start={GRADIENT_START}
          end={GRADIENT_END}
          className="flex-1 px-[50px] pt-[40px] pb-[40px] justify-between"
        >
          {/* Title + Date at top */}
          <View>
            <AppText
              className="text-[52px] text-white"
              numberOfLines={1}
            >
              {title}
            </AppText>
            <AppText className="text-[28px] text-gray-300 mt-1">
              {displayActivityName && `${displayActivityName}  ·  `}{formatDateShort(date)}
            </AppText>
          </View>

          {/* Stats Grid - centered */}
          <View>
            <NoMapStatsLayout stats={selectedStats} />
          </View>

          {/* App logo at bottom-right */}
          <View className="flex-row items-center gap-3 self-end">
            <Image
              source={require("@/assets/images/android-chrome-192x192.png")}
              className="w-[48px] h-[48px] rounded-lg"
            />
            <AppText className="text-[30px] text-white/80">MyTrack</AppText>
          </View>
        </LinearGradient>
      </View>
    );
  },
);

ActivityShareCard.displayName = "ActivityShareCard";

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 items-center justify-center gap-2 border-blue-500 border rounded-lg bg-slate-950/50 py-[30px] px-[20px]">
      <AppText className="text-[24px] text-gray-300">{label}</AppText>
      <AppText className="text-[36px] text-gray-100">{value}</AppText>
    </View>
  );
}

/** Flexible grid layout: 2→1×2, 3→1×3, 4→2×2, 5→3+2, 6→2×3, 7→4+3 */
function FlexibleStatsGrid({ stats }: { stats: StatItem[] }) {
  if (stats.length <= 3) {
    return (
      <View className="flex-row gap-4">
        {stats.map((s) => (
          <StatBox key={s.key} label={s.label} value={s.value} />
        ))}
      </View>
    );
  }

  if (stats.length === 4) {
    return (
      <View className="gap-4">
        <View className="flex-row gap-4">
          {stats.slice(0, 2).map((s) => (
            <StatBox key={s.key} label={s.label} value={s.value} />
          ))}
        </View>
        <View className="flex-row gap-4">
          {stats.slice(2, 4).map((s) => (
            <StatBox key={s.key} label={s.label} value={s.value} />
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
            <StatBox key={s.key} label={s.label} value={s.value} />
          ))}
        </View>
        <View className="flex-row gap-4">
          {stats.slice(3, 5).map((s) => (
            <StatBox key={s.key} label={s.label} value={s.value} />
          ))}
        </View>
      </View>
    );
  }

  if (stats.length === 6) {
    // 6 stats: 2 rows of 3
    return (
      <View className="gap-4">
        <View className="flex-row gap-4">
          {stats.slice(0, 3).map((s) => (
            <StatBox key={s.key} label={s.label} value={s.value} />
          ))}
        </View>
        <View className="flex-row gap-4">
          {stats.slice(3, 6).map((s) => (
            <StatBox key={s.key} label={s.label} value={s.value} />
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
          <StatBox key={s.key} label={s.label} value={s.value} />
        ))}
      </View>
      <View className="flex-row gap-4">
        {stats.slice(4, 7).map((s) => (
          <StatBox key={s.key} label={s.label} value={s.value} />
        ))}
      </View>
    </View>
  );
}

/** Layout for sessions without a map: large primary stat + smaller grid */
function NoMapStatsLayout({ stats }: { stats: StatItem[] }) {
  if (stats.length === 0) return null;

  const [primary, ...rest] = stats;

  return (
    <View className="gap-4">
      {/* Large primary stat */}
      <View className="items-center justify-center gap-2 border-blue-500 border rounded-lg bg-slate-950/50 py-[40px] px-[20px]">
        <AppText className="text-[28px] text-gray-300">{primary.label}</AppText>
        <AppText className="text-[48px] text-gray-100">{primary.value}</AppText>
      </View>
      {/* Remaining stats in rows of 2 */}
      {rest.length > 0 && (
        <View className="gap-4">
          {chunk(rest, 2).map((row, i) => (
            <View key={i} className="flex-row gap-4">
              {row.map((s) => (
                <StatBox key={s.key} label={s.label} value={s.value} />
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
