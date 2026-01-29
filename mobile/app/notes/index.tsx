import AppText from "@/components/AppText";
import { NotebookPen, List } from "lucide-react-native";
import LinkButton from "@/components/buttons/LinkButton";
import PageContainer from "@/components/PageContainer";
import { View } from "react-native";

export default function SessionsScreen() {
  return (
    <PageContainer>
      <AppText className="text-2xl text-center mb-10">Notes</AppText>
      <View className="gap-4">
        <LinkButton label="Quick Notes" href="/notes/quick-notes">
          <NotebookPen color="#f3f4f6" />
        </LinkButton>
        <View className="border border-gray-400 rounded-md" />
        <LinkButton label="My Notes" href="/notes/my-notes">
          <List color="#f3f4f6" />
        </LinkButton>
      </View>
    </PageContainer>
  );
}
