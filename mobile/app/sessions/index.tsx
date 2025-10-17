import { View } from "react-native";
import AppText from "@/components/AppText";
import {
  NotebookPen,
  Dumbbell,
  Disc,
  Timer,
  Weight,
} from "lucide-react-native";
import LinkButton from "@/components/LinkButton";

export default function SessionsScreen() {
  return (
    <View className="px-5 max-w-md mx-auto w-full">
      <AppText className="text-2xl text-center my-5">Start Sessions</AppText>
      <LinkButton label="Gym" href="/training">
        <Dumbbell color="#f3f4f6" />
      </LinkButton>
      <LinkButton label="Notes" href="/notes">
        <NotebookPen color="#f3f4f6" />
      </LinkButton>
      <LinkButton label="Disc-golf" href="/disc-golf">
        <Disc color="#f3f4f6" />
      </LinkButton>
      <LinkButton label="Timer" href="/timer">
        <Timer color="#f3f4f6" />
      </LinkButton>
      <LinkButton label="Weight Tracker" href="/weight">
        <Weight color="#f3f4f6" />
      </LinkButton>
    </View>
  );
}
