import { View } from "react-native";
import AppText from "@/components/AppText";
import LinkButton from "@/components/buttons/LinkButton";
import { useTimerStore } from "@/lib/stores/timerStore";
import Toast from "react-native-toast-message";
import { List, ChartNoAxesCombined } from "lucide-react-native";

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

      <View className="border border-gray-400 rounded-md" />
      <LinkButton label="Create template" href="/gym/create-template" />
      <LinkButton label="Templates" href="/gym/templates" />

      <View className="border border-gray-400 rounded-md" />
      <LinkButton label="Add Exercise" href="/gym/add-exercise" />
      <LinkButton label="Edit Exercise" href="/gym/edit-exercise" />

      <View className="border border-gray-400 rounded-md" />
      <LinkButton label="Workout Analytics" href="/gym/workout-analytics">
        <ChartNoAxesCombined color="#f3f4f6" className="ml-2" />
      </LinkButton>
      <LinkButton label="My Sessions" href="/gym/my-sessions">
        <List color="#f3f4f6" className="ml-2" />
      </LinkButton>
    </View>
  );
}
