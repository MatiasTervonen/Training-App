import AppText from "@/components/AppText";
import { NotebookPen, List } from "lucide-react-native";
import LinkButton from "@/components/buttons/LinkButton";
import PageContainer from "@/components/PageContainer";
import { View } from "react-native";
import { useTranslation } from "react-i18next";

export default function SessionsScreen() {
  const { t } = useTranslation("notes");

  return (
    <PageContainer>
      <AppText className="text-2xl text-center mb-10">{t("notes.title")}</AppText>
      <View className="gap-4">
        <LinkButton label={t("notes.quickNotes")} href="/notes/quick-notes">
          <NotebookPen color="#f3f4f6" />
        </LinkButton>
        <View className="border border-gray-400 rounded-md" />
        <LinkButton label={t("notes.myNotes")} href="/notes/my-notes">
          <List color="#f3f4f6" />
        </LinkButton>
      </View>
    </PageContainer>
  );
}
