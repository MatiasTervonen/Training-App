import AppText from "@/components/AppText";
import {
  NotebookPen,
  Dumbbell,
  Disc,
  Timer,
  Weight,
  Bell,
} from "lucide-react-native";
import LinkButton from "@/components/LinkButton";
import PageContainer from "@/components/PageContainer";

export default function SessionsScreen() {
  return (
    <PageContainer className="gap-4">
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
      <LinkButton label="Body Weight" href="/weight">
        <Weight color="#f3f4f6" />
      </LinkButton>
      <LinkButton label="Reminders" href="/reminders">
        <Bell color="#f3f4f6" />
      </LinkButton>
    </PageContainer>
  );
}
