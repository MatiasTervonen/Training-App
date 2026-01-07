import { full_activity_session } from "@/types/models";
import { View, ScrollView } from "react-native";
import PageContainer from "@/components/PageContainer";
import AppText from "@/components/AppText";
import { formatDate, formatTime } from "@/lib/formatDate";
import { useState } from "react";
import { useFullScreenModalConfig } from "@/lib/stores/fullScreenModalConfig";
import Map from "./components/map";
import SessionStats from "./components/sessionStats";

export default function ActivitySession(
  activity_session: full_activity_session
) {
  const [scrollEnabled, setScrollEnabled] = useState(true);

  const setSwipeEnabled = useFullScreenModalConfig(
    (state) => state.setSwipeEnabled
  );
  // console.log("activity_session", activity_session);

  return (
    <ScrollView scrollEnabled={scrollEnabled}>
      <PageContainer className="mb-10">
        <AppText className="text-gray-300 text-center text-sm">
          created: {formatDate(activity_session.created_at!)}
        </AppText>
        <View className="items-center bg-slate-900 p-5 rounded-md shadow-md mt-5">
          <AppText className="text-xl text-center mb-5 border-b border-gray-700 pb-2">
            {activity_session.title}
          </AppText>

          <AppText className="text-lg text-center">
            {formatTime(activity_session.start_time)} -{" "}
            {formatTime(activity_session.end_time)}
          </AppText>
          {activity_session.notes && (
            <AppText className="text-lg text-left">
              {activity_session.notes}
            </AppText>
          )}
        </View>
        <Map
          activity_session={activity_session}
          setScrollEnabled={setScrollEnabled}
          setSwipeEnabled={setSwipeEnabled}
        />
        <SessionStats activity_session={activity_session} />
      </PageContainer>
    </ScrollView>
  );
}
