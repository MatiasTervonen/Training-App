import { View } from "react-native";
import AppText from "../components/AppText";
import {
  NotebookPen,
  Dumbbell,
  Disc,
  Timer,
  Weight,
} from "lucide-react-native";
import LinkButton from "../components/LinkButton";
import Screen from "../components/Screen";

export default function SessionsScreen() {
  return (
    <Screen>
      <View className="flex items-center px-6">
        <AppText className="text-2xl text-center my-5">Start Sessions</AppText>
        <LinkButton href="/training">
          <AppText>Gym</AppText>
          <Dumbbell color="#f3f4f6" />
        </LinkButton>
        <LinkButton href="/notes">
          <AppText>Notes</AppText>
          <NotebookPen color="#f3f4f6" />
        </LinkButton>
        <LinkButton href="/disc-golf">
          <AppText>Disc-golf</AppText>
          <Disc color="#f3f4f6" />
        </LinkButton>
        <LinkButton href="/timer">
          <AppText>Timer</AppText>
          <Timer color="#f3f4f6" />
        </LinkButton>
        <LinkButton href="/weight">
          <AppText>Weight Tracker</AppText>
          <Weight color="#f3f4f6" />
        </LinkButton>
      </View>
    </Screen>
  );
}
