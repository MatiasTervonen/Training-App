import { View } from "react-native";
import AppText from "@/components/AppText";
import { full_activity_session } from "@/types/models";
import {
  formatDurationLong,
  formatMeters,
  formatAveragePace,
} from "@/lib/formatDate";

type SessionStatsProps = {
  activity_session: full_activity_session;
};

export default function SessionStats({ activity_session }: SessionStatsProps) {
  return (
    <View className="bg-slate-950 p-5">
      <View className="flex-row justify-around flex-wrap gap-5">
        <View className="items-center gap-2 border-blue-500 border-2 p-2 rounded-md">
          <AppText>Duration</AppText>
          <AppText className="text-center">
            {formatDurationLong(activity_session.duration ?? 0)}
          </AppText>
        </View>
        <View className="items-center gap-2 border-blue-500 border-2 p-2 rounded-md">
          <AppText>Moving Time</AppText>
          <AppText className="text-center">
            {formatDurationLong(
              activity_session.activity_session_stats.moving_time_seconds ?? 0
            )}
          </AppText>
        </View>
        <View className="items-center gap-2 border-blue-500 border-2 p-2 rounded-md">
          <AppText>Distance</AppText>
          <AppText className="text-center">
            {formatMeters(
              activity_session.activity_session_stats.distance_meters ?? 0
            )}
          </AppText>
        </View>
        <View className="items-center gap-2 border-blue-500 border-2 p-2 rounded-md">
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
      </View>
    </View>
  );
}
