import { View, ActivityIndicator } from "react-native";
import AppText from "@/components/AppText";
import { full_gym_session } from "../../types/models";
import ChartTabSwitcher from "./AnalytictsChartTabSwitcher";

type AnalyticsFormProps = {
  data: full_gym_session[];
  isLoading: boolean;
  error: Error | null;
};

export default function AnalyticsForm({
  data,
  error,
  isLoading,
}: AnalyticsFormProps) {
  function totalSessions30Days(data: full_gym_session[]) {
    return data.length;
  }

  function averageDuration(data: full_gym_session[]) {
    const totalDuration = data.reduce(
      (acc, session) => acc + session.duration,
      0
    );
    return Math.round(totalDuration / 60 / data.length || 0);
  }

  return (
    <View className=" bg-slate-800 rounded-xl">
      {!error && isLoading && (
        <View className="items-center gap-2 mt-20">
          <AppText className="text-gray-300 text-center text-xl">
            Loading...
          </AppText>
          <ActivityIndicator size="large" color="#ffffff" />
        </View>
      )}

      {error && (
        <AppText className="text-red-500 text-center mt-20 text-lg">
          Error loading workout data. Try again!
        </AppText>
      )}

      {!error && !isLoading && data.length === 0 && (
        <AppText className="text-gray-300 text-center mt-20 text-lg">
          No workout data available. Start logging your workouts to see
          analytics!
        </AppText>
      )}

      {!isLoading && !error && data.length > 0 && (
        <>
          <View className="gap-4 bg-slate-900  rounded-2xl shadow-md pt-5">
            <AppText className="text-xl mb-4 text-center">
              Last 30 Days Analytics
            </AppText>
            <View className="sm:flex items-center justify-center gap-10 ml-4">
              <View className="flex flex-col gap-5">
                <AppText className="text-lg">
                  Total workouts: {totalSessions30Days(data)}
                </AppText>
                <AppText className="text-lg mb-5">
                  Average Duration: {averageDuration(data)} minutes
                </AppText>
              </View>
              {/* <AnalyticsHeatMap data={data} /> */}
            </View>
            <View>
              <AppText className="text-center mb-6">
                Muscle Group Distribution
              </AppText>
              <ChartTabSwitcher data={data} />
            </View>
          </View>
          <View className="mt-6 text-sm text-gray-400 px-4">
            <AppText>
              Note: Analytics are based on the last 30 days of workout data.
            </AppText>
          </View>
          <View className="mt-6 text-sm text-gray-400 px-4 pb-20">
            <AppText>More analytics coming soon!</AppText>
          </View>
        </>
      )}
    </View>
  );
}
