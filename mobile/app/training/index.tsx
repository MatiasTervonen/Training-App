import { View } from "react-native";
import AppText from "@/components/AppText";
import LinkButton from "@/components/LinkButton";

export default function SessionsScreen() {
  return (
    <View className="px-5 max-w-md mx-auto w-full">
      <AppText className="text-2xl text-center my-5">Start Sessions</AppText>
      <LinkButton label="Start empty workout" href="/training/gym" />
      <LinkButton label="Create template" href="/training/create-template" />
      <LinkButton label="Templates" href="/training/templates" />
      <LinkButton label="Add Exercise" href="/training/add-exercise" />
      <LinkButton label="Edit Exercise" href="/training/edit-exercise" />
      <LinkButton
        label="Workout Analytics"
        href="/training/workout-analytics"
      />
    </View>
  );
}
