import { View } from "react-native";
import AppText from "@/components/AppText";
import { full_activity_session } from "@/types/models";
import {
  formatDurationLong,
  formatMeters,
  formatAveragePace,
} from "@/lib/formatDate";
import { LinearGradient } from "expo-linear-gradient";

type SessionStatsProps = {
  activity_session: full_activity_session;
};

export default function SessionStats({ activity_session }: SessionStatsProps) {
  return (
    <LinearGradient
      colors={["#1e3a8a", "#0f172a", "#0f172a"]}
      start={{ x: 1, y: 0 }} // bottom-left
      end={{ x: 0, y: 1 }} // top-right
      className="items-center p-5 rounded-b-lg overflow-hidden shadow-md"
    >
      <View className="flex-row justify-around flex-wrap gap-5">
        <View className="items-center gap-2 border-blue-500 border-2 p-2 rounded-md bg-slate-950">
          <AppText>Duration</AppText>
          <AppText className="text-center">
            {formatDurationLong(activity_session.duration ?? 0)}
          </AppText>
        </View>
        <View className="items-center gap-2 border-blue-500 border-2 p-2 rounded-md bg-slate-950">
          <AppText>Moving Time</AppText>
          <AppText className="text-center">
            {formatDurationLong(
              activity_session.activity_session_stats.moving_time_seconds ?? 0
            )}
          </AppText>
        </View>
        <View className="items-center gap-2 border-blue-500 border-2 p-2 rounded-md bg-slate-950">
          <AppText>Distance</AppText>
          <AppText className="text-center">
            {formatMeters(
              activity_session.activity_session_stats.distance_meters ?? 0
            )}
          </AppText>
        </View>
        <View className="items-center gap-2 border-blue-500 border-2 p-2 rounded-md bg-slate-950">
          <View className="flex-row items-center gap-2">
            <AppText>Avg Pace</AppText>
            <AppText className="text-sm">(moving)</AppText>
          </View>
          <AppText className="text-center">
            {formatAveragePace(
              activity_session.activity_session_stats.avg_pace ?? 0
            )}{" "}
            min/km
          </AppText>
        </View>
        <View className="items-center gap-2 border-blue-500 border-2 p-2 rounded-md bg-slate-950">
          <View className="flex-row items-center gap-2">
            <AppText>Steps</AppText>
          </View>
          <AppText className="text-center">
            {activity_session.activity_session_stats.steps ?? 0}
          </AppText>
        </View>
      </View>
    </LinearGradient>
  );
}
