import { FullActivitySession } from "@/types/models";
import { View, ScrollView } from "react-native";
import PageContainer from "@/components/PageContainer";
import AppText from "@/components/AppText";
import { formatDate, formatTime, formatDuration } from "@/lib/formatDate";
import { useState } from "react";
import { useFullScreenModalConfig } from "@/lib/stores/fullScreenModalConfig";
import Map from "./components/map";
import SessionStats from "./components/sessionStats";
import { LinearGradient } from "expo-linear-gradient";

export default function ActivitySession(activity_session: FullActivitySession) {
  const [scrollEnabled, setScrollEnabled] = useState(true);

  const setSwipeEnabled = useFullScreenModalConfig(
    (state) => state.setSwipeEnabled
  );

  const hasRoute = activity_session.route !== null;

  return (
    <ScrollView scrollEnabled={scrollEnabled}>
      <PageContainer className="mb-10">
        <AppText className="text-gray-300 text-center text-sm">
          created: {formatDate(activity_session.session.created_at!)}
        </AppText>
        <LinearGradient
          colors={["#1e3a8a", "#0f172a", "#0f172a"]}
          start={{ x: 1, y: 0 }} // bottom-left
          end={{ x: 0, y: 1 }} // top-right
          className="items-center p-5 rounded-lg overflow-hidden shadow-md mt-5"
        >
          <AppText className="text-xl text-center mb-5 border-b border-gray-700 pb-2">
            {activity_session.activity?.name}
          </AppText>

          <AppText className="text-lg text-center">
            {formatTime(activity_session.session.start_time)} -{" "}
            {formatTime(activity_session.session.end_time)}
          </AppText>
          {activity_session.session.notes && (
            <AppText className="text-lg text-left">
              {activity_session.session.notes}
            </AppText>
          )}
          {!hasRoute && (
            <AppText className="text-lg text-center mt-5">
              Duration: {formatDuration(activity_session.session.duration)}
            </AppText>
          )}
          {!hasRoute && activity_session.stats?.steps && (
            <AppText className="text-lg text-center mt-5">
              Steps: {activity_session.stats?.steps}
            </AppText>
          )}
        </LinearGradient>
        {hasRoute && (
          <View className="mt-10">
            <Map
              activity_session={activity_session}
              setScrollEnabled={setScrollEnabled}
              setSwipeEnabled={setSwipeEnabled}
            />
            <SessionStats activity_session={activity_session} />
          </View>
        )}
      </PageContainer>
    </ScrollView>
  );
}
