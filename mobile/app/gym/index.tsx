import { View } from "react-native";
import AppText from "@/components/AppText";
import LinkButton from "@/components/buttons/LinkButton";
import { useTimerStore } from "@/lib/stores/timerStore";
import Toast from "react-native-toast-message";

export default function SessionsScreen() {
  const activeSession = useTimerStore((state) => state.activeSession);

  const handleClick = () => {
    if (activeSession && activeSession?.type !== "gym") {
      Toast.show({
        type: "error",
        text1: "You already have an active session.",
        text2: "Finish it before starting a new one.",
      });
      return false;
    }

    return true;
  };

  return (
    <View className="px-5 max-w-md mx-auto w-full gap-5">
      <AppText className="text-2xl text-center my-5">Gym</AppText>
      <LinkButton
        label="Start empty workout"
        href="/gym/gym"
        onPress={handleClick}
      />
      <LinkButton label="Create template" href="/gym/create-template" />
      <LinkButton label="Templates" href="/gym/templates" />
      <LinkButton label="Add Exercise" href="/gym/add-exercise" />
      <LinkButton label="Edit Exercise" href="/gym/edit-exercise" />
      <LinkButton label="Workout Analytics" href="/gym/workout-analytics" />
    </View>
  );
}
