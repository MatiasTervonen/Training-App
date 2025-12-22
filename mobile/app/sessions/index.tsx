import AppText from "@/components/AppText";
import {
  NotebookPen,
  Dumbbell,
  Timer,
  Weight,
  Bell,
  ListTodo,
  Activity,
} from "lucide-react-native";
import LinkButton from "@/components/buttons/LinkButton";
import PageContainer from "@/components/PageContainer";
import { View } from "react-native";

export default function SessionsScreen() {
  return (
    <PageContainer>
      <AppText className="text-2xl text-center mb-10">Start Sessions</AppText>
      <View className="gap-4">
        <LinkButton label="Gym" href="/training">
          <Dumbbell color="#f3f4f6" />
        </LinkButton>
        <LinkButton label="Activities" href="/activities">
          <Activity color="#f3f4f6" />
        </LinkButton>
        <LinkButton label="Notes" href="/notes">
          <NotebookPen color="#f3f4f6" />
        </LinkButton>
        {/* <LinkButton label="Disc-golf" href="/disc-golf">
          <Disc color="#f3f4f6" />
        </LinkButton> */}
        <LinkButton label="Timer" href="/timer">
          <Timer color="#f3f4f6" />
        </LinkButton>
        <LinkButton label="Body Weight" href="/weight">
          <Weight color="#f3f4f6" />
        </LinkButton>
        <LinkButton label="Todo List" href="/todo">
          <ListTodo color="#f3f4f6" />
        </LinkButton>
        <LinkButton label="Reminders" href="/reminders">
          <Bell color="#f3f4f6" />
        </LinkButton>
      </View>
    </PageContainer>
  );
}
