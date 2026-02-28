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
import { useTranslation } from "react-i18next";

export default function SessionsScreen() {
   const { t } = useTranslation();

  return (
    <PageContainer>
      <AppText className="text-2xl text-center mb-10">{t("sessions.title")}</AppText>
      <View className="gap-4">
        <LinkButton label={t("sessions.gym")} href="/gym">
          <Dumbbell size={20} color="#f3f4f6" />
        </LinkButton>
        <LinkButton label={t("sessions.activities")} href="/activities">
          <Activity size={20} color="#f3f4f6" />
        </LinkButton>
        <LinkButton label={t("sessions.notes")} href="/notes">
          <NotebookPen size={20} color="#f3f4f6" />
        </LinkButton>
        {/* <LinkButton label="Disc-golf" href="/disc-golf">
          <Disc size={20} color="#f3f4f6" />
        </LinkButton> */}
        <LinkButton label={t("sessions.timer")} href="/timer">
          <Timer size={20} color="#f3f4f6" />
        </LinkButton>
        <LinkButton label={t("sessions.bodyWeight")} href="/weight">
          <Weight size={20} color="#f3f4f6" />
        </LinkButton>
        <LinkButton label={t("sessions.todoList")} href="/todo">
          <ListTodo size={20} color="#f3f4f6" />
        </LinkButton>
        <LinkButton label={t("sessions.reminders")} href="/reminders">
          <Bell size={20} color="#f3f4f6" />
        </LinkButton>
      </View>
    </PageContainer>
  );
}
