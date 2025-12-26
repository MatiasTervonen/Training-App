import { useTimerStore } from "@/lib/stores/timerStore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Toast from "react-native-toast-message";
import { useStartGPStracking } from "../../components/activities/location-actions";

export function useStartActivity({
  activityName,
  title,
}: {
  activityName: string;
  title: string;
}) {
  const { elapsedTime, setActiveSession, startTimer } = useTimerStore();

  const { startGPStracking } = useStartGPStracking();

  const startActivity = async () => {
    if (elapsedTime > 0) return;

    if (!activityName || activityName.trim() === "") {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Please select an activity",
      });
      return;
    }

    setActiveSession({
      type: "activity",
      label: title,
      path: "/activities/start-activity",
    });

    const startTime = new Date().toISOString();

    await AsyncStorage.mergeItem(
      "activity_draft",
      JSON.stringify({ startTime, track: [] })
    );

    await startGPStracking();

    startTimer(0);
  };

  return {
    startActivity,
  };
}
